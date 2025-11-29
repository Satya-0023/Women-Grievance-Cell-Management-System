import { Shield } from 'lucide-react';

export default function About() {
    const teamMembers = [
        { id: 1, name: "System Administrator", role: "Admin", email: "admin.wgc@nitsikkim.ac.in", phone: "+91 88888 88888" },
        { id: 2, name: "WGC Committee Member", role: "Committee Member", email: "member.wgc@nitsikkim.ac.in", phone: "+91 77777 77777" },
    ];

    const otherContacts = [
        { id: 3, name: "Campus Security", role: "Security Incharge", email: "security@nitsikkim.ac.in", phone: "+91 99999 99992" },
        { id: 4, name: "Campus Counsellor", role: "Counsellor", email: "counsellor@nitsikkim.ac.in", phone: "+91 99999 99996" },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-300 to-blue-300 px-4">
            <div className="w-full max-w-5xl p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg my-12">
                <h1 className="text-3xl font-bold text-gray-800 text-center">Women Grievance Management System</h1>
                <p className="text-lg text-gray-700 mt-4 text-center">
                    A safe and confidential platform for women to report grievances and seek support.
                </p>
                <div className="mt-8 p-6 bg-pink-50 rounded-xl border-l-4 border-pink-400">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Our Mission</h2>
                    <p className="text-gray-700">
                        To provide a secure, confidential, and efficient platform for women to report grievances,
                        seek support, and ensure timely resolution of their concerns. We are committed to creating
                        a safe environment where every woman's voice is heard and respected.
                    </p>
                </div>

                {/* Our Process Section */}
                <div className="mt-10">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 pb-2">Our Process</h2>
                    <ol className="list-decimal list-inside space-y-4 text-gray-700">
                        <li>
                            <strong>Submission:</strong> A female student or staff member submits a grievance. A unique <strong>Complaint ID</strong> is generated for tracking.
                        </li>
                        <li>
                            <strong>Assignment:</strong> The grievance is reviewed by an <strong>Admin</strong>, who then assigns it to a <strong>Committee Member</strong> for investigation and resolution.
                        </li>
                        <li>
                            <strong>Resolution:</strong> The Committee Member works on the issue and updates the status. The complainant can track progress using their Complaint ID.
                        </li>
                        <li>
                            <strong>Escalation:</strong> If a grievance is not resolved by the deadline set by the Admin, it is automatically escalated directly to the <strong>Admin</strong> for review and further action, ensuring accountability.
                        </li>
                    </ol>
                </div>


                {/* Team Section */}
                <h2 className="text-2xl font-semibold text-gray-800 mt-10 text-center">Our Team</h2>
                <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="p-6 bg-white rounded-xl shadow-md transform hover:-translate-y-1 transition-transform duration-300">
                            <h3 className="text-xl font-semibold text-gray-800">{member.name}</h3>
                            <p className="text-gray-600 font-medium">{member.role}</p>
                            <p className="text-gray-600 mt-2">
                                📧 <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">{member.email}</a>
                            </p>
                            <p className="text-gray-600">📞 {member.phone}</p>
                        </div>
                    ))}
                </div>

                {/* Other Contacts Section */}
                <h2 className="text-2xl font-semibold text-gray-800 mt-10 text-center">Other Important Contacts</h2>
                <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherContacts.map((contact) => (
                        <div key={contact.id} className="p-6 bg-white rounded-xl shadow-md transform hover:-translate-y-1 transition-transform duration-300">
                            <h3 className="text-xl font-semibold text-gray-800">{contact.name}</h3>
                            <p className="text-gray-600">{contact.role}</p>
                            <p className="text-gray-600 mt-2">
                                📧 <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a>
                            </p>
                            <p className="text-gray-600">📞 {contact.phone}</p>
                        </div>
                    ))}
                </div>

                {/* Emergency Contacts */}
                <div className="mt-10 p-6 bg-red-50 rounded-xl border-l-4 border-red-400">
                    <h2 className="text-xl font-semibold text-red-800 mb-4">Emergency Contacts</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-red-700 font-semibold">Campus Security: +91 99999 99992</p>
                            <p className="text-red-700 font-semibold">Women Helpline: 181</p>
                        </div>
                        <div>
                            <p className="text-red-700 font-semibold">Police: 100</p>
                            <p className="text-red-700 font-semibold">Ambulance: 108</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}