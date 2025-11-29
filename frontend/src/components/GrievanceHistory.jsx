import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { ChevronUp, ChevronDown } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';
import axios from '../api/api.js'; // Import the configured axios instance

const GrievanceHistory = () => {
    const [grievances, setGrievances] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });

    useEffect(() => {
        const fetchGrievances = async () => {
            try {
                const response = await axios.get('/grievances/history');
                setGrievances(response.data);
            } catch (err) {
                const message = err.response?.data?.error || 'Failed to fetch grievance history.';
                setError(message);
                toast.error(message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGrievances();
    }, []);

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

    const getStatusClass = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800'; // Changed for better visibility
            case 'Escalated': return 'bg-red-100 text-red-800';
            case 'Submitted':
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    if (isLoading) return <div className="p-8"><SkeletonLoader /></div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-300 to-blue-300 py-12 px-4">
            <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">My Grievance History</h1>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-rose-50 text-rose-800 font-semibold">
                            <tr>
                                {['id', 'title', 'status', 'created_at'].map((key) => (
                                    <th key={key} className="p-3 cursor-pointer" onClick={() => requestSort(key)}>
                                        <div className="flex items-center gap-1">
                                            {key.replace(/_/g, ' ').toUpperCase()}
                                            {getSortIcon(key)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedGrievances.length > 0 ? sortedGrievances.map((g, index) => (
                                <tr key={g.complaint_id || index} className="border-t hover:bg-rose-100 transition-colors">
                                    <td className="p-3 font-mono text-sm">#{g.complaint_id}</td>
                                    <td className="p-3">{g.title}</td>
                                    <td className="p-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(g.status)}`}>
                                            {g.status}
                                        </span>
                                    </td>
                                    <td className="p-3">{new Date(g.updated_at).toLocaleDateString()}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="text-center p-4 text-gray-500">You have not submitted any grievances yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GrievanceHistory;