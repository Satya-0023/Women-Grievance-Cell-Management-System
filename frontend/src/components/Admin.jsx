import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, FileText, AlertTriangle, ShieldCheck, Send, Edit, Trash2, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import SkeletonLoader from './SkeletonLoader';
import Modal from './Modal';
import axios from '../api/api.js'; // Use the configured axios instance

const downloadCSV = (data, filename = 'report.csv') => {
    if (!data || data.length === 0) {
        toast.error("No data to download.");
        return;
    }
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + row[header]).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

export default function Admin() {
    const navigate = useNavigate();

    // State aligned with the new backend
    const [stats, setStats] = useState({});
    const [unassignedComplaints, setUnassignedComplaints] = useState([]);
    const [assignedComplaints, setAssignedComplaints] = useState([]);
    const [escalatedComplaints, setEscalatedComplaints] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [monthlyReport, setMonthlyReport] = useState([]);
    const [availableMembers, setAvailableMembers] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal States
    const [isAssignModalOpen, setAssignModalOpen] = useState(false);
    const [isEditUserModalOpen, setEditUserModalOpen] = useState(false);
    const [isResolveModalOpen, setResolveModalOpen] = useState(false); // New state for the resolve modal
    const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedGrievance, setSelectedGrievance] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [assignFormData, setAssignFormData] = useState({ assignedToId: '' });
    const [editUserFormData, setEditUserFormData] = useState({ user_role: 'Student', is_committee_member: false });
    const [resolveFormData, setResolveFormData] = useState({ action_taken: 'Addressed', remarks: '' }); // New state for resolve form
    
    const [complaintDetails, setComplaintDetails] = useState(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    const fetchData = async () => {
        try {
            const [statsRes, unassignedRes, assignedRes, escalatedRes, usersRes, reportRes] = await Promise.all([
                axios.get('/admin/stats'),
                axios.get('/admin/complaints/unassigned'),
                axios.get('/admin/complaints/assigned'), // Fetching the new data
                axios.get('/admin/complaints/escalated'),
                axios.get('/admin/users'),
                axios.get('/admin/reports/monthly'),
            ]);
            setStats(statsRes.data.data);
            setUnassignedComplaints(unassignedRes.data.data);
            setAssignedComplaints(assignedRes.data.data);
            setEscalatedComplaints(escalatedRes.data.data);
            setAllUsers(usersRes.data.data);
            setMonthlyReport(reportRes.data.data);
        } catch (err) {
            console.error("Fetch error:", err);
            const message = err.response?.data?.error || "Failed to load admin data.";
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        toast((t) => (
            <span className="flex flex-col items-center gap-2">
                Are you sure you want to logout?
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            localStorage.clear();
                            navigate("/login");
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                    >
                        Yes
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-gray-300 text-black px-3 py-1 rounded-md text-sm"
                    >
                        No
                    </button>
                </div>
            </span>
        ), {
            duration: 6000,
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openAssignModal = async (complaint) => {
        setSelectedGrievance(complaint);
        setAssignFormData({ assignedToId: '' });
        try {
            const res = await axios.get(`/grievances/${complaint.id}/available-members`);
            setAvailableMembers(res.data);
            setAssignModalOpen(true);
        } catch (err) {
            toast.error("Failed to fetch committee members.");
        }
    };

    const openDetailsModal = async (complaint) => {
        setSelectedGrievance(complaint);
        setDetailsModalOpen(true);
        setIsDetailsLoading(true);
        setComplaintDetails(null); // Clear previous details
        try {
            const res = await axios.get(`/grievances/${complaint.id}`);
            setComplaintDetails(res.data);
        } catch (err) {
            toast.error("Failed to fetch complaint details.");
            setDetailsModalOpen(false); // Close modal on error
        } finally {
            setIsDetailsLoading(false);
        }
    };


    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        if (!assignFormData.assignedToId) {
            return toast.error("Please select a member to assign.");
        }
        const toastId = toast.loading("Assigning complaint...");
        try {
            await axios.put(`/grievances/assign/${selectedGrievance.id}`, { assignedToId: assignFormData.assignedToId });
            toast.success("Complaint assigned successfully.", { id: toastId });
            setAssignModalOpen(false);
            fetchData(); // Re-fetch data to update the lists
        } catch (err) {
            const message = err.response?.data?.error || "Failed to assign complaint.";
            toast.error(message, { id: toastId });
        }
    };

    const openResolveModal = (complaint) => {
        setSelectedGrievance(complaint);
        setResolveFormData({ action_taken: 'Addressed', remarks: '' }); // Reset form
        setResolveModalOpen(true);
    };

    const handleResolveSubmit = async (e) => {
        e.preventDefault();
        if (!resolveFormData.remarks) {
            return toast.error("Resolution remarks are required.");
        }
        const toastId = toast.loading("Resolving grievance...");
        try {
            // The Admin uses the same resolution endpoint as a committee member
            await axios.put(`/grievances/resolve/${selectedGrievance.id}`, resolveFormData);
            toast.success("Grievance resolved successfully.", { id: toastId });
            setResolveModalOpen(false);
            fetchData(); // Re-fetch all data to update the dashboard
        } catch (err) {
            const message = err.response?.data?.error || "Failed to resolve grievance.";
            toast.error(message, { id: toastId });
        }
    };

    const openEditUserModal = (user) => {
        setSelectedUser(user);
        setEditUserFormData({
            user_role: user.user_role,
            is_committee_member: user.is_committee_member
        });
        setEditUserModalOpen(true);
    };

    const handleEditUserFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newFormData = { ...editUserFormData, [name]: type === 'checkbox' ? checked : value };

        // If the role is changed to something other than 'Staff', automatically uncheck 'is_committee_member'
        if (name === 'user_role' && value !== 'Staff') {
            newFormData.is_committee_member = false;
        }
        setEditUserFormData(newFormData);
    };

    const handleEditUserSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Updating user...");
        try {
            await axios.put(`/admin/users/${selectedUser.id}`, editUserFormData);
            toast.success("User updated successfully.", { id: toastId });
            setEditUserModalOpen(false);
            fetchData(); // Re-fetch data to update the user list
        } catch (err) {
            const message = err.response?.data?.error || "Failed to update user.";
            toast.error(message, { id: toastId });
        }
    };

    const handleDeleteComplaint = (complaintId) => {
        toast((t) => (
            <div className="flex flex-col items-center gap-2">
                <p>Are you sure you want to delete this complaint?</p>
                <div className="flex gap-4">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const deleteToastId = toast.loading("Deleting complaint...");
                            try {
                                await axios.delete(`/admin/complaints/${complaintId}`);
                                toast.success("Complaint deleted.", { id: deleteToastId });
                                fetchData(); // Refresh data
                            } catch (err) {
                                const message = err.response?.data?.error || "Failed to delete.";
                                toast.error(message, { id: deleteToastId });
                            }
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                    >
                        Yes, Delete
                    </button>
                    <button onClick={() => toast.dismiss(t.id)} className="bg-gray-300 text-black px-3 py-1 rounded-md text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        ));
    };

    const StatCard = ({ title, value, icon, color }) => (
        <div className={`bg-white p-6 rounded-lg shadow-md flex items-center ${color}`}>
            <div className="mr-4">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );

    const formatIST = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        return date.toLocaleString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true,
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        return date.toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };


    if (isLoading) return (
        <div className="min-h-screen bg-gradient-to-br from-red-300 to-blue-300 py-12 px-6">
            <div className="max-w-7xl mx-auto">
                <SkeletonLoader />
            </div>
        </div>
    );
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-600 font-semibold">Error: {error}</div>;

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-red-300 to-blue-300 py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
                        <button onClick={handleLogout} className="px-4 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500">Logout</button>
                    </div>

                    {/* New Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Total Complaints" value={stats?.totalComplaints || 0} icon={<FileText size={32} />} color="text-blue-500" />
                        <StatCard title="Pending / In Progress" value={(stats?.complaintsByStatus?.pending || 0) + (stats?.complaintsByStatus?.['in progress'] || 0)} icon={<AlertTriangle size={32} />} color="text-yellow-500" />
                        <StatCard title="Resolved" value={stats?.complaintsByStatus?.resolved || 0} icon={<ShieldCheck size={32} />} color="text-green-500" />
                        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={<Users size={32} />} color="text-purple-500" />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Unassigned Complaints</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="bg-blue-100">
                                    <tr>
                                        <th className="p-3">Complaint ID</th>
                                        <th className="p-3">Title</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Submitted On</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unassignedComplaints.map(c => (
                                        <tr key={c.id} className="border-t">
                                            <td className="p-3 font-mono text-sm">#{c.id}</td>
                                            <td className="p-3 font-semibold text-gray-800">{c.title}</td>
                                            <td className="p-3">{c.category}</td>
                                            <td className="p-3">{formatDate(c.assigned_date)}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openDetailsModal(c)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm py-1 px-2 rounded-md">View</button>
                                                    <button onClick={() => openAssignModal(c)} className="btn bg-blue-500 text-white hover:bg-blue-600 text-sm py-1 px-2 rounded-md">Assign</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {unassignedComplaints.length === 0 && <tr><td colSpan="5" className="p-3 text-center text-gray-500">No unassigned complaints.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Assigned Complaints Table */}
                    <div className="bg-white p-6 rounded-lg shadow mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-yellow-600">Assigned Complaints (In Progress)</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="bg-yellow-100">
                                    <tr>
                                        <th className="p-3">Complaint ID</th>
                                        <th className="p-3">Title</th>
                                        <th className="p-3">Assigned To</th>
                                        <th className="p-3">Deadline</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignedComplaints.map(c => (
                                        <tr key={c.id} className="border-t">
                                            <td className="p-3 font-mono text-sm">#{c.id}</td>
                                            <td className="p-3 font-semibold text-gray-800">{c.title}</td>
                                            <td className="p-3">{c.assigned_to_name}</td>
                                            <td className="p-3">{formatDate(c.deadline)}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openDetailsModal(c)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm py-1 px-2 rounded-md">View</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {assignedComplaints.length === 0 && <tr><td colSpan="5" className="p-3 text-center text-gray-500">No complaints currently in progress.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-red-600">Escalated Complaints</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="bg-red-100">
                                    <tr>
                                        <th className="p-3">Complaint ID</th>
                                        <th className="p-3">Title</th>
                                        <th className="p-3">Escalated From</th>
                                        <th className="p-3">Reason</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {escalatedComplaints.map(c => (
                                        <tr key={c.id} className="border-t">
                                            <td className="p-3 font-mono text-sm">#{c.id}</td>
                                            <td className="p-3 font-semibold text-gray-800">{c.title}</td>
                                            <td className="p-3">{c.escalated_from_name || 'N/A'}</td>
                                            <td className="p-3">{c.escalation_reason}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openDetailsModal(c)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm py-1 px-2 rounded-md">View</button>                                                   
                                                    <button onClick={() => openAssignModal(c)} className="btn bg-blue-500 text-white hover:bg-blue-600 text-sm py-1 px-2 rounded-md">Reassign</button>
                                                    <button onClick={() => openResolveModal(c)} className="btn bg-green-500 text-white hover:bg-green-600 text-sm py-1 px-2 rounded-md">Resolve</button>
                                                    <button onClick={() => handleDeleteComplaint(c.id)} className="btn bg-red-500 text-white hover:bg-red-600 text-sm py-1 px-2 rounded-md">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {escalatedComplaints.length === 0 && <tr><td colSpan="5" className="p-3 text-center text-gray-500">No escalated complaints.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-purple-600">Monthly Performance Report</h2>
                            <button
                                onClick={() => downloadCSV(monthlyReport, 'monthly_grievance_report.csv')}
                                className="px-4 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 text-sm"
                            >
                                Download Report
                            </button>
                        </div>
                        {monthlyReport.length > 0 && (
                            <div className="h-80 mb-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[...monthlyReport].reverse()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <XAxis dataKey="month" stroke="#4A5568" fontSize={12} />
                                        <YAxis />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="total_complaints" fill="#8884d8" name="Total Grievances" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="resolved_complaints" fill="#82ca9d" name="Resolved Grievances" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="bg-purple-100">
                                    <tr>
                                        <th className="p-3">Month</th>
                                        <th className="p-3">Year</th>
                                        <th className="p-3">Total Grievances</th>
                                        <th className="p-3">Resolved Grievances</th>
                                        <th className="p-3">Resolution Rate (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyReport.map((row, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="p-3 font-semibold">{row.month}</td>
                                            <td className="p-3">{row.year}</td>
                                            <td className="p-3 text-center">{row.total_complaints}</td>
                                            <td className="p-3 text-center">{row.resolved_complaints}</td>
                                            <td className="p-3 text-center font-bold">{row.resolution_rate}</td>
                                        </tr>
                                    ))}
                                    {monthlyReport.length === 0 && <tr><td colSpan="5" className="p-3 text-center text-gray-500">No monthly data available yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-2xl font-semibold mb-4">User Management</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">Committee Member</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.map(user => (
                                        <tr key={user.id} className="border-t hover:bg-gray-50">
                                            <td className="p-3">{user.name}</td>
                                            <td className="p-3">{user.email}</td>
                                            <td className="p-3">{user.user_role}</td>
                                            <td className="p-3">{user.is_committee_member ? 'Yes' : 'No'}</td>
                                            <td className="p-3">
                                                <button onClick={() => openEditUserModal(user)} className="btn bg-gray-500 text-white hover:bg-gray-600 text-sm py-1">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                title={`Assign Complaint #${selectedGrievance?.id}`}
                icon={<Send size={24} className="text-blue-600" />}
            >
                <form onSubmit={handleAssignSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Assign to Committee Member</label>
                        <select name="assignedToId" value={assignFormData.assignedToId}
                            onChange={(e) => setAssignFormData({ assignedToId: e.target.value })}
                            className="w-full p-2 border rounded-lg mt-1" required>
                            <option value="">Select a Member</option>
                            {availableMembers.map(m => (<option key={m.id} value={m.id}>{m.name} ({m.email})</option>))}
                        </select>
                    </div>
                    <button type="submit" className="w-full px-4 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500">
                        Confirm Assignment
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={isEditUserModalOpen}
                onClose={() => setEditUserModalOpen(false)}
                title={`Edit User: ${selectedUser?.name}`}
                icon={<Edit size={24} className="text-gray-600" />}
            >
                <form onSubmit={handleEditUserSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">User Role</label>
                        <select name="user_role" value={editUserFormData.user_role} onChange={handleEditUserFormChange} className="w-full p-2 border rounded-lg mt-1">
                            <option value="Student">Student</option>
                            <option value="Staff">Staff</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex items-center pt-2">
                        <input
                            type="checkbox"
                            id="is_committee_member"
                            name="is_committee_member"
                            checked={editUserFormData.is_committee_member}
                            onChange={handleEditUserFormChange}
                            disabled={editUserFormData.user_role !== 'Staff'} // Disable if not a Staff member
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-200 disabled:cursor-not-allowed"
                        />
                        <label htmlFor="is_committee_member" className={`ml-2 block text-sm ${editUserFormData.user_role !== 'Staff' ? 'text-gray-400' : 'text-gray-900'}`}>
                            Is Committee Member? (Staff only)
                        </label>
                    </div>
                    <button type="submit" className="w-full px-4 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-700 text-white hover:bg-gray-800 focus:ring-gray-500">
                        Save Changes
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={isResolveModalOpen}
                onClose={() => setResolveModalOpen(false)}
                title={`Resolve Complaint #${selectedGrievance?.id}`}
                icon={<ShieldCheck size={24} className="text-green-600" />}
            >
                <form onSubmit={handleResolveSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Resolution Outcome</label>
                        <select name="action_taken" value={resolveFormData.action_taken}
                            onChange={(e) => setResolveFormData({ ...resolveFormData, action_taken: e.target.value })}
                            className="w-full p-2 border rounded-lg mt-1">
                            <option value="Addressed">Addressed</option>
                            <option value="Mediated">Mediated</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Final Remarks</label>
                        <textarea name="remarks" value={resolveFormData.remarks} onChange={(e) => setResolveFormData({ ...resolveFormData, remarks: e.target.value })} className="w-full p-2 border rounded-lg mt-1" rows="3" placeholder="Provide a summary of the resolution..." required></textarea>
                    </div>
                    <button type="submit" className="w-full px-4 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-green-600 text-white hover:bg-green-700 focus:ring-green-500">Confirm Resolution</button>
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