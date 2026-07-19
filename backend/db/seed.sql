-- ============================================================
-- seed.sql — Sample Data for Hostel Complaint System
-- Run AFTER schema.sql
-- ============================================================

USE hostel_db;

-- ============================================================
-- USERS (passwords are bcrypt hashes)
-- admin123, staff123, student123
-- ============================================================
INSERT INTO users (full_name, email, password, role, room_number, is_active) VALUES
('Super Admin', 'admin@hostel.com', 'admin123', 'admin', NULL, TRUE),
('Ravi Kumar',   'ravi@hostel.com',  'Staff@123', 'staff', NULL, TRUE),
('Anita Singh',  'anita@hostel.com', 'admin123', 'staff', NULL, TRUE),
('Arjun Sharma', 'arjun@hostel.com', 'admin123', 'student', 'A-101', TRUE),
('Priya Verma',  'priya@hostel.com', 'admin123', 'student', 'B-205', TRUE),
('Kabir Singh',  'kabir@hostel.com', 'admin123', 'student', 'A-102', TRUE),
('Aditi Rao',    'aditi@hostel.com', 'admin123', 'student', 'C-303', TRUE),
('Suresh Raina', 'suresh@hostel.com','admin123', 'student', 'D-404', TRUE);

-- Staff profiles
INSERT INTO staff_profiles (staff_id, department, shift) VALUES
(2, 'maintenance',  'morning'),
(3, 'housekeeping', 'evening');

-- ============================================================
-- COMPLAINTS
-- ============================================================
INSERT INTO complaints (student_id, category, title, description, priority, status, assigned_to) VALUES
(4, 'electrical',   'Fan not working in room A101',          'The ceiling fan in my room stopped working 3 days ago. Room is very hot.',                                     'high',   'in_progress', 2),
(5, 'plumbing',     'Leaking tap in washroom',               'The tap near bed 2 in room A102 is leaking constantly. Water is being wasted.',                                 'medium', 'pending',     NULL),
(6, 'cleanliness',  'Corridor not cleaned for 3 days',       'The corridor on the 2nd floor (B block) has not been cleaned. Garbage is piling up near stairs.',               'medium', 'pending',     NULL),
(7, 'food',         'Stale food served at dinner',           'Yesterday at dinner, the dal served was stale and had a bad smell. Several students felt unwell.',               'high',   'resolved',    3),
(8, 'noise',        'Loud music from room C302 at midnight', 'Room C302 plays loud music after midnight regularly. This disturbs my sleep and studies.',                       'low',    'pending',     NULL),
(4, 'security',     'Main gate left open at night',          'The main hostel gate was found completely open at 2 AM on multiple occasions this week.',                       'high',   'in_progress', 2),
(5, 'electrical',   'Power socket not working',              'The power socket near my study table is not providing power. My laptop cannot be charged.',                     'medium', 'pending',     NULL),
(6, 'plumbing',     'Hot water not available in morning',    'Hot water supply is unavailable in B block from 6 AM to 8 AM despite being the designated time.',               'high',   'rejected',    2),
(7, 'other',        'Wi-Fi extremely slow in B block',       'Internet speed in B block is barely 0.5 Mbps. Online classes and submissions are severely affected.',            'medium', 'pending',     NULL),
(8, 'cleanliness',  'Mosquito breeding in stagnant water',   'There is stagnant water near the C block entrance. Mosquitoes are breeding there causing health concerns.',     'high',   'pending',     NULL);

-- ============================================================
-- COMPLAINT LOGS (manual entries + trigger will add more)
-- ============================================================
INSERT INTO complaint_logs (complaint_id, changed_by, old_status, new_status, remark) VALUES
(1, 1, 'pending',     'in_progress', 'Maintenance team dispatched. Electrician will visit tomorrow morning.'),
(4, 3, 'pending',     'in_progress', 'Kitchen supervisor informed. Food samples sent for testing.'),
(4, 3, 'in_progress', 'resolved',    'New food batch prepared. Kitchen staff warned. Issue resolved.'),
(6, 1, 'pending',     'in_progress', 'Security guard duty assignment updated. Night patrols increased.'),
(8, 2, 'pending',     'rejected',    'Hot water supply was functional as per maintenance records. Could not reproduce issue. Complaint rejected after investigation.');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (user_id, message, is_read) VALUES
(1, 'New complaint submitted: "Fan not working in room A101" by student ID #4 [HIGH priority]', TRUE),
(1, 'New complaint submitted: "Leaking tap in washroom" by student ID #5 [MEDIUM priority]', FALSE),
(1, 'New complaint submitted: "Main gate left open at night" by student ID #4 [HIGH priority]', FALSE),
(2, 'You have been assigned complaint #1. Please review and take action.', TRUE),
(2, 'You have been assigned complaint #6. Please review and take action.', FALSE),
(3, 'You have been assigned complaint #4. Please review and take action.', TRUE),
(4, 'Your complaint "Fan not working in room A101" status changed to: In Progress.', FALSE),
(7, 'Your complaint "Stale food served at dinner" has been marked as Resolved.', FALSE),
(8, 'Your complaint "Hot water not available in morning" has been Rejected.', FALSE);
