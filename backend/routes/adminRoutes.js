import express from 'express';
import {
    getAllUsers,
    updateUserRoleAndMembership,
    getAllComplaints,
    getUnassignedComplaints,
    getEscalatedComplaints,
    getAssignedComplaintsForAdmin,
    getMonthlyGrievanceReport,
    getAdminDashboardStats,
    deleteComplaint
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authmiddleware.js';

const router = express.Router();

// Apply protect and authorize middleware to all routes in this file
router.use(protect, authorize('Admin'));

// User Management Routes
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserRoleAndMembership);

// Complaint Management Routes
router.get('/complaints/all', getAllComplaints);
router.get('/complaints/unassigned', getUnassignedComplaints);
router.get('/complaints/assigned', getAssignedComplaintsForAdmin);
router.get('/complaints/escalated', getEscalatedComplaints);
router.delete('/complaints/:id', deleteComplaint);

// Report Routes
router.get('/reports/monthly', getMonthlyGrievanceReport);

// Dashboard Stats Route
router.get('/stats', getAdminDashboardStats);

export default router;