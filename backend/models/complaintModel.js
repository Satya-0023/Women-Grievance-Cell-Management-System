import pool from '../config/db.js';

/**
 * Creates a new complaint in the database.
 * @param {object} complaintData - The data for the new complaint.
 * @param {object} [connection=pool.promise()] - Optional database connection for transactions.
 * @returns {Promise<number>} The ID of the newly created complaint.
 */
export const create = async (complaintData, connection = pool) => {
    const [result] = await connection.query('INSERT INTO complaints SET ?', [complaintData]);
    return result.insertId;
};

/**
 * Finds a complaint by its ID.
 * @param {number} id - The ID of the complaint to find.
 * @param {object} [connection=pool.promise()] - Optional database connection for transactions.
 * @returns {Promise<object|null>} The complaint object or null if not found.
 */
export const findById = async (id, connection = pool) => {
    const [rows] = await connection.query('SELECT * FROM complaints WHERE complaint_id = ?', [id]);
    return rows[0] || null;
};

/**
 * Finds all complaints submitted by a specific user.
 * @param {number} userId - The ID of the user to find complaints for.
 * @returns {Promise<Array>} An array of complaint objects.
 */
export const findAllByUserId = async (userId) => {
    const [rows] = await pool.query('SELECT * FROM complaints WHERE user_id = ?', [userId]);
    return rows;
};

/**
 * Finds all complaints assigned to a specific user.
 * @param {number} userId - The ID of the user (committee member).
 * @returns {Promise<Array>} An array of complaint objects.
 */
export const findAllByAssignedToId = async (userId) => {
    const [rows] = await pool.query(
        `SELECT complaint_id, title, status, updated_at as created_at 
         FROM complaints 
         WHERE assigned_to_user_id = ?`, 
        [userId]);
    return rows;
};

/**
 * Finds all complaints for the admin view.
 * @returns {Promise<Array>} An array of all complaint objects.
 */
export const findAll = async () => {
    const [rows] = await pool.query(
        `SELECT c.*, u.name as complainant_name 
         FROM complaints c 
         JOIN users u ON c.user_id = u.user_id 
         ORDER BY c.created_at DESC`
    );
    return rows;
};

/**
 * Updates the assignment of a complaint.
 * @param {number} id - The ID of the complaint to update.
 * @param {number} assignedToId - The ID of the user to assign the complaint to.
 * @param {string} status - The new status of the complaint.
 * @param {object} [connection=pool.promise()] - Optional database connection for transactions.
 * @returns {Promise<boolean>} True if the update was successful, false otherwise.
 */
export const updateAssignment = async (id, assignedToId, status, connection = pool) => {
    const [result] = await connection.query(
        'UPDATE complaints SET assigned_to_user_id = ?, status = ? WHERE complaint_id = ?',
        [assignedToId, status, id]
    );
    return result.affectedRows > 0;
};

/**
 * Updates the status of a complaint.
 * @param {number} id - The ID of the complaint to update.
 * @param {string} status - The new status of the complaint.
 * @param {object} [connection=pool.promise()] - Optional database connection for transactions.
 * @returns {Promise<boolean>} True if the update was successful, false otherwise.
 */
export const updateStatus = async (id, status, connection = pool) => {
    const [result] = await connection.query(
        'UPDATE complaints SET status = ? WHERE complaint_id = ?',
        [status, id]
    );
    return result.affectedRows > 0;
};

/**
 * Finds and automatically escalates all complaints that are past their deadline.
 * @param {object} [connection=pool] - Optional database connection for transactions.
 */
export const escalateOverdueComplaints = async (connection = pool) => {
    // Find a default admin to escalate to. In a larger system, this could be more complex.
    const [admins] = await connection.query("SELECT user_id FROM users WHERE user_role = 'Admin' LIMIT 1");
    if (admins.length === 0) {
        console.error("Auto-escalation failed: No admin user found to escalate to.");
        return 0; // No admin found
    }
    const adminId = admins[0].user_id;

    // Find all complaints that are 'In Progress' and past their deadline
    const [overdueComplaints] = await connection.query(
        "SELECT complaint_id, assigned_to_user_id FROM complaints WHERE status = 'In Progress' AND deadline < NOW()"
    );

    if (overdueComplaints.length === 0) {
        return 0; // No complaints to escalate
    }

    for (const complaint of overdueComplaints) {
        // 1. Update the complaint status to 'Escalated'
        await connection.query("UPDATE complaints SET status = 'Escalated' WHERE complaint_id = ?", [complaint.complaint_id]);

        // 2. Create an escalation record
        await connection.query("INSERT INTO escalations SET ?", [{
            complaint_id: complaint.complaint_id,
            reason: 'Resolution deadline was missed.',
            escalated_from_user_id: complaint.assigned_to_user_id,
            escalated_to_user_id: adminId
        }]);

        // 3. Log the automatic escalation event
        await connection.query("INSERT INTO complaint_logs SET ?", [{
            complaint_id: complaint.complaint_id,
            action_taken: 'Automatically Escalated',
            performed_by_user_id: adminId, // Logged as performed by the admin
            action_role: 'System',
            remarks: 'Complaint escalated automatically due to missed deadline.'
        }]);
    }

    return overdueComplaints.length; // Return the number of escalated complaints
};