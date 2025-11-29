import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronUp, ChevronDown, CheckCircle, Eye, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import SkeletonLoader from './SkeletonLoader';
import Modal from './Modal';
import axios from '../api/api.js'; // Use the configured axios instance

export default function CommitteeMember() {
    const [grievances, setGrievances] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
    const navigate = useNavigate();

    const [isResolveModalOpen, setResolveModalOpen] = useState(false);
    const [selectedGrievance, setSelectedGrievance] = useState(null);
    const [resolveFormData, setResolveFormData] = useState({ action_taken: 'Addressed', remarks: '' });

    const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
    const [complaintDetails, setComplaintDetails] = useState(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/grievances/assigned');
                setGrievances(res.data);
            } catch (err) {
                console.error("Fetch error:", err);
                const message = err.response?.data?.error || "Failed to fetch grievances.";
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []); // Empty dependency array means this runs once on mount

    // Added a fetchData function to be callable for refresh
    const refreshGrievances = async () => {
        setIsLoading(true);
        const res = await axios.get('/grievances/assigned');
        setGrievances(res.data);
        setIsLoading(false);
    };

    const sortedGrievances = useMemo(() => {
        let sortableItems = [...grievances];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [grievances, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
    };

    const openResolveModal = (grievance) => {
        setSelectedGrievance(grievance);
        setResolveFormData({ action_taken: 'Addressed', remarks: '' }); // Reset form
        setResolveModalOpen(true);
    };

    const openDetailsModal = async (grievance) => {
        setSelectedGrievance(grievance);
        setDetailsModalOpen(true);
        setIsDetailsLoading(true);
        setComplaintDetails(null);
        try {
            const res = await axios.get(`/grievances/${grievance.id}`);
            setComplaintDetails(res.data);
        } catch (err) {
            toast.error("Failed to fetch complaint details.");
            setDetailsModalOpen(false);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const handleResolveFormChange = (e) => {
        setResolveFormData({ ...resolveFormData, [e.target.name]: e.target.value });
    };

    const handleResolveSubmit = async (e) => {
        e.preventDefault();
        if (!resolveFormData.remarks) {
            toast.error("Resolution remarks are required.");
            return;
        }

        const toastId = toast.loading("Resolving grievance...");
        try {
            await axios.put(`/grievances/resolve/${selectedGrievance.id}`, {
                action_taken: resolveFormData.action_taken,
                remarks: resolveFormData.remarks
            });

            // Refresh the list of grievances
            refreshGrievances(); // Re-fetch data

            setResolveModalOpen(false);
            toast.success("Grievance resolved successfully!", { id: toastId });
        } catch (err) {
            const message = err.response?.data?.error || "Failed to resolve grievance.";
            toast.error(message, { id: toastId });
        }
    };

    const handleLogout = () => {
        toast((t) => (
            <span className="flex flex-col items-center gap-2">
                Are you sure you want to logout?
                <div className="flex gap-4">
                    <button onClick={() => { toast.dismiss(t.id); localStorage.clear(); navigate("/login"); }}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm">
                        Yes
                    </button>
                    <button onClick={() => toast.dismiss(t.id)}
                        className="bg-gray-300 text-black px-3 py-1 rounded-md text-sm">
                        No
                    </button>
                </div>
            </span>
        ), { duration: 6000 });
    };

    const formatIST = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        return date.toLocaleString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true,
        });
    };


    if (isLoading) return <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-indigo-100 p-8"><SkeletonLoader /></div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-indigo-100 py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-rose-800 tracking-tight">Committee Member Dashboard</h1>
                            <p className="text-gray-600 mt-1">Review and resolve assigned grievances.</p>
                        </div>
                        <button onClick={handleLogout} className="px-4 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500">
                            Logout
                        </button>
                    </div>

                    <div className="bg-white/90 border border-rose-100 shadow-md rounded-2xl p-6 backdrop-blur-sm mt-8">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="bg-rose-50 text-rose-800 font-semibold">
                                    <tr className="border-b border-rose-200">
                                        {['id', 'title', 'status', 'created_at'].map(key => (
                                            <th key={key} className="py-3 px-4 cursor-pointer" onClick={() => requestSort(key)}>
                                                <div className="flex items-center gap-1">{key.replace(/_/g, ' ').toUpperCase()}{getSortIcon(key)}</div>
                                            </th>
                                        ))}
                                        <th className="py-3 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedGrievances.length > 0 ? sortedGrievances.map(g => (
                                        <tr key={g.id} className="odd:bg-white even:bg-rose-50 hover:bg-rose-100 transition">
                                            <td className="py-3 px-4 font-mono text-sm">#{g.id}</td>
                                            <td className="py-3 px-4 font-semibold text-gray-800">{g.title}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${g.status === 'Resolved' ? 'bg-green-100 text-green-700' : g.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {g.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">{new Date(g.created_at).toLocaleDateString()}</td>
                                            <td className="py-3 px-4 flex items-center gap-2">
                                                <button onClick={() => openDetailsModal(g)} className="px-3 py-1 rounded-md font-semibold shadow-sm bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm">View Details</button>
                                                {g.status === 'In Progress' && (
                                                    <button onClick={() => openResolveModal(g)} className="px-3 py-1 rounded-md font-semibold shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 text-sm">
                                                        Resolve
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" className="text-center p-4 text-gray-500">No grievances assigned to you.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isResolveModalOpen} onClose={() => setResolveModalOpen(false)} title="Resolve Grievance" icon={<CheckCircle size={24} className="text-green-600" />}>
                {selectedGrievance && (
                    <div className="text-sm text-gray-500 mb-4 p-3 bg-gray-50 rounded-lg border">
                        <p><strong>Complaint ID:</strong> #{selectedGrievance.id}</p>
                        <p><strong>Title:</strong> {selectedGrievance.title}</p>
                    </div>
                )}
                <form onSubmit={handleResolveSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Resolution Outcome</label>
                        <select name="action_taken" value={resolveFormData.action_taken} onChange={handleResolveFormChange} className="w-full p-2 border rounded-lg mt-1">
                            <option value="Addressed">Addressed</option>
                            <option value="Mediated">Mediated</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Referred for Counseling">Referred for Counseling</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Final Remarks</label>
                        <textarea name="remarks" value={resolveFormData.remarks} onChange={handleResolveFormChange} className="w-full p-2 border rounded-lg mt-1" rows="3" placeholder="Provide a summary of the resolution..." required></textarea>
                    </div>
                    <button type="submit" className="w-full px-4 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-green-600 text-white hover:bg-green-700 focus:ring-green-500">
                        Confirm Resolution
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                title={`Details for Complaint #${complaintDetails?.grievance?.id || selectedGrievance?.id}`}
                icon={<Eye size={24} className="text-gray-600" />}
            >
                {isDetailsLoading || !complaintDetails ? <SkeletonLoader /> : (
                    <div className="space-y-6 text-sm">
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                            <h4 className="font-semibold text-gray-500 col-span-1">Title</h4>
                            <p className="text-gray-800 col-span-2">{complaintDetails?.grievance?.title}</p>

                            <h4 className="font-semibold text-gray-500 col-span-1">Submitted</h4>
                            <p className="text-gray-800 col-span-2">{formatIST(complaintDetails?.grievance?.assigned_date)}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-500 mb-1">Description</h4>
                            <p className="bg-gray-50 p-3 rounded-lg border text-gray-800">{complaintDetails?.grievance?.description}</p>
                        </div>
                        {complaintDetails?.grievance?.evidence?.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-500 mb-2">Evidence</h4>
                                <ul className="space-y-2">
                                    {complaintDetails.grievance.evidence.map(file => (
                                        <li key={file.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                                            <span className="flex items-center gap-2 text-gray-800"><FileText size={16} /> {file.file_name}</span>
                                            <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800"><Download size={16} /></a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}