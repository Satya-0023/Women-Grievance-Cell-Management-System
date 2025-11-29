import pool from '../config/db.js';

/**
 * Creates a new user in the database.
 * @param {object} userData - The data for the new user.
 * @param {object} [connection=pool] - Optional database connection for transactions.
 * @returns {Promise<number>} The ID of the newly created user.
 */
export const create = async (userData, connection = pool) => {
    const [result] = await connection.query('INSERT INTO users SET ?', [userData]);
    return result.insertId;
};

/**
 * Finds a user by their email address.
 * @param {string} email - The email of the user to find.
 * @param {object} [connection=pool] - Optional database connection for transactions.
 * @returns {Promise<object|null>} The user object or null if not found.
 */
export const findByEmail = async (email, connection = pool) => {
    const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
};

/**
 * Finds a user by their ID.
 * @param {number} id - The ID of the user to find.
 * @param {object} [connection=pool] - Optional database connection for transactions.
 * @returns {Promise<object|null>} The user object or null if not found.
 */
export const findById = async (id, connection = pool) => {
    const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
};

/**
 * Finds a user by their roll number.
 * @param {string} rollNo - The roll number of the user to find.
 * @returns {Promise<object|null>} The user object or null if not found.
 */
export const findByRollNumber = async (rollNo) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE roll_no = ?', [rollNo]);
    return rows[0] || null;
};

/**
 * Updates a user's password.
 * @param {string} email - The email of the user to update.
 * @param {string} passwordHash - The new hashed password.
 * @returns {Promise<boolean>} True if the update was successful, false otherwise.
 */
export const updatePassword = async (email, passwordHash) => {
    const [result] = await pool.query(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [passwordHash, email]
    );
    return result.affectedRows > 0;
};

/**
 * Finds all users who are designated as committee members.
 * @returns {Promise<Array>} An array of committee member user objects.
 */
export const findCommitteeMembers = async () => {
    const [rows] = await pool.query(
        `SELECT id, name, email, designation 
         FROM users 
         WHERE is_committee_member = TRUE`
    );
    return rows;
};

/**
 * Finds all users for the admin management view.
 * @returns {Promise<Array>} An array of all user objects.
 */
export const findAll = async () => {
    const [rows] = await pool.query(
        `SELECT id, name, email, gender, user_role, is_committee_member, roll_no, designation, created_at 
         FROM users 
         ORDER BY created_at DESC`
    );
    return rows;
};

/**
 * Finds all committee members, optionally excluding a specific user ID.
 * This is used to prevent a complainant from being assigned their own complaint.
 * @param {number|null} excludeId - The user ID to exclude from the list.
 * @returns {Promise<Array>} An array of committee member user objects.
 */
export const findAvailableCommitteeMembers = async (excludeId = null) => {
    let query = `SELECT id, name, email, designation FROM users WHERE is_committee_member = TRUE`;
    const params = [];
    if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
    }
    const [rows] = await pool.query(query, params);
    return rows;
};