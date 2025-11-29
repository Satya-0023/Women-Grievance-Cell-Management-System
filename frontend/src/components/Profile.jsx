import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import SkeletonLoader from './SkeletonLoader';
import { User, Mail, Hash, Briefcase } from 'lucide-react';
import axios from '../api/api.js'; // Import the configured axios instance

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('/auth/profile');
                setProfile(response.data);
            } catch (err) {
                const message = err.response?.data?.error || 'Failed to fetch profile.';
                setError(message);
                toast.error(message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const InfoField = ({ icon, label, value }) => (
        <div className="flex items-center gap-4 border-b py-3">
            <div className="text-rose-600">{icon}</div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="font-semibold text-gray-800">{value || 'N/A'}</p>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-indigo-100 flex justify-center px-4 py-10">
                <div className="max-w-2xl w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
                    <SkeletonLoader />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center p-4">
                <p className="text-red-600 bg-red-100 p-4 rounded-lg shadow-md">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-indigo-100 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">My Profile</h1>
                {profile && (
                    <div className="space-y-4">
                        <InfoField icon={<User />} label="Name" value={profile.name} />
                        <InfoField icon={<Mail />} label="Email Address" value={profile.email} />
                        {profile.rollNumber && <InfoField icon={<Hash />} label="Roll Number" value={profile.rollNumber} />}
                        {profile.designation && <InfoField icon={<Briefcase />} label="Designation" value={profile.designation} />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;