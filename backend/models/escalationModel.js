import pool from '../config/db.js';

/**
 * Creates a new escalation record in the database.
 * @param {object} escalationData - The data for the new escalation.
 * @param {object} [connection=pool.promise()] - Optional database connection for transactions.
 * @returns {Promise<number>} The ID of the newly created escalation record.
 */
export const create = async (escalationData, connection = pool) => {
    const [result] = await connection.query('INSERT INTO escalations SET ?', [escalationData]);
    return result.insertId;
};