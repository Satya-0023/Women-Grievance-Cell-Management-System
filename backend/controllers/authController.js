import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendOtpEmail, sendRegistrationEmail, sendGrievanceAssignedEmailToUser } from '../utils/mail.js';
import * as User from '../models/userModel.js'; // We will create this new model file
import ErrorResponse from '../utils/errorResponse.js';
const otpStore = new Map();

const generateToken = (user) => {
    // The payload contains the user's ID and their capabilities
    const payload = {
        id: user.user_id,
        email: user.email,
        user_role: user.user_role,
        is_committee_member: user.is_committee_member
    };
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
};

export const registerUser = async (req, res, next) => {
    const { name, email, password, gender, user_role, roll_no, designation } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return next(new ErrorResponse('Please enter a valid email address.', 400));
    }

    if (!['Student', 'Staff'].includes(user_role)) {
        return next(new ErrorResponse('Invalid user role for registration.', 400));
    }

    if (user_role === 'Student' && !roll_no) {
        return next(new ErrorResponse('Roll number is required for students.', 400));
    }

    try {
        const emailExists = await User.findByEmail(email);
        if (emailExists) {
            return next(new ErrorResponse('Email is already registered.', 400));
        }

        if (roll_no) {
            const rollNumberExists = await User.findByRollNumber(roll_no);
            if (rollNumberExists) {
                return next(new ErrorResponse('This Roll Number is already registered.', 400));
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
            name,
            email,
            password_hash: hashedPassword,
            gender,
            user_role,
            // CORRECTED LOGIC: Convert the boolean result to a number (1 for true, 0 for false) for database compatibility.
            is_committee_member: (user_role === 'Staff' && gender === 'Male') ? 1 : 0,
            roll_no: user_role === 'Student' ? roll_no : null,
            designation: user_role === 'Staff' ? designation : null,
        };

        await User.create(userData);

        try {
            await sendRegistrationEmail(email, name);
            res.status(201).json({ message: 'User registered successfully.' });
        } catch (emailError) {
            console.error("Registration successful, but failed to send welcome email:", emailError);
            res.status(201).json({ message: 'User registered successfully, but welcome email could not be sent.' });
        }
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findByEmail(email);

        // Security best practice: use a generic error for both wrong email and wrong password
        // to prevent attackers from knowing which one was incorrect.
        if (!user) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        // CRITICAL FIX: Ensure the user has a role assigned before proceeding.
        if (!user.user_role) {
            return next(new ErrorResponse('Your account is not configured correctly. Please contact an administrator.', 403));
        }

        // --- Credentials are valid, proceed with OTP logic ---

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(user.email, { otp: otp, createdAt: Date.now() });
        console.log(`OTP for login (${user.email}):`, otp);

        await sendOtpEmail(user.email, otp);
        res.status(200).json({ message: 'OTP sent to email', email: user.email });
    } catch (error) {
        next(error);
    }
};

export const verifyOtp = async (req, res, next) => {
    const { email, otp } = req.body;
    // Ensure both the submitted OTP and the stored OTP are treated as strings for a reliable comparison.
    const submittedOtp = String(otp).trim();
    const storedData = otpStore.get(email);

    if (!storedData || String(storedData.otp).trim() !== submittedOtp) {
        return next(new ErrorResponse('Incorrect OTP', 400));
    }

    const isExpired = (Date.now() - storedData.createdAt) > 60000; // 60 seconds
    if (isExpired) {
        otpStore.delete(email);
        return next(new ErrorResponse('OTP has expired. Please request a new one.', 400));
    }

    otpStore.delete(email);

    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return next(new ErrorResponse('User not found after OTP verification', 404));
        }

        // Generate JWT
        const token = generateToken(user);

        // Construct user payload with correct boolean flags
        const userPayload = {
            name: user.name,
            email: user.email,
            user_role: user.user_role,                // 'Student', 'Staff', 'Admin'
            can_complain: user.gender === 'Female',   // Only females can complain
            is_committee_member: Boolean(user.is_committee_member), // Converts DB boolean to JS boolean
            is_admin: user.user_role === 'Admin'      // Admin capability
        };

        // Ensure at least one role/capability is true to prevent frontend "no role" issue
        if (!userPayload.can_complain && !userPayload.is_committee_member && !userPayload.is_admin) {
            return next(new ErrorResponse('Your account does not have any role/capability assigned.', 403));
        }

        res.status(200).json({
            message: 'Login successful',
            token,
            user: userPayload
        });

    } catch (err) {
        console.error("Verify OTP error:", err);
        return next(new ErrorResponse("Server error during user role verification.", 500));
    } // <-- THIS CLOSING BRACE WAS MISSING
}; 

export const forgotPassword = async (req, res, next) => {
    const { identifier } = req.body;
    try {
        const foundUser = await User.findByEmail(identifier);

        if (!foundUser) {
            return next(new ErrorResponse('Email not found.', 404));
        }

        const email = foundUser.email;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        otpStore.set(email, { otp: otp, purpose: 'reset', createdAt: Date.now() });
        console.log(`OTP for password reset (${email}):`, otp);

        await sendOtpEmail(email, otp);
        res.status(200).json({ message: 'OTP has been sent to your registered email.' });

    } catch (err) {
        next(err);
    }
};

export const resetPassword = async (req, res, next) => {
    const { identifier, otp, newPassword } = req.body;
    const email = identifier;

    const storedData = otpStore.get(email);

    if (!storedData || storedData.otp !== otp || storedData.purpose !== 'reset') {
        return next(new ErrorResponse('Invalid OTP or request.', 400));
    }

    const isExpired = (Date.now() - storedData.createdAt) > 60000;
    if (isExpired) {
        otpStore.delete(email);
        return next(new ErrorResponse('OTP has expired. Please request a new one.', 400));
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const passwordUpdated = await User.updatePassword(email, hashedPassword);

        if (passwordUpdated) {
            otpStore.delete(email);
            res.status(200).json({ message: 'Password has been reset successfully.' });
        } else {
            next(new ErrorResponse('User not found during password update.', 404));
        }
    } catch (err) {
        next(err);
    }
};

export const getUserProfile = async (req, res, next) => {
    // The 'protect' middleware adds the user payload to req.user
    const email = req.user.email;

    if (!email) {
        return next(new ErrorResponse('User not found from token', 404));
    }
    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return next(new ErrorResponse('User profile not found', 404));
        }
        // Return only non-sensitive information
        res.json({ name: user.name, email: user.email, rollNumber: user.roll_no, designation: user.designation });
    } catch (err) {
        next(new ErrorResponse('Database error fetching user profile.', 500));
    }
};