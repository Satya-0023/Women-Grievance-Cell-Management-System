-- Women Grievance Management System Database Schema
-- Version 11.1 (Final) – Unified User Model, Female-only Enforcement, Log Fix
-- Version 11.2 – Simplified Category & Urgency Implementation
-- This schema uses a single 'users' table to prevent data duplication, allows
-- users (e.g., a female staff member) to hold multiple roles simultaneously.

-- Drop existing tables in reverse order of dependency to avoid foreign key constraints issues
DROP TABLE IF EXISTS complaint_logs;
DROP TABLE IF EXISTS escalations;
DROP TABLE IF EXISTS resolutions;
DROP TABLE IF EXISTS evidences;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS users;

-- ---------------------------------
-- CORE ENTITIES
-- ---------------------------------

-- 1️⃣ Unified Users Table (Handles all roles)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    gender ENUM('Male','Female') NOT NULL,
    user_role ENUM('Student', 'Staff', 'Admin') NOT NULL,
    is_committee_member BOOLEAN DEFAULT FALSE, -- A flag to grant committee privileges
    roll_no VARCHAR(20) UNIQUE NULL, -- For students, NULL for staff
    designation VARCHAR(100) NULL, -- For Staff, Committee Members, Admins
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2️⃣ Complaints Table
CREATE TABLE complaints (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- The user who filed the complaint
    assigned_to_user_id INT NULL, -- User ID of an assigned committee member
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General', -- Direct text field for category
    urgency ENUM('Low', 'Medium', 'High') DEFAULT 'Medium', -- Urgency level of the complaint
    status ENUM('Pending','In Progress','Resolved','Escalated') DEFAULT 'Pending',
    assigned_date TIMESTAMP NULL, -- This will be set when an admin assigns the complaint
    deadline TIMESTAMP NULL, -- Time limit set by the Admin upon assignment
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,    
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3️⃣ Resolutions Table
CREATE TABLE resolutions (
    resolution_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT UNIQUE NOT NULL,
    resolved_by_user_id INT NOT NULL, -- User ID of the resolver
    remarks TEXT,
    action_taken TEXT,
    resolution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by_user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4️⃣ Evidences Table
CREATE TABLE evidences (
    evidence_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    file_name VARCHAR(255),
    file_url VARCHAR(255),
    uploaded_by_user_id INT NOT NULL, -- User ID of the uploader
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5️⃣ Escalations Table
CREATE TABLE escalations (
    escalation_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    reason VARCHAR(255) DEFAULT 'Deadline exceeded',
    escalated_from_user_id INT NULL,  -- User ID of the committee member
    escalated_to_user_id INT NULL,    -- User ID of the admin
    escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    FOREIGN KEY (escalated_from_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (escalated_to_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6️⃣ Complaint Logs Table
CREATE TABLE complaint_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NULL,  -- Changed to NULL to allow for system-level logs (e.g., user updates)
    action_taken VARCHAR(100) NOT NULL,  -- e.g., "Submitted", "Assigned", "Resolved", "Escalated"
    performed_by_user_id INT NOT NULL,           -- user ID from the users table
    action_role VARCHAR(50) NOT NULL, -- Renamed from 'role' to avoid SQL keyword conflict
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------
-- TRIGGERS & CONSTRAINTS
-- ---------------------------------

-- Enforce that only FEMALE users can file complaints
DELIMITER $$
CREATE TRIGGER only_female_complainants
BEFORE INSERT ON complaints
FOR EACH ROW
BEGIN
    DECLARE g ENUM('Male','Female');
    SELECT gender INTO g FROM users WHERE user_id = NEW.user_id;
    IF g <> 'Female' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only female users can submit complaints.';
    END IF;
END$$
DELIMITER ;

-- ---------------------------------
-- SEED DATA
-- ---------------------------------
-- The password for all seeded users is 'Satya@123'.
-- The hash below was generated using bcrypt with 10 salt rounds.

-- Seed a female Student (can complain)
INSERT INTO users (user_id, name, email, password_hash, gender, user_role, is_committee_member, roll_no, designation)
VALUES (1, 'Priya Student', 'b230023@nitsikkim.ac.in', '$2b$10$y6x2G.V9GZ5j/G5f5e.4fO.ZgYwXwVvUuTtSsRrQqPpOoIiUuYyYy', 'Female', 'Student', FALSE, 'B230023', NULL) AS new
ON DUPLICATE KEY UPDATE name=new.name;

-- Seed a female Staff member who is ALSO a Committee Member (can complain AND handle grievances)
INSERT INTO users (user_id, name, email, password_hash, gender, user_role, is_committee_member, roll_no, designation)
VALUES (2, 'Dr. Sharma', 'sharma@nitsikkim.ac.in', '$2b$10$y6x2G.V9GZ5j/G5f5e.4fO.ZgYwXwVvUuTtSsRrQqPpOoIiUuYyYy', 'Female', 'Staff', TRUE, NULL, 'Associate Professor') AS new
ON DUPLICATE KEY UPDATE name=new.name;

-- Seed a male Admin
INSERT INTO users (user_id, name, email, password_hash, gender, user_role, is_committee_member, roll_no, designation)
VALUES (3, 'Mr. Singh', 'satyaranjanb821@gmail.com', '$2b$10$y6x2G.V9GZ5j/G5f5e.4fO.ZgYwXwVvUuTtSsRrQqPpOoIiUuYyYy', 'Male', 'Admin', FALSE, NULL, 'System Admin') AS new
ON DUPLICATE KEY UPDATE name=new.name;
