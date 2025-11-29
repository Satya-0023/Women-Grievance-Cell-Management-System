import { useState, useEffect, useRef } from "react";
import toast from 'react-hot-toast';
import { File, X } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';
import axios from '../api/api.js'; // Use the configured axios instance

// These are the categories your backend logic looks for.
// Providing them in a dropdown ensures the backend can correctly determine urgency.
const grievanceCategories = [
    "Academic Issue",
    "Hostel & Maintenance",
    "Harassment Issue",
    "Safety Concern/Threat",
    "Administrative Issue",
    "Library/Lab Issue",
    "General Inquiry"
];

export default function SubmitGrievance() {
    const [userData, setUserData] = useState({ name: "", email: "" });
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "", // This will hold the selected category string
        attachment: null,
        complainantName: "",
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch profile, departments, and locations in parallel
                const profileRes = await axios.get("/auth/profile");

                const profileData = profileRes.data;

                setUserData({ name: profileData.name, email: profileData.email });
                setFormData(prev => ({ ...prev, complainantName: profileData.name }));

            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                const message = err.response?.data?.error || "Failed to load form data.";
                setProfileError(message);
                toast.error(message);
            } finally {
                setProfileLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    const handleFileChange = e => {
        const file = e.target.files[0];
        if (!file) {
            setPreviewUrl(null);
            setFormData(p => ({ ...p, attachment: null }));
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File too large. Max size is 2MB.");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        setFormData(p => ({ ...p, attachment: file }));
        setPreviewUrl(URL.createObjectURL(file));
    };

    const removeAttachment = () => {
        setFormData(p => ({ ...p, attachment: null }));
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    const handleSubmit = async e => {
        e.preventDefault();
        setSubmitting(true);
        const toastId = toast.loading('Submitting grievance...');
        try {
            const data = new FormData();
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("category", formData.category); // Send category as a string
            if (formData.attachment) data.append("evidence", formData.attachment); // Corrected field name

            const res = await axios.post("/grievances", data);

            toast.success(
                (t) => (
                    <div>
                        Grievance submitted successfully.
                        <br />
                        Complaint ID: <strong>{res.data.complaintId}</strong>
                    </div>
                ),
                { id: toastId, duration: 6000 }
            );

            setFormData({
                title: "",
                description: "",
                category: "",
                attachment: null,
                complainantName: userData.name,
            });
            setPreviewUrl(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            const message = err.response?.data?.error || "Submission failed";
            console.error(err);
            toast.error(message, { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (profileLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-indigo-100 flex justify-center px-4 py-10">
                <div className="max-w-4xl w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
                    <SkeletonLoader />
                </div>
            </div>
        );
    }

    if (profileError) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center p-4">
                <p className="text-red-600 bg-red-100 p-4 rounded-lg shadow-md">{profileError} Please try logging in again.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-indigo-100 flex justify-center px-4 py-10">
            <div className="max-w-3xl w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-rose-100">
                <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
                    Submit a Women's Grievance
                </h2>
                <p className="text-center text-gray-600 mb-8">
                    Your voice matters. Report any concerns safely and confidentially.
                </p>

                <div className="mb-8 p-6 bg-rose-50/50 rounded-xl shadow-inner border border-rose-200">
                    <h3 className="font-semibold text-lg mb-4">Complainant Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                name="complainantName"
                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                                value={formData.complainantName}
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                                value={userData.email}
                                readOnly
                            />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                name="title"
                                className="w-full p-3 border border-gray-300 rounded-lg"
                                placeholder="Enter grievance title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                                required
                            >
                                <option value="">-- Select a Category --</option>
                                {grievanceCategories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <textarea
                            name="description"
                            className="w-full p-3 border border-gray-300 rounded-lg"
                            rows="4"
                            placeholder="Describe your grievance with room/office number"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attach Supporting Document (Max 2MB)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <File className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-rose-600 hover:text-rose-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-rose-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="attachment" type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF, PDF up to 2MB</p>
                            </div>
                        </div>
                        {formData.attachment && (
                            <div className="mt-2 flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                                <p className="text-sm text-gray-700 truncate">{formData.attachment.name}</p>
                                <button type="button" onClick={removeAttachment} className="text-red-500 hover:text-red-700">
                                    <X size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={submitting} className="w-full bg-rose-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-rose-700 transition-all disabled:bg-rose-400">
                        {submitting ? "Submitting..." : "Submit"}
                    </button>
                </form>
            </div>
        </div>
    );
}