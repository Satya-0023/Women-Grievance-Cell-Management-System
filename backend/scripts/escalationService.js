import pool from '../config/db.js';
import * as ComplaintLog from '../models/complaintLogModel.js';
import * as User from '../models/userModel.js';
import { sendEscalationNotification } from '../utils/mail.js';

/**
 * Checks for overdue complaints and escalates them to an Admin.
 *
 * This function implements the core business rule for automatic escalation:
 * 1. Finds all complaints that are 'In Progress' and past their deadline.
 * 2. For each overdue complaint, it:
 *    a. Updates the status to 'Escalated'.
 *    b. Creates a record in the `escalations` table.
 *    c. Creates a log entry in the `complaint_logs` table.
 * 3. Sends an email notification to the Admin.
 */
export const checkAndEscalateComplaints = async () => {
    const connection = pool; // Use the pool directly for transactions
    try {
        await connection.beginTransaction();

        // Find an Admin to escalate to. In a larger system, this could be a round-robin assignment.
        // For now, we'll just pick the first available Admin.
        const [admins] = await connection.query("SELECT id, email FROM users WHERE user_role = 'Admin' LIMIT 1");
        if (admins.length === 0) {
            console.log('Escalation check: No Admins found in the system. Skipping.');
            await connection.commit(); // Still commit to end the transaction.
            return;
        }
        const admin = admins[0];

        // Find all complaints that are 'In Progress' and have passed their deadline.
        const [overdueComplaints] = await connection.query(
            "SELECT id, title, assigned_to FROM complaints WHERE status = 'In Progress' AND deadline < NOW()"
        );

        if (overdueComplaints.length === 0) {
            console.log('Escalation check: No overdue complaints found.');
            await connection.commit();
            return;
        }

        console.log(`Found ${overdueComplaints.length} overdue complaints to escalate.`);

        for (const complaint of overdueComplaints) {
            // 1. Update the complaint status
            await connection.query("UPDATE complaints SET status = 'Escalated' WHERE id = ?", [complaint.id]);

            // 2. Create a record in the escalations table
            await connection.query('INSERT INTO escalations SET ?', {
                complaint_id: complaint.id,
                reason: 'Resolution deadline was exceeded.',
                escalated_from: complaint.assigned_to,
                escalated_to: admin.id
            });

            // 3. Log this action
            await ComplaintLog.create({
                complaint_id: complaint.id,
                action_taken: 'Auto-Escalated',
                performed_by: admin.id, // The system acts on behalf of the admin
                action_role: 'System',
                remarks: 'Complaint escalated automatically due to deadline breach.'
            }, connection);

            // 4. Send notification email
            const escalatedFromMember = complaint.assigned_to ? await User.findById(complaint.assigned_to, connection) : null;
            try {
                await sendEscalationNotification(complaint, escalatedFromMember, admin.email);
            } catch (emailError) {
                console.error(`Failed to send escalation email for complaint #${complaint.id}:`, emailError);
            }
        }

        await connection.commit();
        console.log('Escalation check completed successfully.');

    } catch (error) {
        await connection.rollback();
        console.error('--- CRON JOB: ESCALATION FAILED ---', error);
        // Re-throw the error so the calling API endpoint can report a 500 status
        throw error;
    } finally {
        // The pool manages connections, so we don't need to release it manually here.
    }
};