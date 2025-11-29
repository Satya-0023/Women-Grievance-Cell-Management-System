import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import axios from '../api/api.js'; // Use the configured axios instance
import logo from "../assets/NIT_Sikkim_Logo.png";

export default function ForgotPassword() {
    const [stage, setStage] = useState('request'); // 'request', 'verify', 'success'
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading('Requesting OTP...');
        try {
            await axios.post('/auth/forgot-password', { identifier: email });
            toast.success('OTP sent to your email.', { id: toastId });
            setStage('verify');
        } catch (err) {
            const message = err.response?.data?.error || 'Failed to send OTP.';
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        setIsLoading(true);
        const toastId = toast.loading('Resetting password...');
        try {
            await axios.post('/auth/reset-password', {
                identifier: email,
                otp,
                newPassword
            });
            toast.success('Password has been reset successfully!', { id: toastId });
            setStage('success');
        } catch (err) {
            const message = err.response?.data?.error || 'Failed to reset password.';
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        switch (stage) {
            case 'request':
                return (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                        <p className="text-center text-gray-600">Enter your registered email address to receive an OTP.</p>
                        <div>
                            <label className="block mb-1 font-medium">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" className="w-full border px-4 py-2 rounded-xl" required />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 disabled:bg-blue-400">
                            {isLoading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                );
            case 'verify':
                return (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <p className="text-center text-gray-600">An OTP has been sent to <strong>{email}</strong>. Please enter it below along with your new password.</p>
                        <div>
                            <label className="block mb-1 font-medium">OTP</label>
                            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" className="w-full border px-4 py-2 rounded-xl" required />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">New Password</label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full border px-4 py-2 rounded-xl" required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Confirm New Password</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full border px-4 py-2 rounded-xl" required />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 disabled:bg-blue-400">
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                );
            case 'success':
                return (
                    <div className="text-center space-y-4">
                        <p className="text-green-700 font-semibold">Your password has been successfully reset!</p>
                        <button onClick={() => navigate('/login')} className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700">
                            Proceed to Login
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-red-300 to-blue-300">
            <div className="relative z-10 bg-white/60 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="mb-6 text-center">
                    <img src={logo} alt="NIT Sikkim Logo" className="mx-auto h-10 w-auto" />
                    <h2 className="text-2xl font-semibold text-gray-800 mt-2">Reset Password</h2>
                </div>
                {renderContent()}
                <div className="mt-4 text-center">
                    <Link to="/login" className="text-blue-600 font-medium">Back to Login</Link>
                </div>
            </div>
        </div>
    );
}