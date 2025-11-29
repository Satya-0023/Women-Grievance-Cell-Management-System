import bcrypt from 'bcrypt';
import pool from '../config/db.js'; // Use the direct pool export
import ErrorResponse from '../utils/errorResponse.js';
import * as User from '../models/userModel.js';
import * as Complaint from '../models/complaintModel.js';
import * as ComplaintLog from '../models/complaintLogModel.js';
import * as Escalation from '../models/escalationModel.js'; // Assuming you'll create this model

/**
 * @desc    Get all users for Admin management
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll();
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Update a user's role and committee membership
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
export const updateUserRoleAndMembership = async (req, res, next) => {
    const { id } = req.params;
    const { user_role, is_committee_member } = req.body;

    // Basic validation
    if (!user_role || !['Student', 'Staff', 'Admin'].includes(user_role)) {
        return next(new ErrorResponse('Invalid user role provided.', 400));
    }
    if (typeof is_committee_member !== 'boolean') {
        return next(new ErrorResponse('is_committee_member must be a boolean.', 400));
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const user = await User.findById(id, connection);
        if (!user) {
            throw new ErrorResponse('User not found.', 404);
        }

        // Business Rule: Only users with the 'Staff' role can be made committee members.
        if (is_committee_member === true && user_role !== 'Staff') {
            throw new ErrorResponse('Only users with the role "Staff" can be made committee members.', 400);
        }

        // Update user fields
        const [result] = await connection.query(
            'UPDATE users SET user_role = ?, is_committee_member = ? WHERE id = ?',
            [user_role, is_committee_member, id]
        );

        if (result.affectedRows === 0) {
            throw new ErrorResponse('Failed to update user.', 500);
        }

        // Log the action
        await ComplaintLog.create({
            complaint_id: null, // No specific complaint, this is a user management action
            action_taken: 'User Role Updated',
            performed_by: req.user.id,
            action_role: req.user.user_role,
            remarks: `Updated role of user ${user.name} (ID: ${id}) to ${user_role}, Committee Member: ${is_committee_member}`
        }, connection);

        await connection.commit();
        res.status(200).json({ success: true, message: 'User updated successfully.' });
    } catch (err) {
        await connection.rollback();
        next(err);
    }
};

/**
 * @desc    Get all complaints for Admin dashboard
 * @route   GET /api/admin/complaints/all
 * @access  Private/Admin
 */
export const getAllComplaints = async (req, res, next) => {
    try {
        const complaints = await Complaint.findAll(); // Assuming a findAll method in complaintModel
        res.status(200).json({ success: true, data: complaints });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get all unassigned complaints for Admin
 * @route   GET /api/admin/complaints/unassigned
 * @access  Private/Admin
 */
export const getUnassignedComplaints = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM complaints WHERE status = 'Pending' AND assigned_to IS NULL"
        );
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get all escalated complaints for Admin
 * @route   GET /api/admin/complaints/escalated
 * @access  Private/Admin
 */
export const getEscalatedComplaints = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            "SELECT c.*, e.reason AS escalation_reason, u_from.name AS escalated_from_name, u_to.name AS escalated_to_name " +
            "FROM complaints c " +
            "JOIN escalations e ON c.id = e.complaint_id " +
            "LEFT JOIN users u_from ON e.escalated_from = u_from.id " +
            "LEFT JOIN users u_to ON e.escalated_to = u_to.id " +
            "WHERE c.status = 'Escalated'"
        );
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get all assigned (In Progress) complaints for Admin
 * @route   GET /api/admin/complaints/assigned
 * @access  Private/Admin
 */
export const getAssignedComplaintsForAdmin = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT c.*, u.name as assigned_to_name 
             FROM complaints c 
             JOIN users u ON c.assigned_to = u.id 
             WHERE c.status = 'In Progress'`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get monthly grievance report
 * @route   GET /api/admin/reports/monthly
 * @access  Private/Admin
 */
export const getMonthlyGrievanceReport = async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                YEAR(assigned_date) as year,
                MONTHNAME(assigned_date) as month,
                COUNT(*) as total_complaints,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_complaints
            FROM
                complaints
            GROUP BY
                YEAR(assigned_date), MONTH(assigned_date), MONTHNAME(assigned_date)
            ORDER BY
                year DESC, MONTH(assigned_date) DESC
        `);

        // Calculate resolution rate
        const report = rows.map(row => ({
            ...row,
            resolution_rate: row.total_complaints > 0 ? ((row.resolved_complaints / row.total_complaints) * 100).toFixed(2) : 0
        }));

        res.status(200).json({ success: true, data: report });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get dashboard statistics for Admin
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getAdminDashboardStats = async (req, res, next) => {
    try {
        // --- AUTO-ESCALATION ---
        // Before fetching stats, check for and escalate any overdue complaints.
        await Complaint.escalateOverdueComplaints();

        const [totalComplaints] = await pool.query("SELECT COUNT(*) AS count FROM complaints");
        const [complaintsByStatus] = await pool.query("SELECT status, COUNT(*) AS count FROM complaints GROUP BY status");
        const [totalUsers] = await pool.query("SELECT COUNT(*) AS count FROM users");
        const [committeeMembers] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE is_committee_member = TRUE");

        // Transform status stats into a more accessible object
        const statusStats = complaintsByStatus.reduce((acc, item) => {
            acc[item.status.toLowerCase()] = item.count;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            data: {
                totalComplaints: totalComplaints[0]?.count || 0,
                complaintsByStatus: statusStats,
                totalUsers: totalUsers[0].count,
                committeeMembers: committeeMembers[0].count,
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Delete a complaint (Admin only)
 * @route   DELETE /api/admin/complaints/:id
 * @access  Private/Admin
 */
export const deleteComplaint = async (req, res, next) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        const [result] = await connection.query('DELETE FROM complaints WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            throw new ErrorResponse('Complaint not found or already deleted.', 404);
        }

        await ComplaintLog.create({
            complaint_id: id,
            action_taken: 'Deleted',
            performed_by: req.user.id,
            action_role: req.user.user_role,
            remarks: `Complaint (ID: ${id}) deleted by Admin.`
        }, connection);

        await connection.commit();
        res.status(200).json({ success: true, message: 'Complaint deleted successfully.' });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
};