import ErrorResponse from '../utils/errorResponse.js';

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console for the developer
    console.error(err);

    // Handle specific MySQL errors for better client feedback
    if (err.code === 'ER_DUP_ENTRY') {
        const message = 'A record with this value already exists.';
        error = new ErrorResponse(message, 409); // 409 Conflict
    }

    // Handle JWT authentication errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Not authorized, token is invalid.';
        error = new ErrorResponse(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Not authorized, token has expired.';
        error = new ErrorResponse(message, 401);
    }

    // Handle generic validation errors from the database if needed
    if (err.code && err.code.startsWith('ER_')) {
        const message = 'A database validation error occurred.';
        error = new ErrorResponse(message, 400);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    });
};

export default errorHandler;