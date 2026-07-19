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
) ENGINE = InnoDB AUTO_INCREMENT = 12 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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

