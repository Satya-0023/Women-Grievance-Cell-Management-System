import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqData = [
    {
        question: "What is the purpose of this portal?",
        answer: "This portal is a dedicated and confidential platform for women at NIT Sikkim to report grievances, seek support, and ensure their concerns are addressed in a timely and respectful manner."
    },
    {
        question: "Who can use this portal?",
        answer: "This portal is for all female students and staff members of NIT Sikkim. Male users can be appointed as Committee Members or Admins, but cannot submit grievances."
    },
    {
        question: "What happens after I submit a grievance?",
        answer: "Your grievance is assigned a unique Complaint ID. It is then reviewed by an Admin and assigned to a Committee Member. If it is not resolved within the specified time, it is automatically escalated back to the Admin to ensure it is addressed."
    },
    {
        question: "Can I submit a grievance confidentially?",
        answer: "All grievances are treated with a high degree of confidentiality. They are only visible to the assigned Committee Member and the system Admin to ensure your privacy. Your identity is protected throughout the process."
    },
    {
        question: "Can I track the progress of my grievance?",
        answer: "Yes, you can use the 'Track Your Grievance' feature on the home page. Simply enter the Complaint ID you received upon submission to see the real-time status and any comments or updates."
    },
    {
        question: "What is the difference between a Committee Member and an Admin?",
        answer: "A Committee Member is the person assigned to investigate and help resolve your grievance. The Admin oversees the entire system, assigns grievances, and handles cases that have been escalated due to delays."
    },
    {
        question: "What should I do in an emergency?",
        answer: "This portal is for non-emergency grievances. For any immediate threats or emergencies, please contact Campus Security or use the national emergency helplines (e.g., Police at 100, Women Helpline at 181)."
    }
];

const FaqItem = ({ faq, index, toggleFAQ, open }) => {
    return (
        <div className={`border-b border-gray-300 py-4 transition-all duration-300 ${open ? 'bg-pink-50 rounded-xl px-4' : ''}`}>
            <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center text-left text-lg sm:text-xl font-semibold text-gray-800 focus:outline-none"
                aria-expanded={open}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
            >
                <span>{faq.question}</span>
                <ChevronDown className={`transform transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>
            <div
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
                className={`overflow-hidden transition-all duration-500 ease-in-out ${open ? 'max-h-screen mt-4 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <p className="text-gray-700">{faq.answer}</p>
            </div>
        </div>
    );
};

export default function Faq() {
    const [openFAQ, setOpenFAQ] = useState(null);

    const toggleFAQ = index => {
        if (openFAQ === index) {
            return setOpenFAQ(null);
        }
        setOpenFAQ(index);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-300 to-blue-300 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8">
                <div className="flex justify-center mb-6">
                    <HelpCircle className="text-rose-500" size={48} />
                </div>
                <h1 className="text-4xl font-bold text-gray-800 text-center mb-2">
                    Frequently Asked Questions
                </h1>
                <p className="text-center text-gray-600 mb-8">
                    Find answers to common questions about our grievance portal.
                </p>
                <div className="space-y-4">
                    {faqData.map((faq, index) => (
                        <FaqItem
                            key={index}
                            faq={faq}
                            index={index}
                            toggleFAQ={toggleFAQ}
                            open={openFAQ === index}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}