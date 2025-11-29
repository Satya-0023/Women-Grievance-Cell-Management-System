import { Link } from "react-router-dom";
import { TypeAnimation } from "react-type-animation";
import { FilePlus2, LineChart, History, FilePenLine, Briefcase, ShieldCheck, Crown, ArrowRight } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-indigo-100 flex flex-col justify-center items-center px-6 py-12">
            <div className="max-w-6xl w-full text-center">

                {/* --- UPDATED HEADING FOR WOMEN GRIEVANCE MANAGEMENT --- */}
                <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
                    <span className="block sm:hidden">
                        Women's Grievance Cell Management System
                    </span>
                    <span className="hidden sm:block">
                        <TypeAnimation
                            sequence={[
                                "Women's Grievance Cell Management System",
                                750,
                                "Safe Space for Women",
                                750,
                                "Empowering Women's Voice",
                                750,
                                "Support & Resolution",
                                750,
                            ]}
                            wrapper="span"
                            speed={50}
                            style={{ display: "inline-block" }}
                            repeat={Infinity}
                        />
                    </span>
                </h1>

                <p className="text-lg text-gray-700 mt-4 max-w-3xl mx-auto">
                    A dedicated platform for women to safely report grievances, seek support, and ensure timely resolution of their concerns.
                </p>

                {/* --- NEW ACTION CARDS --- */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <Link to="/submit-grievance" className="group block p-8 bg-white/50 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                        <div className="flex justify-center mb-4">
                            <FilePlus2 className="w-12 h-12 text-blue-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Submit a New Grievance</h2>
                        <p className="text-gray-600">Have an issue? Lodge your complaint here with all the necessary details and attachments.</p>
                    </Link>

                    <Link to="/track-grievance" className="group block p-8 bg-white/50 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                        <div className="flex justify-center mb-4">
                            <LineChart className="w-12 h-12 text-green-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Track Your Grievance</h2>
                        <p className="text-gray-600">Check the real-time status of your submitted grievances using your unique Complaint ID.</p>
                    </Link>

                    <Link to="/grievance-history" className="group block p-8 bg-white/50 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 md:col-span-1">
                        <div className="flex justify-center mb-4">
                            <History className="w-12 h-12 text-purple-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">My Grievance History</h2>
                        <p className="text-gray-600">View a complete history of all the grievances you have submitted in the past.</p>
                    </Link>
                </div>

                {/* --- NEW "HOW IT WORKS" SECTION --- */}
                <div className="mt-20 w-full">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">The Grievance Lifecycle</h2>
                    <p className="text-gray-700 mb-12">Follow the journey of your grievance through our structured resolution process.</p>

                    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-0">
                        {/* Step 1: Submission */}
                        <div className="p-6 bg-white/30 backdrop-blur-sm rounded-xl shadow-md w-full max-w-xs text-center">
                            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                                <FilePenLine className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">1. You Submit</h3>
                            <p className="mt-2 text-sm text-gray-600">Your grievance is securely logged with a unique Complaint ID.</p>
                        </div>

                        <ArrowRight className="w-12 h-12 text-gray-600/50 hidden lg:block mx-4" />

                        {/* Step 2: Assignment & Resolution */}
                        <div className="p-6 bg-white/30 backdrop-blur-sm rounded-xl shadow-md w-full max-w-xs text-center lg:transform lg:scale-105">
                            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full">
                                <Briefcase className="w-8 h-8 text-yellow-600" />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">2. Assignment & Resolution</h3>
                            <p className="mt-2 text-sm text-gray-600">An Admin assigns your case to a Committee Member who works to resolve it.</p>
                        </div>

                        <ArrowRight className="w-12 h-12 text-gray-600/50 hidden lg:block mx-4" />

                        {/* Step 3: Escalation */}
                        <div className="p-6 bg-white/30 backdrop-blur-sm rounded-xl shadow-md w-full max-w-xs text-center">
                            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                                <ShieldCheck className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">3. Escalation</h3>
                            <p className="mt-2 text-sm text-gray-600">If the deadline is missed, the case is automatically escalated to the Admin for final action.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}