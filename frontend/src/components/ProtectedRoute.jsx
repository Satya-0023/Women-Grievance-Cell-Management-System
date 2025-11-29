import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, allowed }) => {
    const token = localStorage.getItem('token');
    const location = useLocation();
    
    let capabilities = {};
    try {
        capabilities = JSON.parse(localStorage.getItem('userCapabilities')) || {};
    } catch (e) {
        // If parsing fails, treat as unauthenticated
        localStorage.clear();
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!token) {
        // If the token is missing, the user is not authenticated.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if the user has at least one of the allowed capabilities
    const isAuthorized = allowed.some(permission => capabilities[permission] === true);

    useEffect(() => {
        if (!token) return; // Don't show error if they are already being redirected to login
        if (!isAuthorized) {
            toast.error("You do not have permission to access this page.", {
                id: 'auth-error', // Prevents duplicate toasts
            });
        }
    }, [isAuthorized, token]);

    if (!isAuthorized) {
        // Don't log them out, just send them to a safe page (like home or their dashboard)
        // Or show a dedicated "Unauthorized" page. For now, redirecting to home is safe.
        return <Navigate to="/home" replace />;
    }

    return children;
};

export default ProtectedRoute;