import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/NIT_Sikkim_Logo.png";
import background from "../assets/background.jpg";
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import axios from '../api/api.js'; // Use the configured axios instance

const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^a-zA-Z0-9]/)) score++;

    switch (score) {
        case 1:
            return { score, label: 'Weak', color: 'bg-red-500' };
        case 2:
            return { score, label: 'Medium', color: 'bg-yellow-500' };
        case 3:
            return { score, label: 'Good', color: 'bg-blue-500' };
        case 4:
            return { score, label: 'Strong', color: 'bg-green-500' };
        default:
            return { score: 0, label: 'Too short', color: 'bg-gray-200' };
    }
};

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        gender: "Female",
        user_role: "Student", // Default role
        roll_no: "",
        designation: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: 'bg-gray-200' });


    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };

        // If the role is changed to 'Student', automatically set gender to 'Female'.
        if (name === "user_role" && value === "Student") {
            newFormData.gender = "Female";
        }

        setFormData(newFormData);

        if (name === "password") {
            setPasswordStrength(checkPasswordStrength(value));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Registering...');

        // Prepare data for submission based on the new schema
        const submissionData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            gender: formData.gender,
            user_role: formData.user_role,
            roll_no: formData.user_role === 'Student' ? formData.roll_no : null,
            designation: formData.user_role === 'Staff' ? formData.designation : null,
        };

        try {
            await axios.post("/auth/register", submissionData);

            toast.success("Registration successful ✅", { id: toastId });
            navigate('/login'); // Redirect to login after successful registration
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.error || "Registration failed";
            toast.error(message, { id: toastId });
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden">
            <img src={background} alt="NIT Sikkim Campus" className="absolute inset-0 w-full h-full object-cover z-0" />
            <div className="relative z-10 bg-white/60 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-8">
                <button className="mb-4 text-blue-600 hover:underline text-sm" type="button" onClick={() => navigate("/login")}>
                    ← Back to Login
                </button>
                <div className="mb-6 text-center">
                    <img
                        src={logo}
                        alt="NIT Sikkim Logo"
                        className="mx-auto h-10 w-auto object-contain hover:scale-105 transition-transform duration-200"
                    />
                    <h2 className="text-2xl font-semibold text-gray-800 mt-2">Register</h2>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block mb-1 font-medium">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your Full Name"
                            className="w-full border px-4 py-2 rounded-xl"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email address"
                            className="w-full border px-4 py-2 rounded-xl"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
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
                        {formData.password && (
                            <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className={`${passwordStrength.color} h-1.5 rounded-full transition-all`} style={{ width: `${passwordStrength.score * 25}%` }}></div>
                                </div>
                                <p className="text-xs text-right mt-1" style={{ color: passwordStrength.color.replace('bg-', '') }}>{passwordStrength.label}</p>
                            </div>
                        )}
                    </div>

                    {/* New User Role Selector */}
                    <div>
                        <label className="block mb-1 font-medium">I am a</label>
                        <select name="user_role" value={formData.user_role} onChange={handleChange} className="w-full border px-4 py-2 rounded-xl">
                            <option value="Student">Student</option>
                            <option value="Staff">Staff</option>
                        </select>
                    </div>

                    {/* Conditional Fields */}
                    {formData.user_role === 'Student' && (
                        <div>
                            <label className="block mb-1 font-medium">Roll Number</label>
                            <input
                                type="text"
                                name="roll_no"
                                value={formData.roll_no}
                                onChange={handleChange}
                                placeholder="e.g., B230023"
                                className="w-full border px-4 py-2 rounded-xl"
                                required={formData.user_role === 'Student'}
                            />
                        </div>
                    )}
                    {formData.user_role === 'Staff' && (
                        <div>
                            <label className="block mb-1 font-medium">Designation</label>
                            <input
                                type="text"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                placeholder="e.g., Associate Professor"
                                className="w-full border px-4 py-2 rounded-xl"
                            />
                        </div>
                    )}

                    {/* The Gender selection is now conditional */}
                    {formData.user_role === 'Staff' && (
                        <div>
                            <label className="block mb-1 font-medium">Gender</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="Female"
                                        checked={formData.gender === "Female"}
                                        onChange={handleChange}
                                    />
                                    Female
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="Male"
                                        checked={formData.gender === "Male"}
                                        onChange={handleChange}
                                    />
                                    Male
                                </label>
                            </div>
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full px-4 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                    >
                        Register
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-sm">Already have an account?</p>
                    <Link to="/login" className="text-blue-600 font-medium">
                        Login here
                    </Link>
                </div>
            </div>
        </div>
    );
}