/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: complaint_logs
# ------------------------------------------------------------

DROP TABLE IF EXISTS `complaint_logs`;
CREATE TABLE `complaint_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `complaint_id` int NOT NULL,
  `changed_by` int NOT NULL,
  `old_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remark` text COLLATE utf8mb4_unicode_ci,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `complaint_id` (`complaint_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `complaint_logs_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`) ON DELETE CASCADE,
  CONSTRAINT `complaint_logs_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 16 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: complaints
# ------------------------------------------------------------

DROP TABLE IF EXISTS `complaints`;
CREATE TABLE `complaints` (
  `complaint_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `category` enum(
  'electrical',
  'plumbing',
  'cleanliness',
  'food',
  'security',
  'noise',
  'other'
  ) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` enum('low', 'medium', 'high') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `status` enum('pending', 'in_progress', 'resolved', 'rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `assigned_to` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`complaint_id`),
  KEY `idx_complaint_status` (`status`),
  KEY `idx_complaint_student` (`student_id`),
  KEY `idx_complaint_assigned` (`assigned_to`),
  CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `complaints_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB AUTO_INCREMENT = 14 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: notifications
# ------------------------------------------------------------

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `notif_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notif_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 29 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: staff_profiles
# ------------------------------------------------------------

DROP TABLE IF EXISTS `staff_profiles`;
CREATE TABLE `staff_profiles` (
  `staff_id` int NOT NULL,
  `department` enum(
  'maintenance',
  'housekeeping',
  'security',
  'warden',
  'admin'
  ) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shift` enum('morning', 'evening', 'night') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`staff_id`),
  CONSTRAINT `staff_profiles_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('student', 'staff', 'admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_number` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE = InnoDB AUTO_INCREMENT = 13 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: complaint_stats_view
# ------------------------------------------------------------

CREATE OR REPLACE VIEW `complaint_stats_view` AS
select
  `complaints`.`category` AS `category`,
  count(0) AS `total`,
  sum((`complaints`.`status` = 'pending')) AS `pending`,
  sum((`complaints`.`status` = 'in_progress')) AS `in_progress`,
  sum((`complaints`.`status` = 'resolved')) AS `resolved`,
  sum((`complaints`.`status` = 'rejected')) AS `rejected`
from
  `complaints`
group by
  `complaints`.`category`;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: pending_complaints_view
# ------------------------------------------------------------

CREATE OR REPLACE VIEW `pending_complaints_view` AS
select
  `c`.`complaint_id` AS `complaint_id`,
  `u`.`full_name` AS `student_name`,
  `u`.`room_number` AS `room_number`,
  `u`.`email` AS `student_email`,
  `c`.`category` AS `category`,
  `c`.`title` AS `title`,
  `c`.`priority` AS `priority`,
  `c`.`status` AS `status`,
  `c`.`created_at` AS `created_at`
from
  (
  `complaints` `c`
  join `users` `u` on((`c`.`student_id` = `u`.`user_id`))
  )
where
  (`c`.`status` = 'pending')
order by
  field(`c`.`priority`, 'high', 'medium', 'low'),
  `c`.`created_at`;

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: complaint_logs
# ------------------------------------------------------------

INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    1,
    1,
    1,
    'pending',
    'in_progress',
    'Maintenance team dispatched. Electrician will visit tomorrow morning.',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    2,
    4,
    3,
    'pending',
    'in_progress',
    'Kitchen supervisor informed. Food samples sent for testing.',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    3,
    4,
    3,
    'in_progress',
    'resolved',
    'New food batch prepared. Kitchen staff warned. Issue resolved.',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    4,
    6,
    1,
    'pending',
    'in_progress',
    'Security guard duty assignment updated. Night patrols increased.',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    5,
    8,
    2,
    'pending',
    'rejected',
    'Hot water supply was functional as per maintenance records. Could not reproduce issue. Complaint rejected after investigation.',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    6,
    11,
    2,
    'pending',
    'in_progress',
    'Status auto-logged by system trigger',
    '2026-04-09 13:34:57'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    7,
    11,
    1,
    'pending',
    'in_progress',
    'Complaint assigned to staff ID: 2',
    '2026-04-09 13:34:57'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    8,
    11,
    1,
    'pending',
    'in_progress',
    'do it',
    '2026-04-09 13:34:57'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    9,
    11,
    2,
    'in_progress',
    'resolved',
    'Status auto-logged by system trigger',
    '2026-04-09 13:35:41'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    10,
    11,
    2,
    'in_progress',
    'resolved',
    'ehfehfhefhe afnadhaskd jahdkjashd',
    '2026-04-09 13:35:41'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    11,
    12,
    2,
    'pending',
    'in_progress',
    'Status auto-logged by system trigger',
    '2026-04-09 16:19:50'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    12,
    12,
    1,
    'pending',
    'in_progress',
    'Complaint assigned to staff ID: 2',
    '2026-04-09 16:19:50'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    13,
    12,
    1,
    'pending',
    'in_progress',
    'Do it fastly in the hostel section b',
    '2026-04-09 16:19:50'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    14,
    12,
    2,
    'in_progress',
    'resolved',
    'Status auto-logged by system trigger',
    '2026-04-09 16:20:54'
  );
INSERT INTO
  `complaint_logs` (
    `log_id`,
    `complaint_id`,
    `changed_by`,
    `old_status`,
    `new_status`,
    `remark`,
    `changed_at`
  )
VALUES
  (
    15,
    12,
    2,
    'in_progress',
    'resolved',
    'The work will be done .....',
    '2026-04-09 16:20:54'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: complaints
# ------------------------------------------------------------

INSERT INTO
  `complaints` (
    `complaint_id`,
    `student_id`,
    `category`,
    `title`,
    `description`,
    `priority`,
    `status`,
    `assigned_to`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    1,
    4,
    'electrical',
    'Fan not working in room A101',
    'The ceiling fan in my room stopped working 3 days ago. Room is very hot.',
    'high',
    'in_progress',
    2,
    '2026-04-09 13:24:12',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaints` (
    `complaint_id`,
    `student_id`,
    `category`,
    `title`,
    `description`,
    `priority`,
    `status`,
    `assigned_to`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    2,
    5,
    'plumbing',
    'Leaking tap in washroom',
    'The tap near bed 2 in room A102 is leaking constantly. Water is being wasted.',
    'medium',
    'pending',
    NULL,
    '2026-04-09 13:24:12',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaints` (
    `complaint_id`,
    `student_id`,
    `category`,
    `title`,
    `description`,
    `priority`,
    `status`,
    `assigned_to`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    3,
    6,
    'cleanliness',
    'Corridor not cleaned for 3 days',
    'The corridor on the 2nd floor (B block) has not been cleaned. Garbage is piling up near stairs.',
    'medium',
    'pending',
    NULL,
    '2026-04-09 13:24:12',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaints` (
    `complaint_id`,
    `student_id`,
    `category`,
    `title`,
    `description`,
    `priority`,
    `status`,
    `assigned_to`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    4,
    7,
    'food',
    'Stale food served at dinner',
    'Yesterday at dinner, the dal served was stale and had a bad smell. Several students felt unwell.',
    'high',
    'resolved',
    3,
    '2026-04-09 13:24:12',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaints` (
    `complaint_id`,
    `student_id`,
    `category`,
    `title`,
    `description`,
    `priority`,
    `status`,
    `assigned_to`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    5,
    8,
    'noise',
    'Loud music from room C302 at midnight',
    'Room C302 plays loud music after midnight regularly. This disturbs my sleep and studies.',
    'low',
    'pending',
    NULL,
    '2026-04-09 13:24:12',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaints` (
    `complaint_id`,
    `student_id`,
    `category`,
    `title`,
    `description`,
    `priority`,
    `status`,
    `assigned_to`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    6,
    4,
    'security',
    'Main gate left open at night',
    'The main hostel gate was found completely open at 2 AM on multiple occasions this week.',
    'high',
    'in_progress',
    2,
    '2026-04-09 13:24:12',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaints` (
    `complaint_id`,
    `student_id`,
    `category`,
    `title`,
    `description`,
    `priority`,
    `status`,
    `assigned_to`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    7,
    5,
    'electrical',
    'Power socket not working',
    'The power socket near my study table is not providing power. My laptop cannot be charged.',
    'medium',
    'pending',
    NULL,
    '2026-04-09 13:24:12',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaints` (
    `complaint_id`,
    `student_id`,
    `category`,
    `title`,
    `description`,
    `priority`,
    `status`,
    `assigned_to`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    8,
    6,
    'plumbing',
    'Hot water not available in morning',
    'Hot water supply is unavailable in B block from 6 AM to 8 AM despite being the designated time.',
    'high',
    'rejected',
    2,
    '2026-04-09 13:24:12',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaints` (
    `complaint_id`,
    `student_id`,
    `category`,
    `title`,
    `description`,
    `priority`,
    `status`,
    `assigned_to`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    9,
    7,
    'other',
    'Wi-Fi extremely slow in B block',
    'Internet speed in B block is barely 0.5 Mbps. Online classes and submissions are severely affected.',
    'medium',
    'pending',
    NULL,
    '2026-04-09 13:24:12',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaints` (
    `complaint_id`,
    `student_id`,
    `category`,
    `title`,
    `description`,
    `priority`,
    `status`,
    `assigned_to`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    10,
    8,
    'cleanliness',
    'Mosquito breeding in stagnant water',
    'There is stagnant water near the C block entrance. Mosquitoes are breeding there causing health concerns.',
    'high',
    'pending',
    NULL,
    '2026-04-09 13:24:12',
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `complaints` (
    `complaint_id`,
    `student_id`,
    `category`,
    `title`,
    `description`,
    `priority`,
    `status`,
    `assigned_to`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    11,
    4,
    'electrical',
    'washroom',
    'not cleanytfytfytfytryurytrtyrtyftfytftyfyfytfyt',
    'medium',
    'resolved',
    2,
    '2026-04-09 13:33:47',
    '2026-04-09 13:35:41'
  );
INSERT INTO
  `complaints` (
    `complaint_id`,
    `student_id`,
    `category`,
    `title`,
    `description`,
    `priority`,
    `status`,
    `assigned_to`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    12,
    4,
    'cleanliness',
    'NotClean',
    'Rooms are not clean in the hostel b setction',
    'high',
    'resolved',
    2,
    '2026-04-09 16:18:26',
    '2026-04-09 16:20:54'
  );
INSERT INTO
  `complaints` (
    `complaint_id`,
    `student_id`,
    `category`,
    `title`,
    `description`,
    `priority`,
    `status`,
    `assigned_to`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    13,
    9,
    'electrical',
    'Desk LAMP IS NOT WORKING...',
    'NOT WORKING XTZ........',
    'medium',
    'pending',
    NULL,
    '2026-04-10 16:35:26',
    '2026-04-10 16:35:26'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: notifications
# ------------------------------------------------------------

INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    1,
    1,
    'New complaint submitted: \"Fan not working in room A101\" by student ID #4 [HIGH priority]',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    2,
    1,
    'New complaint submitted: \"Leaking tap in washroom\" by student ID #5 [MEDIUM priority]',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    3,
    1,
    'New complaint submitted: \"Corridor not cleaned for 3 days\" by student ID #6 [MEDIUM priority]',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    4,
    1,
    'New complaint submitted: \"Stale food served at dinner\" by student ID #7 [HIGH priority]',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    5,
    1,
    'New complaint submitted: \"Loud music from room C302 at midnight\" by student ID #8 [LOW priority]',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    6,
    1,
    'New complaint submitted: \"Main gate left open at night\" by student ID #4 [HIGH priority]',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    7,
    1,
    'New complaint submitted: \"Power socket not working\" by student ID #5 [MEDIUM priority]',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    8,
    1,
    'New complaint submitted: \"Hot water not available in morning\" by student ID #6 [HIGH priority]',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    9,
    1,
    'New complaint submitted: \"Wi-Fi extremely slow in B block\" by student ID #7 [MEDIUM priority]',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    10,
    1,
    'New complaint submitted: \"Mosquito breeding in stagnant water\" by student ID #8 [HIGH priority]',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    11,
    1,
    'New complaint submitted: \"Fan not working in room A101\" by student ID #4 [HIGH priority]',
    1,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    12,
    1,
    'New complaint submitted: \"Leaking tap in washroom\" by student ID #5 [MEDIUM priority]',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    13,
    1,
    'New complaint submitted: \"Main gate left open at night\" by student ID #4 [HIGH priority]',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    14,
    2,
    'You have been assigned complaint #1. Please review and take action.',
    1,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    15,
    2,
    'You have been assigned complaint #6. Please review and take action.',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    16,
    3,
    'You have been assigned complaint #4. Please review and take action.',
    1,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    17,
    4,
    'Your complaint \"Fan not working in room A101\" status changed to: In Progress.',
    1,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    18,
    7,
    'Your complaint \"Stale food served at dinner\" has been marked as Resolved.',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    19,
    8,
    'Your complaint \"Hot water not available in morning\" has been Rejected.',
    0,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    20,
    1,
    'New complaint submitted: \"washroom\" by student ID #4 [MEDIUM priority]',
    0,
    '2026-04-09 13:33:47'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    21,
    2,
    'You have been assigned complaint #11. Please review and take action.',
    0,
    '2026-04-09 13:34:57'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    22,
    4,
    'Your complaint \"washroom\" status updated to: in progress.',
    1,
    '2026-04-09 13:34:57'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    23,
    4,
    'Your complaint \"washroom\" status has been updated to: resolved.',
    1,
    '2026-04-09 13:35:41'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    24,
    1,
    'New complaint submitted: \"NotClean\" by student ID #4 [HIGH priority]',
    0,
    '2026-04-09 16:18:26'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    25,
    2,
    'You have been assigned complaint #12. Please review and take action.',
    0,
    '2026-04-09 16:19:50'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    26,
    4,
    'Your complaint \"NotClean\" status updated to: in progress.',
    0,
    '2026-04-09 16:19:50'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    27,
    4,
    'Your complaint \"NotClean\" status has been updated to: resolved.',
    0,
    '2026-04-09 16:20:54'
  );
INSERT INTO
  `notifications` (
    `notif_id`,
    `user_id`,
    `message`,
    `is_read`,
    `created_at`
  )
VALUES
  (
    28,
    1,
    'New complaint submitted: \"Desk LAMP IS NOT WORKING...\" by student ID #9 [MEDIUM priority]',
    0,
    '2026-04-10 16:35:26'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: staff_profiles
# ------------------------------------------------------------

INSERT INTO
  `staff_profiles` (`staff_id`, `department`, `shift`)
VALUES
  (2, 'maintenance', 'morning');
INSERT INTO
  `staff_profiles` (`staff_id`, `department`, `shift`)
VALUES
  (3, 'housekeeping', 'evening');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: users
# ------------------------------------------------------------

INSERT INTO
  `users` (
    `user_id`,
    `full_name`,
    `email`,
    `password`,
    `role`,
    `room_number`,
    `phone`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    1,
    'Super Admin',
    'admin@hostel.com',
    'admin123',
    'admin',
    NULL,
    NULL,
    1,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `users` (
    `user_id`,
    `full_name`,
    `email`,
    `password`,
    `role`,
    `room_number`,
    `phone`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    2,
    'Ravi Kumar',
    'ravi@hostel.com',
    'Staff@123',
    'staff',
    NULL,
    NULL,
    1,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `users` (
    `user_id`,
    `full_name`,
    `email`,
    `password`,
    `role`,
    `room_number`,
    `phone`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    3,
    'Anita Singh',
    'anita@hostel.com',
    'admin123',
    'staff',
    NULL,
    NULL,
    1,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `users` (
    `user_id`,
    `full_name`,
    `email`,
    `password`,
    `role`,
    `room_number`,
    `phone`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    4,
    'Arjun Sharma',
    'arjun@hostel.com',
    'admin123',
    'student',
    'A-101',
    NULL,
    1,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `users` (
    `user_id`,
    `full_name`,
    `email`,
    `password`,
    `role`,
    `room_number`,
    `phone`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    5,
    'Priya Verma',
    'priya@hostel.com',
    'admin123',
    'student',
    'B-205',
    NULL,
    1,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `users` (
    `user_id`,
    `full_name`,
    `email`,
    `password`,
    `role`,
    `room_number`,
    `phone`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    6,
    'Kabir Singh',
    'kabir@hostel.com',
    'admin123',
    'student',
    'A-102',
    NULL,
    1,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `users` (
    `user_id`,
    `full_name`,
    `email`,
    `password`,
    `role`,
    `room_number`,
    `phone`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    7,
    'Aditi Rao',
    'aditi@hostel.com',
    'admin123',
    'student',
    'C-303',
    NULL,
    1,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `users` (
    `user_id`,
    `full_name`,
    `email`,
    `password`,
    `role`,
    `room_number`,
    `phone`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    8,
    'Suresh Raina',
    'suresh@hostel.com',
    'admin123',
    'student',
    'D-404',
    NULL,
    1,
    '2026-04-09 13:24:12'
  );
INSERT INTO
  `users` (
    `user_id`,
    `full_name`,
    `email`,
    `password`,
    `role`,
    `room_number`,
    `phone`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    9,
    'Aditya',
    'aditya@gmail.com',
    '123456',
    'student',
    'A247',
    '8262999417',
    1,
    '2026-04-10 16:33:31'
  );
INSERT INTO
  `users` (
    `user_id`,
    `full_name`,
    `email`,
    `password`,
    `role`,
    `room_number`,
    `phone`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    10,
    'Soham',
    'soham@gmail.com',
    '123456',
    'student',
    'A233',
    '8262999418',
    1,
    '2026-04-11 22:26:24'
  );
INSERT INTO
  `users` (
    `user_id`,
    `full_name`,
    `email`,
    `password`,
    `role`,
    `room_number`,
    `phone`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    11,
    'Kunal',
    'kunal@gmail.com',
    '123456',
    'student',
    'A269',
    '8262999414',
    1,
    '2026-04-14 12:51:00'
  );
INSERT INTO
  `users` (
    `user_id`,
    `full_name`,
    `email`,
    `password`,
    `role`,
    `room_number`,
    `phone`,
    `is_active`,
    `created_at`
  )
VALUES
  (
    12,
    'Yash Chaudhari',
    'yash@gmail.com',
    '1234567890',
    'student',
    'A265',
    '123456789',
    1,
    '2026-04-14 15:20:06'
  );

# ------------------------------------------------------------
# TRIGGER DUMP FOR: after_complaint_insert
# ------------------------------------------------------------

DROP TRIGGER IF EXISTS after_complaint_insert;
DELIMITER ;;
CREATE TRIGGER `after_complaint_insert` AFTER INSERT ON `complaints` FOR EACH ROW BEGIN
  
  INSERT INTO notifications (user_id, message)
  SELECT user_id,
    CONCAT('New complaint submitted: "', NEW.title, '" by student ID #', NEW.student_id, ' [', UPPER(NEW.priority), ' priority]')
  FROM users
  WHERE role = 'admin' AND is_active = TRUE;
END;;
DELIMITER ;

# ------------------------------------------------------------
# TRIGGER DUMP FOR: after_complaint_status_update
# ------------------------------------------------------------

DROP TRIGGER IF EXISTS after_complaint_status_update;
DELIMITER ;;
CREATE TRIGGER `after_complaint_status_update` AFTER UPDATE ON `complaints` FOR EACH ROW BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO complaint_logs (complaint_id, changed_by, old_status, new_status, remark)
    VALUES (
      NEW.complaint_id,
      COALESCE(NEW.assigned_to, NEW.student_id),
      OLD.status,
      NEW.status,
      'Status auto-logged by system trigger'
    );
  END IF;
END;;
DELIMITER ;

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
