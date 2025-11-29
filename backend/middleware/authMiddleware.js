import jwt from 'jsonwebtoken';
import ErrorResponse from '../utils/errorResponse.js';
import * as User from '../models/userModel.js'; // Import the new user model

export const protect = async (req, res, next) => { // Make the function async
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorResponse('Not authorized, no token', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the user from the database using await.
        // The findById model function already selects all fields ('SELECT *').
        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new ErrorResponse('No user found with this id', 404));
        }

        // 🔥 DEFINITIVE FIX: Normalize capability flags from the database (0/1) to booleans (true/false).
        // This ensures all subsequent authorization checks work with clean, predictable boolean values.
        user.is_committee_member = user.is_committee_member === 1;
        user.is_admin = user.user_role === "Admin";

        req.user = user;
        next();

    } catch (error) {
        // This will catch JWT errors like 'TokenExpiredError' or 'JsonWebTokenError'.
        return next(new ErrorResponse('Not authorized, token failed', 401));
    }
};

/**
 * @desc    Grant access to specific roles or capabilities
 * @param   {...string} allowed - A list of allowed roles or capabilities (e.g., 'Admin', 'is_committee_member')
 */
export const authorize = (...allowed) => (req, res, next) => {
    const user = req.user;
    if (!user) {
        return next(new ErrorResponse('Authentication error: User not found on request.', 401));
    }
    
    // 1. Check if the user's role (e.g., 'Student', 'Admin') is in the allowed list.
    if (allowed.includes(user.user_role)) {
        return next(); // Role is allowed, grant access.
    }

    // 2. Check if the user has a required capability flag (e.g., 'is_committee_member').
    // This works because we normalized the flags to true/false in the protect() middleware.
    for (const permission of allowed) {
        if (user[permission] === true) {
            return next(); // Capability is present, grant access.
        }
    }

    // If neither role nor capability matches, deny access.
    return next(new ErrorResponse(`Access Denied: You do not have the required permissions to access this resource.`, 403));
};