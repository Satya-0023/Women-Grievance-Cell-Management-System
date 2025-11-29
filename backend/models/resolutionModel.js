import pool from '../config/db.js';

/**
 * Creates a new resolution in the database.
 * @param {object} resolutionData - The data for the new resolution.
 * @param {object} [connection=pool.promise()] - Optional database connection for transactions.
 * @returns {Promise<number>} The ID of the newly created resolution.
 */
export const create = async (resolutionData, connection = pool) => {
    const [result] = await connection.query('INSERT INTO resolutions SET ?', [resolutionData]);
    return result.insertId;
};

/**
 * Finds a resolution by its complaint ID.
 * @param {number} complaintId - The ID of the complaint to find the resolution for.
 * @returns {Promise<object|null>} The resolution object or null if not found.
 */
export const findByComplaintId = async (complaintId) => {
    const [rows] = await pool.query('SELECT * FROM resolutions WHERE complaint_id = ?', [complaintId]);
    return rows[0] || null;
};

/**
 * Finds a resolution by its ID.
 * @param {number} id - The ID of the resolution to find.
 * @param {object} [connection=pool.promise()] - Optional database connection for transactions.
 * @returns {Promise<object|null>} The resolution object or null if not found.
 */
export const findById = async (id, connection = pool) => {
    const [rows] = await connection.query('SELECT * FROM resolutions WHERE id = ?', [id]);
    return rows[0] || null;
};