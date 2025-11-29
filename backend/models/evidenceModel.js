import pool from '../config/db.js';

/**
 * Creates a new evidence record in the database.
 * @param {object} evidenceData - The data for the new evidence record.
 * @param {object} [connection=pool.promise()] - Optional database connection for transactions.
 * @returns {Promise<number>} The ID of the newly created evidence record.
 */
export const create = async (evidenceData, connection = pool) => {
    const [result] = await connection.query('INSERT INTO evidences SET ?', [evidenceData]);
    return result.insertId;
};

/**
 * Finds all evidence records associated with a specific complaint ID.
 * @param {number} complaintId - The ID of the complaint to find evidence for.
 * @returns {Promise<Array>} An array of evidence objects.
 */
export const findAllByComplaintId = async (complaintId) => {
    const [rows] = await pool.query('SELECT * FROM evidences WHERE complaint_id = ?', [complaintId]);
    return rows;
};

/**
 * Finds a evidence by its ID.
 * @param {number} id - The ID of the evidence to find.
 * @param {object} [connection=pool.promise()] - Optional database connection for transactions.
 * @returns {Promise<object|null>} The evidence object or null if not found.
 */
export const findById = async (id, connection = pool) => {
    const [rows] = await connection.query('SELECT * FROM evidences WHERE id = ?', [id]);
    return rows[0] || null;
};