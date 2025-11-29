import express from 'express';
import multer from 'multer';
import {
    submitGrievance,
    trackGrievance,
    getAssignedGrievances,
    getAvailableCommitteeMembers,
    assignGrievance,
    resolveGrievance,
    getUserGrievanceHistory
} from '../controllers/grievanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- User/Complainant Routes ---
router.post('/', protect, authorize('Student', 'Staff'), upload.single('evidence'), submitGrievance);

// --- Admin & Committee Member Routes ---

// IMPORTANT: Specific routes must come BEFORE generic/parameterized routes.
router.get('/history', protect, authorize('Student', 'Staff', 'Admin'), getUserGrievanceHistory); // Get personal grievance history for a user.
router.get('/assigned', protect, authorize('is_committee_member', 'Admin'), getAssignedGrievances); // Get grievances assigned to a committee member.

// Only an Admin can see the list of available committee members for a specific complaint
router.get('/:id/available-members', protect, authorize('Admin'), getAvailableCommitteeMembers);

// Only an Admin can assign a grievance
router.put('/assign/:id', protect, authorize('Admin'), assignGrievance);

// A Committee Member or an Admin can resolve a grievance
router.put('/resolve/:id', protect, authorize('is_committee_member', 'Admin'), resolveGrievance);

// This generic route for tracking a specific grievance by its ID MUST be last among GET routes.
router.get('/:id', protect, trackGrievance);

export default router;