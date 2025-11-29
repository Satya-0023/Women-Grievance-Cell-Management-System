# 👩‍💼 Development of an Online Women's Grievance Cell Management System

The **Women's Grievance Cell Management System** is a specialized digital platform designed to provide a safe, confidential, and efficient way for women to report grievances and seek support within the **National Institute of Technology Sikkim (NIT Sikkim)**. This system is specifically tailored to address women's concerns, ensuring their voices are heard and their issues are resolved promptly.

This platform promotes a culture of safety, empowerment, and support for women, providing them with a secure environment to report any concerns and receive appropriate assistance.

---

## 🎯 Purpose

- 🛡️ **Provide a safe space** for women to report grievances confidentially.
- 🔄 **Streamline women's grievance redressal** through a specialized platform.
- 🧭 **Ensure faster routing and resolution** of women's issues with priority handling.
- 📬 **Keep users informed** with real-time updates and notifications.
- ✅ **Establish a transparent chain of responsibility** from submission to resolution.
- 💪 **Empower women** by giving them a voice and ensuring their concerns are addressed.

---

## ⏱️ Response & Resolution Timeline (SLA)

To ensure timely handling, each grievance follows a predefined **Service Level Agreement (SLA)**:

- ⌛ **Initial Response Time**:  
  Committee Members must respond within a set time based on the grievance urgency.

- 🕒 **Resolution Time**:  
  The assigned Committee Member must resolve the grievance within the final deadline.

- ⚠️ **Escalation Policy**:  
  If a grievance is not responded to or resolved within the SLA limits, it is **automatically escalated** to the next higher level:
  When an Admin assigns a complaint, they set a resolution **deadline**. If the assigned Committee Member fails to resolve the complaint by this deadline, the system **automatically escalates** it to the Admin for review. This ensures accountability and timely action.

This system ensures **accountability** and avoids grievance stagnation.

---

## 👥 User Roles & Hierarchy

The system supports a clear **role-based hierarchy** with tailored dashboards and permissions:
The system is built on a unified user model with flexible roles:

- 👩‍🎓 **Complainant (Female Student or Staff)**:

  - Any registered female student or staff member can submit a grievance.
  - Submit new grievances with a specific category.
  - Attach supporting documents or screenshots.
  - Track status in real-time using a Complaint ID.
  - View resolution and admin remarks.

- 🧑‍💼 **Committee Member**:

  - A user (typically 'Staff') with the `is_committee_member` flag set to true.
  - Can view and manage assigned grievances on their dashboard.
  - Post comments and updates for the complainant.
  - Mark grievances as resolved.

- 👨‍💻 **Admin**:
  - A user with the 'Admin' role.
  - Manages all user accounts, including appointing Committee Members.
  - Assigns new complaints and handles all escalated grievances.
  - Oversees the entire grievance flow and maintains records.
  - View analytics and system logs.

---

## 🔐 Key Features

- 🔒 **OTP-based login** for secure access and identity verification.
- 🗂️ **Categorized grievances** for targeted redressal (e.g., hostel, academics, mess).
- 🗂️ **Categorized grievances** for targeted redressal (e.g., Harassment, Safety, Discrimination).
- 📎 **File upload support** for evidence/document attachments.
- ✉️ **Email notifications** on submission, updates, and resolution.
- 🧾 **Unique Ticket ID generation** for each grievance.
- 🧑‍🤝‍🧑 **Multi-role support** for staff with dual roles.
- 🚨 **Auto-escalation of unresolved grievances** beyond SLA deadlines.
- 📊 **Admin dashboard** with summaries, filters, and user management tools.

---

## 🏛️ Departments Covered

This portal is exclusively for the **Women's Grievance Cell**, ensuring that all submitted grievances are handled by the appropriate authority with the necessary sensitivity and focus.

---

## 💡 Why This Matters

- Encourages **proactive problem-solving** instead of offline complaint queues.
- Reduces chances of **miscommunication and lost follow-ups**.
- Builds **student trust** in the institutional response system.
- Helps the administration **track and analyze trends** in student issues.
- Ensures **timely responses and accountability** through defined escalation policies.

---

## 🛠️ Tech Stack (Overview)

- **Frontend**: React.js, Tailwind CSS, Axios
- **Backend**: Node.js, Express.js, JWT Auth, Sequelize ORM
- **Database**: MySQL (using the `mysql2` library)
- **Email & OTP Services**: Nodemailer
- **Media Uploads**: ImageKit API
- **Other Tools**: dotenv, bcrypt, role-based middleware

---

## 📌 Note

This platform is built specifically for internal use at **NIT Sikkim** and is adaptable for other institutions with similar grievance redressal hierarchies.
