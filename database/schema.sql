-- ============================================================
-- SmartPort Connect — Port Management System
-- Database Schema & Initial Data
-- Compatible with MySQL 5.7+ / MariaDB / phpMyAdmin / XAMPP
-- ============================================================

CREATE DATABASE IF NOT EXISTS `smartport_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smartport_db`;

-- ------------------------------------------------------------
-- Table structure for: users
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'planner') NOT NULL DEFAULT 'planner',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default users
-- Note: Passwords stored as plain text or MD5/hash; PHP supports both for easy demo & college evaluation
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(1, 'Alex Morgan', 'admin@smartport.io', '$2y$10$tZg/M5C1Y1xTq5B5tXQG4u8d1h8x3Ff0fSj4g3J2p5N7e1v7z6m9q', 'admin'),
(2, 'Sam Torres', 'planner@smartport.io', '$2y$10$tZg/M5C1Y1xTq5B5tXQG4u8d1h8x3Ff0fSj4g3J2p5N7e1v7z6m9q', 'planner');
-- Plain text fallback passwords for demo compatibility: admin123 / planner123

-- ------------------------------------------------------------
-- Table structure for: vessels
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `vessels`;
CREATE TABLE `vessels` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `imo` VARCHAR(50) NOT NULL UNIQUE,
  `flag` VARCHAR(80) DEFAULT 'International',
  `cargo` VARCHAR(100) NOT NULL,
  `priority` ENUM('Standard', 'Priority', 'Cold-Chain') NOT NULL DEFAULT 'Standard',
  `eta` DATETIME NOT NULL,
  `berth` VARCHAR(50) NOT NULL DEFAULT 'Berth 1',
  `cranes` INT NOT NULL DEFAULT 1,
  `status` ENUM('In Transit', 'Docked', 'Delayed', 'At Anchorage', 'Departing') NOT NULL DEFAULT 'In Transit',
  `lat` DECIMAL(9,6) NOT NULL DEFAULT 51.950000,
  `lng` DECIMAL(9,6) NOT NULL DEFAULT 3.800000,
  `dest_lat` DECIMAL(9,6) NOT NULL DEFAULT 51.985000,
  `dest_lng` DECIMAL(9,6) NOT NULL DEFAULT 4.050000,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed sample fleet
INSERT INTO `vessels` (`id`, `name`, `imo`, `flag`, `cargo`, `priority`, `eta`, `berth`, `cranes`, `status`, `lat`, `lng`, `dest_lat`, `dest_lng`) VALUES
(1, 'MV Pacific Star', 'IMO 9123456', 'Liberia', 'Container', 'Priority', '2026-10-15 08:30:00', 'Berth 1', 3, 'In Transit', 51.950000, 3.800000, 51.985000, 4.050000),
(2, 'MV Arctic Breeze', 'IMO 9234567', 'Norway', 'Cold-Chain', 'Cold-Chain', '2026-10-15 11:30:00', 'Berth 3', 2, 'Delayed', 51.900000, 3.500000, 51.985000, 4.050000),
(3, 'MV Horizon Pearl', 'IMO 9345678', 'Panama', 'Bulk Cargo', 'Standard', '2026-10-15 07:00:00', 'Berth 2', 2, 'Docked', 51.988000, 4.030000, 51.988000, 4.030000),
(4, 'MV Thunder Bay', 'IMO 9456789', 'Marshall Is.', 'LNG', 'Priority', '2026-10-15 11:00:00', 'Berth 5', 1, 'At Anchorage', 51.970000, 3.700000, 51.985000, 4.050000),
(5, 'MV Coral Wind', 'IMO 9567890', 'Cyprus', 'General Cargo', 'Standard', '2026-10-15 06:00:00', 'Berth 4', 2, 'Departing', 51.990000, 4.100000, 51.850000, 3.200000),
(6, 'MV Caspian Star', 'IMO 9678901', 'Malta', 'Liquid Bulk', 'Standard', '2026-10-15 14:30:00', 'Anchorage A', 1, 'In Transit', 51.880000, 3.300000, 51.985000, 4.050000);

-- ------------------------------------------------------------
-- Table structure for: berths
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `berths`;
CREATE TABLE `berths` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `type` VARCHAR(50) NOT NULL DEFAULT 'General',
  `capacity_teu` INT DEFAULT 18000,
  `max_draft_m` DECIMAL(4,1) DEFAULT 16.5,
  `status` ENUM('Occupied', 'Available', 'Maintenance', 'Reserved') DEFAULT 'Available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `berths` (`id`, `name`, `type`, `capacity_teu`, `max_draft_m`, `status`) VALUES
(1, 'Berth 1', 'Container Terminal', 20000, 17.5, 'Occupied'),
(2, 'Berth 2', 'Bulk Cargo Terminal', 15000, 16.0, 'Occupied'),
(3, 'Berth 3', 'Reefer / Cold-Chain', 12000, 15.0, 'Reserved'),
(4, 'Berth 4', 'General Cargo Terminal', 10000, 14.5, 'Occupied'),
(5, 'Berth 5', 'LNG / Tanker Terminal', 25000, 18.0, 'Available'),
(6, 'Anchorage A', 'Deep Sea Anchorage', 50000, 22.0, 'Available');

-- ------------------------------------------------------------
-- Table structure for: cranes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `cranes`;
CREATE TABLE `cranes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `berth` VARCHAR(50) NOT NULL,
  `assigned_vessel` VARCHAR(150) DEFAULT '--',
  `load_pct` INT NOT NULL DEFAULT 0,
  `status` ENUM('Active', 'Standby', 'Maintenance', 'Idle') DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `cranes` (`id`, `code`, `berth`, `assigned_vessel`, `load_pct`, `status`) VALUES
(1, 'STS Crane 1', 'Berth 2', 'MV Horizon Pearl', 85, 'Active'),
(2, 'STS Crane 2', 'Berth 1', 'MV Pacific Star', 72, 'Active'),
(3, 'STS Crane 3', 'Berth 1', '--', 0, 'Maintenance'),
(4, 'Mobile Crane 4', 'Berth 5', 'MV Thunder Bay', 45, 'Standby'),
(5, 'STS Crane 5', 'Berth 2', 'MV Horizon Pearl', 60, 'Active'),
(6, 'Rail Crane 6', 'Berth 4', '--', 0, 'Idle');

-- ------------------------------------------------------------
-- Table structure for: alerts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `alerts`;
CREATE TABLE `alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('crit', 'warn', 'info') NOT NULL DEFAULT 'info',
  `message` TEXT NOT NULL,
  `time_ago` VARCHAR(50) DEFAULT 'Just now',
  `is_resolved` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `alerts` (`id`, `type`, `message`, `time_ago`, `is_resolved`) VALUES
(1, 'crit', 'MV Arctic Breeze (Cold-Chain) delayed 2h 15m due to Storm Warning. Berth 3 conflict with MV Pacific Star.', '2 min ago', 0),
(2, 'crit', 'Cold-chain integrity risk: MV Arctic Breeze ETA revised to 11:30. Refrigeration window at risk.', '5 min ago', 0),
(3, 'warn', 'Strong winds (32 kn) forecast 10:00-14:00. 3 inbound vessels may face approach delays.', '12 min ago', 0),
(4, 'warn', 'Crane 2 maintenance due in 4h. Berth 1 operations may be affected.', '28 min ago', 0),
(5, 'info', 'MV Horizon Pearl docking complete. Berth 2 operational. Cargo offload started.', '41 min ago', 0),
(6, 'info', 'MV Thunder Bay cleared customs. Awaiting berth assignment.', '1 hr ago', 0);

-- ------------------------------------------------------------
-- Table structure for: weather_current
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `weather_current`;
CREATE TABLE `weather_current` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `location` VARCHAR(100) DEFAULT 'Port of Rotterdam',
  `temperature` DECIMAL(4,1) DEFAULT 14.0,
  `wind_speed` INT DEFAULT 28,
  `visibility` DECIMAL(4,1) DEFAULT 8.0,
  `wave_height` DECIMAL(4,2) DEFAULT 2.1,
  `pressure` INT DEFAULT 1013,
  `cloud_cover` INT DEFAULT 72,
  `condition_name` VARCHAR(100) DEFAULT 'Moderate Storm Warning',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `weather_current` (`id`, `location`, `temperature`, `wind_speed`, `visibility`, `wave_height`, `pressure`, `cloud_cover`, `condition_name`)
VALUES (1, 'Port of Rotterdam', 14.0, 28, 8.0, 2.10, 1013, 72, 'Moderate Storm Warning')
ON DUPLICATE KEY UPDATE `updated_at`=NOW();
