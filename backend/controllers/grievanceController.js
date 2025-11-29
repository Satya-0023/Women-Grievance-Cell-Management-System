import {
    sendGrievanceStatusUpdateEmail,
    sendGrievanceAssignedEmailToUser,
    sendGrievanceAssignedEmailToCommitteeMember,
    sendTicketIdEmail
} from '../utils/mail.js';
import pool from '../config/db.js';
import * as User from '../models/userModel.js';
import * as Complaint from '../models/complaintModel.js';
import * as Resolution from '../models/resolutionModel.js';
import * as Evidence from '../models/evidenceModel.js';
import * as ComplaintLog from '../models/complaintLogModel.js';
import imagekit from '../config/imagekit.js'; // Use the new centralized config
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Calculates the resolution deadline based on business hours.
 * - Skips weekends (Saturday & Sunday).
 * - Considers business hours (9 AM to 5 PM).
 * - If submitted outside business hours, starts the clock from the next business day at 9 AM.
 * @param {number} slaHours - The number of business hours for resolution.
 * @returns {Date} The calculated deadline.
 */
const calculateDeadline = (slaHours) => {
    let deadline = new Date();
    const businessHoursStart = 9;
    const businessHoursEnd = 17;

    // If submitted on a weekend or outside business hours, adjust start time to the next business day at 9 AM.
    if (deadline.getDay() === 0) { // Sunday
        deadline.setDate(deadline.getDate() + 1);
        deadline.setHours(businessHoursStart, 0, 0, 0);
    } else if (deadline.getDay() === 6) { // Saturday
        deadline.setDate(deadline.getDate() + 2);
        deadline.setHours(businessHoursStart, 0, 0, 0);
    } else if (deadline.getHours() >= businessHoursEnd) { // After business hours
        deadline.setDate(deadline.getDate() + (deadline.getDay() === 5 ? 3 : 1)); // If Friday, jump to Monday
        deadline.setHours(businessHoursStart, 0, 0, 0);
    } else if (deadline.getHours() < businessHoursStart) { // Before business hours
        deadline.setHours(businessHoursStart, 0, 0, 0);
    }

    let remainingHours = slaHours;
    while (remainingHours > 0) {
        deadline.setHours(deadline.getHours() + 1);
        // If we go past business hours, move to the next day
        if (deadline.getHours() > businessHoursEnd) {
            deadline.setDate(deadline.getDate() + (deadline.getDay() === 5 ? 3 : 1));
            deadline.setHours(businessHoursStart, 0, 0, 0);
        }
        // Only decrement remaining hours during business hours on weekdays
        remainingHours--;
    }
    return deadline;
};

export const getUserGrievanceHistory = async (req, res, next) => {
    // req.user is populated by the 'protect' middleware
    const userId = req.user.id;
    try {
        const grievances = await Complaint.findAllByUserId(userId);
        res.json(grievances);
    } catch (err) {
        next(new ErrorResponse('DB error fetching grievance history', 500));
    }
};

export const submitGrievance = async (req, res, next) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const user = await User.findById(req.user.id, connection);
        if (!user) {
            return next(new ErrorResponse('Complainant user not found.', 404));
        }

        // CRITICAL: Enforce that only female users can submit a grievance.
        // This is also handled by a DB trigger, but a check here provides a cleaner error response.
        if (user.gender !== 'Female') {
            return next(new ErrorResponse('This action is restricted to female users only.', 403)); // 403 Forbidden
        }

        const userId = user.id;
        const { title, description, category } = req.body;
        // --- URGENCY-BASED DEADLINE LOGIC ---
        let urgency = 'Medium';
        let slaHours = 72; // 3 working days for Medium
        let resolveIn = "3 working days";

        if (category.toLowerCase().includes('harassment') || category.toLowerCase().includes('threat')) {
            urgency = 'High';
            slaHours = 24; // 1 working day
            resolveIn = "1 working day";
        } else if (category.toLowerCase().includes('academic') || category.toLowerCase().includes('hostel')) {
            urgency = 'Medium';
        } else {
            urgency = 'Low';
            slaHours = 120; // 5 working days
            resolveIn = "5 working days";
        }
        const deadline = calculateDeadline(slaHours);

        const complaintData = {
            complainant_id: userId,
            title,
            description,
            category,
            urgency,
            deadline
        };

        const complaintId = await Complaint.create(complaintData, connection);

        // Handle file upload and save to evidence table
        if (req.file && req.file.buffer && imagekit) {
            const uploadResponse = await imagekit.upload({
                file: req.file.buffer,
                fileName: `evidence_${complaintId}_${Date.now()}`,
                folder: "/evidence",
            });
            await Evidence.create({
                complaint_id: complaintId,
                file_name: req.file.originalname,
                file_url: uploadResponse.url,
                uploaded_by: userId
            }, connection);
        }

        // Create initial action log
        await ComplaintLog.create({
            complaint_id: complaintId,
            performed_by: userId,
            action_taken: 'Submitted',
            action_role: user.user_role,
            remarks: 'Complaint submitted by user.'
        }, connection);

        await connection.commit();

        // --- IMPROVEMENT: Respond to the user immediately after saving ---
        // The user should not have to wait for the email to be sent.
        res.status(201).json({ message: 'Grievance submitted successfully', complaintId });

        // --- Perform slower tasks in the background ---
        try {
            // Send the confirmation email after the response has been sent.
            await sendTicketIdEmail(user.email, user.name, complaintId, category, resolveIn);
        } catch (emailError) {
            console.error("Failed to send ticket ID email:", emailError);
            // Do not send another response here. Just log the error.
        }
    } catch (err) {
        await connection.rollback();
        console.error("--- GRIEVANCE SUBMISSION FAILED ---", err);
        next(err);
    } finally {
        if (connection) connection.release();
    }
};

/**
 * @desc    Get all grievances assigned to the currently logged-in committee member.
 * @route   GET /api/grievances/assigned
 * @access  Private/CommitteeMember
 */
export const getAssignedGrievances = async (req, res, next) => {
    try {
        // The user's ID is attached to the request by the 'protect' middleware
        const committeeMemberId = req.user.id;

        // Find all complaints where 'assigned_to' matches the logged-in user's ID
        const grievances = await Complaint.findAllByAssignedToId(committeeMemberId);

        res.status(200).json(grievances);
    } catch (err) {
        next(new ErrorResponse('Server error while fetching assigned grievances.', 500));
    }
};

export const trackGrievance = async (req, res, next) => {
    try {
        const { id } = req.params; // Use complaint ID
        const complaint = await Complaint.findById(id);

        if (!complaint) {
            return next(new ErrorResponse('Grievance not found', 404));
        }

        // --- REVISED AUTHORIZATION LOGIC ---
        const isComplainant = req.user.id === complaint.complainant_id;
        const isAdmin = req.user.user_role === 'Admin';
        // A committee member is only authorized if the complaint is specifically assigned to them.
        const isAssignedMember = req.user.is_committee_member === 1 && req.user.id === complaint.assigned_to;

        if (!isComplainant && !isAdmin && !isAssignedMember) {
            return next(new ErrorResponse('Not authorized to view this grievance', 403));
        }

        const logs = await ComplaintLog.findAllByComplaintId(complaint.id);
        const evidence = await Evidence.findAllByComplaintId(complaint.id);
        let resolution = null;

        if (complaint.status === 'Resolved') {
            resolution = await Resolution.findByComplaintId(complaint.id);
        }

        res.json({ grievance: { ...complaint, resolution, evidence }, history: logs });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get a list of committee members available to be assigned to a specific complaint.
 *          It excludes the original complainant from the list.
 * @route   GET /api/grievances/complaints/:id/available-members
 * @access  Private/Admin
 */
export const getAvailableCommitteeMembers = async (req, res, next) => {
    const { id } = req.params; // The ID of the complaint being assigned
    try {
        const complaint = await Complaint.findById(id);
        if (!complaint) {
            return next(new ErrorResponse('Complaint not found.', 404));
        }

        // Fetch committee members, excluding the person who filed the complaint.
        const results = await User.findAvailableCommitteeMembers(complaint.complainant_id);
        res.status(200).json(results);
    } catch (err) {
        next(new ErrorResponse('DB error fetching available committee members', 500));
    }
};

export const assignGrievance = async (req, res, next) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        const { id } = req.params; // complaint ID
        const { assignedToId } = req.body; // This is the user_id of the committee member
        const actor = req.user; // The admin assigning the grievance

        const complaint = await Complaint.findById(id, connection);
        if (!complaint) {
            throw new ErrorResponse('Grievance not found or could not be updated.', 404);
        }

        // Business Rule: Prevent self-assignment
        if (complaint.complainant_id === parseInt(assignedToId, 10)) {
            return next(new ErrorResponse('Cannot assign a complaint to the complainant.', 400));
        }

        await Complaint.updateAssignment(id, assignedToId, 'In Progress', connection);

        // Re-fetch the full complaint details to ensure all fields are available for the email
        const fullComplaint = await Complaint.findById(id, connection);
        const member = await User.findById(assignedToId, connection);
        const complainant = await User.findById(complaint.complainant_id, connection);

        if (!fullComplaint || !member || !complainant) {
            throw new ErrorResponse('Could not retrieve details for notification.', 404);
        }

        await ComplaintLog.create({
            complaint_id: complaint.id,
            performed_by: actor.id,
            action_taken: 'Assigned',
            action_role: actor.user_role,
            remarks: `Assigned to committee member: ${member.name}`
        }, connection);

        await connection.commit();

        try {
            await sendGrievanceAssignedEmailToUser(complainant.email, complainant.name, id);
            await sendGrievanceAssignedEmailToCommitteeMember(member.email, member.name, id, fullComplaint);
            res.status(200).json({ message: 'Grievance assigned successfully' });
        } catch (emailError) {
            console.error("Email sending failed:", emailError);
            res.status(200).json({ message: 'Grievance assigned, but failed to send notification emails.' });
        }
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
};

export const resolveGrievance = async (req, res, next) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        const { id } = req.params; // complaint ID
        const { action_taken, remarks } = req.body;
        const resolvedById = req.user.id; // User resolving the grievance

        const complaint = await Complaint.findById(id, connection);
        if (!complaint) {
            throw new ErrorResponse('Grievance not found.', 404);
        }

        // Security Enhancement: Ensure a committee member can only resolve complaints assigned to them.
        if (req.user.user_role !== 'Admin' && complaint.assigned_to !== resolvedById) {
            throw new ErrorResponse('You are not authorized to resolve this grievance.', 403);
        }

        await Complaint.updateStatus(complaint.id, 'Resolved', connection);

        await Resolution.create({
            complaint_id: complaint.id,
            resolved_by: resolvedById,
            action_taken,
            remarks
        }, connection);

        await ComplaintLog.create({
            complaint_id: complaint.id,
            performed_by: resolvedById,
            action_taken: 'Resolved',
            action_role: req.user.user_role,
            remarks: remarks,
        }, connection);

        await connection.commit();

        try {
            const complainant = await User.findById(complaint.complainant_id);
            if (complainant) {
                await sendGrievanceStatusUpdateEmail(complainant.email, complainant.name, id, 'Resolved');
            }
            res.status(200).json({ message: 'Grievance resolved successfully' });
        } catch (emailError) {
            console.error("Email sending failed:", emailError);
            res.status(200).json({ message: 'Grievance resolved, but failed to send notification email.' });
        }
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
};