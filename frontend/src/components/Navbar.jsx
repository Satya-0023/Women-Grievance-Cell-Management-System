import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import logo from "../assets/NIT_Sikkim_Logo.png";
import toast from 'react-hot-toast';

// A simple utility to parse the user capabilities from localStorage
const getUserCapabilities = () => {
    try {
        return JSON.parse(localStorage.getItem('userCapabilities')) || {};
    } catch (e) {
        return {};
    }
};

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setProfileOpen] = useState(false);
    const navigate = useNavigate();
    const profileRef = useRef(null);
    const location = useLocation();
    const userEmail = localStorage.getItem("userEmail") || "user@example.com";
    const capabilities = getUserCapabilities();

    const handleLogout = () => {
        toast((t) => (
            <span className="flex flex-col items-center gap-2">
                Are you sure you want to logout?
                <div className="flex gap-4 mt-2">
                    <button onClick={() => { toast.dismiss(t.id); localStorage.clear(); navigate("/login"); }}
                        className="inline-flex items-center justify-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200">
                        Yes
                    </button>
                    <button onClick={() => toast.dismiss(t.id)}
                        className="inline-flex items-center justify-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-700 bg-gray-300 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors duration-200">
                        No
                    </button>
                </div>
            </span>
        ), { duration: 6000 });
    };

    // Effect to close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileRef]);


    // Function to determine if a link is active
    const isActive = (path) => location.pathname === path;

    // --- CONTEXT-AWARE NAVIGATION LOGIC ---
    let navLinks = [];
    const specialLinks = [];

    // Determine the user's current "view" based on their primary capability and current location.
    // This ensures the navbar remains consistent even on shared pages like /profile.
    const isAdminView = capabilities.is_admin && location.pathname.startsWith('/admin');
    const isCommitteeView = capabilities.is_committee_member && !isAdminView && (location.pathname.startsWith('/committee-member') || location.pathname === '/profile');

    const isDualRole = capabilities.is_committee_member && capabilities.can_complain;

    if (isAdminView) {
        // No specific links needed for admin view in the main navbar
    } else if (isCommitteeView) {
        // In committee view, only show the "Switch to User View" link if they have dual roles.
        if (isDualRole) {
            specialLinks.push({ path: "/home", label: "Switch to User View" });
        }
    } else {
        // In user view, show all standard links
        navLinks = [
            { path: "/home", label: "Home" },
            { path: "/track-grievance", label: "Track Grievance" },
        ];
        if (capabilities.can_complain) {
            navLinks.push({ path: "/submit-grievance", label: "Submit Grievance" });
            navLinks.push({ path: "/grievance-history", label: "My Grievances" });
        }
        navLinks.push({ path: "/about", label: "About" }, { path: "/faq", label: "FAQs" });

        // And show the switch link if they are a committee member
        if (capabilities.is_committee_member) {
            specialLinks.push({ path: "/committee-member", label: "Switch to Committee View" });
        }
    }

    // This is the new, smarter logic to determine the correct "home" link
    const getHomeLink = () => {
        if (!capabilities || Object.keys(capabilities).length === 0) {
            return '/'; // If not logged in or no capabilities, go to public home
        }
        // Prioritize roles: Admin > Committee Member > Complainant
        if (capabilities.is_admin) {
            return '/admin';
        }
        if (capabilities.is_committee_member) {
            return '/committee-member';
        }
        if (capabilities.can_complain) {
            return '/home'; // The general user dashboard
        }
        // Fallback for users with no specific role (e.g., male staff not on committee)
        return '/profile';
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center px-4 py-3">
                <Link to={getHomeLink()}>
                    <img src={logo} alt="NIT Sikkim Logo" className="h-12 w-auto" />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-6 text-gray-700 font-medium">
                    {navLinks.map(link => (
                        <Link key={link.path} to={link.path}
                            className={`relative py-2 ${isActive(link.path) ? 'text-rose-600' : 'hover:text-rose-600'} transition-colors duration-300`}>
                            {link.label}
                            {isActive(link.path) && <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-rose-600"></span>}
                        </Link>
                    ))}
                    {/* Render the dual-role link separately for emphasis */}
                    {specialLinks.map(link => (
                        <Link key={link.path} to={link.path}
                            className="ml-4 px-3 py-1 rounded-md bg-indigo-100 text-indigo-700 font-semibold hover:bg-indigo-200 transition-colors duration-300">
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* User Profile Dropdown */}
                <div className="relative hidden md:block" ref={profileRef}>
                    <button onClick={() => setProfileOpen(!isProfileOpen)} className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        <User size={20} />
                    </button>
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl py-2 z-20">
                            <div className="px-4 py-2 text-sm text-gray-500 border-b">
                                Signed in as <br /><strong className="text-gray-800">{userEmail}</strong>
                            </div>
                            <Link to="/profile" onClick={() => setProfileOpen(false)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-rose-50">
                                My Profile
                            </Link>
                            <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-500 hover:text-white">
                                Logout
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <button onClick={() => setIsOpen(!isOpen)} className="text-gray-800">
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className="md:hidden px-4 pt-2 pb-4 space-y-2">
                    {navLinks.map((link) => (
                        <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)}
                            className={`block px-4 py-2 rounded-md text-base font-medium ${isActive(link.path) ? 'bg-rose-100 text-rose-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                            {link.label}
                        </Link>
                    ))}
                    {/* Dual role link for mobile */}
                    {specialLinks.map(link => (
                        <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)}
                            className="block px-4 py-2 rounded-md text-base font-medium bg-indigo-100 text-indigo-700">
                            {link.label}
                        </Link>
                    ))}
                    <div className="border-t border-gray-200 pt-4">
                        <div className="px-4 py-2 text-sm text-gray-500">
                            Signed in as <br /><strong className="text-gray-800">{userEmail}</strong>
                        </div>
                        <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-rose-50">
                            My Profile
                        </Link>
                        <button onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50">
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}