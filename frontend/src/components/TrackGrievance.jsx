import { useState } from "react";
import { CheckCircle, Clock, Send, MessageSquare, UserCheck, ShieldCheck, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../api/api.js'; // Use the configured axios instance

export default function TrackGrievance() {
    const [grievanceId, setGrievanceId] = useState("");
    const [grievanceDetails, setGrievanceDetails] = useState(null);
    const [grievanceHistory, setGrievanceHistory] = useState([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleTrack = async () => {
        if (!grievanceId) {
            setError("Please enter a Grievance ID.");
            return;
        }
        setError("");
        setGrievanceDetails(null);
        setGrievanceHistory([]);
        setIsLoading(true);
        const toastId = toast.loading("Tracking grievance...");
        try {
            const encodedId = encodeURIComponent(grievanceId);
            const res = await axios.get(`/grievances/track/${encodedId}`);
            setGrievanceDetails(res.data.grievance);
            setGrievanceHistory(res.data.history || []);
            toast.success("Grievance found!", { id: toastId });
        } catch (err) {
            const message = err.response?.status === 404
                ? "Grievance not found. Please check the ID and try again."
                : "A server error occurred. Please try again later.";
            setError(message);
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const formatIST = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return "Invalid Date";
        }
        return date.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true,
        });
    };

    const getHistoryIcon = (actionType) => {
        // Match the action_taken values from the complaint_logs table
        switch (actionType.toUpperCase()) {
            case 'SUBMITTED':
            case 'CREATED': return <Send size={20} />;
            case 'ASSIGNED': return <UserCheck size={20} />;
            case 'RESOLVED': return <CheckCircle size={20} />;
            case 'ESCALATED': return <ShieldCheck size={20} />;
            default: return <Clock size={20} />;
        }
    };

    return (
        // --- UPDATED BACKGROUND COLOR ---
        <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-indigo-100 flex items-center justify-center px-4 py-12">
            <div className="container max-w-3xl mx-auto p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl text-center">
                <h1 className="text-4xl font-bold text-rose-800">Track Your Grievance</h1>
                <p className="text-lg text-gray-600 mt-4">
                    Enter your grievance ID below to check the real-time status.
                </p>

                {/* Input and Button */}
                <div className="mt-8 flex justify-center items-center gap-4 flex-wrap">
                    <input
                        type="text"
                        value={grievanceId}
                        onChange={(e) => setGrievanceId(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                        className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="e.g., 123"
                    />
                    <button onClick={handleTrack} disabled={isLoading} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors duration-200 disabled:bg-rose-400">
                        {isLoading ? "Tracking..." : "Track"}
                    </button>
                </div>

                {error && <p className="mt-6 text-red-600 font-semibold">{error}</p>}

                {/* Vertical Timeline */}
                {grievanceDetails && (
                    <div className="mt-10 text-left p-6 bg-white/60 rounded-lg border border-rose-100">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                            Complaint ID: <span className="font-mono text-rose-600">#{grievanceDetails.id}</span>
                        </h3>

                        {/* Resolution Details */}
                        {grievanceDetails.resolution && (
                            <div className="mb-8 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                                <h4 className="font-bold text-lg text-green-800">Grievance Resolved</h4>
                                <p className="text-sm text-gray-600"><strong>Action Taken:</strong> {grievanceDetails.resolution.action_taken}</p>
                                <p className="mt-2 text-gray-700"><strong>Remarks:</strong> {grievanceDetails.resolution.remarks}</p>
                                <p className="text-xs text-gray-500 mt-2">Resolved by {grievanceDetails.resolution.resolved_by_name} on {formatIST(grievanceDetails.resolution.resolution_date)}</p>
                            </div>
                        )}

                        {/* Evidence Section */}
                        {grievanceDetails.evidence && grievanceDetails.evidence.length > 0 && (
                            <div className="mb-8">
                                <h4 className="font-semibold text-lg text-gray-800 mb-2">Attached Evidence</h4>
                                <ul className="space-y-2">
                                    {grievanceDetails.evidence.map((file, index) => (
                                        <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                            <span className="flex items-center gap-2 text-sm text-gray-700"><FileText size={16} /> {file.file_name}</span>
                                            <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:text-rose-800"><Download size={18} /></a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="relative pl-8 border-l-2 border-gray-300">
                            {grievanceHistory.map((item, index) => (
                                <div key={index} className="mb-8 last:mb-0">
                                    {/* Icon on the timeline */}
                                    <div className="absolute -left-5 flex items-center justify-center w-10 h-10 bg-rose-600 text-white rounded-full ring-4 ring-white">
                                        {getHistoryIcon(item.action_taken)}
                                    </div>
                                    {/* Timeline content */}
                                    <div className="pl-4">
                                        <p className="text-sm text-gray-500">{formatIST(item.created_at)}</p>
                                        <h4 className="font-semibold text-lg text-gray-800">
                                            {item.action_taken.replace(/_/g, ' ')}
                                        </h4>
                                        <p className="text-sm text-gray-600">By: <strong>{item.actor_name}</strong></p>
                                        {item.remarks && (
                                            <p className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-gray-700">{item.remarks}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}