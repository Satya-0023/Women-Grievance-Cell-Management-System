import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/NIT_Sikkim_Logo.png";
import background from "../assets/background.jpg"; // Added background import
import OtpLoader from "./OtpLoader";
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react'; // Import icons
import axios from '../api/api.js'; // Use the configured axios instance

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otpRequested, setOtpRequested] = useState(false);
    const [otp, setOtp] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [isResendDisabled, setIsResendDisabled] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // State for password visibility
    const navigate = useNavigate();
    const location = useLocation();

    // This effect now checks for the token and redirects based on the new capability flags
    useEffect(() => {
        const token = localStorage.getItem('token');
        const capabilities = JSON.parse(localStorage.getItem('userCapabilities'));

        if (token && capabilities) {
            if (capabilities.is_admin) {
                navigate('/admin');
            } else if (capabilities.is_committee_member) {
                navigate('/committee-member');
            } else if (capabilities.can_complain) {
                navigate('/home');
            } else {
                // A valid user who can't do anything? Log them out.
                localStorage.clear();
            }
        }
    }, [navigate]);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else {
            setIsResendDisabled(false);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const startCountdown = () => {
        setCountdown(60);
        setIsResendDisabled(true);
    };

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please fill all fields");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Requesting OTP...');
        try {
            await axios.post("/auth/login", { email, password });
            setOtpRequested(true);
            toast.success("OTP sent to your registered email id", { id: toastId });
            startCountdown();
        } catch (err) {
            const message = err.response?.data?.error || "Login failed";
            toast.error("Error: " + message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading('Resending OTP...');
        try {
            await axios.post("/auth/login", { email, password });
            toast.success("OTP resent successfully", { id: toastId });
            startCountdown();
        } catch (err) {
            const message = err.response?.data?.error || "Resend failed";
            toast.error("Error: " + message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!otpRequested) {
            toast.error("Please request OTP first");
            return;
        }
        if (!otp) {
            toast.error("Please enter OTP");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Logging in...');
        try {
            const response = await axios.post("/auth/verify-otp", { email, otp });
            const data = response.data;

            // Store token, email, and the new capabilities object
            localStorage.setItem("token", data.token);
            localStorage.setItem("userEmail", email);
            localStorage.setItem("userCapabilities", JSON.stringify(data.user));

            toast.success("Login successful!", { id: toastId });

            // Redirect based on the new capabilities
            if (data.user.is_admin) {
                navigate("/admin");
            } else if (data.user.is_committee_member) {
                navigate("/committee-member");
            } else if (data.user.can_complain) {
                navigate("/home");
            } else {
                // Handle case for users with no specific role (e.g., male staff)
                toast.error("You do not have a specific role on this platform.");
                localStorage.clear(); // Log them out as they have no dashboard
            }

        } catch (err) {
            const message = err.response?.data?.error || "OTP verification failed";
            toast.error("Error: " + message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden">
            <img src={background} alt="NIT Sikkim Campus" className="absolute inset-0 w-full h-full object-cover z-0" />
            <div className="relative z-10 bg-white/60 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="mb-6 text-center">
                    <img src={logo} alt="NIT Sikkim Logo" className="mx-auto h-10 w-auto" />
                    <h2 className="text-2xl font-semibold text-gray-800 mt-2">Login</h2>
                </div>
                {/* The form's submit action now depends on the otpRequested state */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-medium">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your NIT Sikkim email id" className="w-full border px-4 py-2 rounded-xl" required />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full border px-4 py-2 rounded-xl"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <div className="mt-1 text-right">
                            <Link to="/forgot-password" className="text-blue-600 text-sm">Forgot Password?</Link>
                        </div>
                    </div>
                    {otpRequested && (
                        <div>
                            <label className="block mb-1 font-medium">OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter OTP"
                                className="w-full border px-4 py-2 rounded-xl"
                                required={otpRequested}
                                disabled={!otpRequested}
                            />
                            {countdown > 0 && (
                                <p className="text-xs text-center text-gray-500 mt-1">
                                    OTP expires in {countdown}s
                                </p>
                            )}
                        </div>
                    )}
                    {/* The main action button is now dynamic */}
                    {!otpRequested ? (
                        <button type="button" onClick={handleRequestOtp} className="w-full px-4 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500">Request OTP</button>
                    ) : (
                        <div className="flex space-x-2">
                            <button type="submit" className="flex-1 px-4 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500">Login</button>
                            <button type="button" onClick={handleResendOtp} className="flex-1 px-4 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 disabled:bg-gray-400" disabled={isResendDisabled}>
                                {isResendDisabled ? `Resend in ${countdown}s` : "Resend OTP"}
                            </button>
                        </div>
                    )}
                </form>
                <div className="mt-4 text-center">
                    <p className="text-sm">Don’t have an account?</p>
                    <Link to="/register" className="text-blue-600 font-medium">Register here</Link>
                </div>
            </div>
            {isLoading && <OtpLoader />}
        </div>
    );
}