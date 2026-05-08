-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3308
-- Generation Time: May 08, 2026 at 02:20 PM
-- Server version: 5.7.28
-- PHP Version: 7.3.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `booking_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(100) NOT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `service_id` int(11) NOT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `status` enum('pending','confirmed','scheduled','completed','cancelled') DEFAULT 'scheduled',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `customer_name`, `customer_phone`, `service_id`, `appointment_date`, `appointment_time`, `status`, `created_at`) VALUES
(1, 'ali', '+4420202020', 1, '2026-03-31', '10:30:00', 'scheduled', '2026-03-25 23:38:02'),
(2, 'John Doe', '+44 7123 456789', 2, '2026-03-27', '10:30:00', 'scheduled', '2026-03-25 23:41:18'),
(3, 'aymen', '+44444444444', 4, '2026-04-02', '15:30:00', 'completed', '2026-03-28 00:27:06'),
(4, 'Youssef', '+44 52652 72727', 2, '2026-04-10', '13:30:00', 'completed', '2026-03-28 02:09:59'),
(5, 'Brus', '+44 26828 1882', 3, '2026-04-11', '11:00:00', 'scheduled', '2026-03-28 02:10:52'),
(6, 'Ali', '+44 7511 827828', 5, '2026-03-28', '09:00:00', 'scheduled', '2026-03-28 02:11:52'),
(7, 'Amine', '+44 3746 848185', 3, '2026-03-31', '15:30:00', 'cancelled', '2026-03-29 14:24:46'),
(8, 'amine', '+44 7743 187438', 4, '2026-03-30', '13:00:00', 'scheduled', '2026-03-30 01:08:50'),
(9, 'Jimmy', '+44 6157 1717189', 4, '2026-03-31', '13:30:00', 'completed', '2026-03-30 01:09:43'),
(10, 'piter', '+44 1552 162677', 2, '2026-03-30', '13:30:00', 'completed', '2026-03-30 01:16:38'),
(11, 'yahia', '+44 7167 701612', 5, '2026-03-30', '12:30:00', 'completed', '2026-03-30 09:26:58'),
(12, 'Josh', '+44 2571 276718', 3, '2026-03-30', '15:30:00', 'scheduled', '2026-03-30 09:39:35'),
(13, 'mehdi', '+44 6775 668', 3, '2026-04-12', '17:00:00', 'scheduled', '2026-04-12 15:47:47'),
(14, 'hassanain', '48937492138', 2, '2026-05-07', '09:00:00', 'scheduled', '2026-05-03 15:38:31'),
(15, 'james', '44 9736 4324432', 5, '2026-05-13', '13:30:00', 'scheduled', '2026-05-04 16:14:53');

-- --------------------------------------------------------

--
-- Table structure for table `business_hours`
--

DROP TABLE IF EXISTS `business_hours`;
CREATE TABLE IF NOT EXISTS `business_hours` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `day_of_week` tinyint(4) NOT NULL,
  `open_time` time NOT NULL,
  `close_time` time NOT NULL,
  `is_closed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `business_hours`
--

INSERT INTO `business_hours` (`id`, `day_of_week`, `open_time`, `close_time`, `is_closed`) VALUES
(1, 0, '09:00:00', '17:00:00', 1),
(2, 1, '09:00:00', '17:00:00', 0),
(3, 2, '09:00:00', '17:00:00', 0),
(4, 3, '09:00:00', '17:00:00', 0),
(5, 4, '09:00:00', '17:00:00', 0),
(6, 5, '09:00:00', '17:00:00', 0),
(7, 6, '10:00:00', '16:00:00', 0);

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
CREATE TABLE IF NOT EXISTS `clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_phone` (`phone`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `name`, `email`, `phone`, `created_at`) VALUES
(1, 'ali', NULL, '+4420202020', '2026-03-30 09:18:03'),
(2, 'John Doe', NULL, '+44 7123 456789', '2026-03-30 09:18:03'),
(3, 'aymen', NULL, '+44444444444', '2026-03-30 09:18:03'),
(4, 'Youssef', NULL, '+44 52652 72727', '2026-03-30 09:18:03'),
(5, 'Brus', NULL, '+44 26828 1882', '2026-03-30 09:18:03'),
(6, 'Ali', NULL, '+44 7511 827828', '2026-03-30 09:18:03'),
(7, 'Amine', NULL, '+44 3746 848185', '2026-03-30 09:18:03'),
(8, 'amine', NULL, '+44 7743 187438', '2026-03-30 09:18:03'),
(9, 'Jimmy', NULL, '+44 6157 1717189', '2026-03-30 09:18:03'),
(10, 'piter', NULL, '+44 1552 162677', '2026-03-30 09:18:03'),
(11, 'yahia', NULL, '+44 7167 701612', '2026-03-30 09:26:58'),
(12, 'Josh', NULL, '+44 2571 276718', '2026-03-30 09:39:35'),
(13, 'mehdi', NULL, '+44 6775 668', '2026-04-12 15:47:47'),
(14, 'hassanain', NULL, '48937492138', '2026-05-03 15:38:31'),
(15, 'james', NULL, '44 9736 4324432', '2026-05-04 16:14:53');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
CREATE TABLE IF NOT EXISTS `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `duration` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `color` varchar(20) DEFAULT 'purple',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `name`, `description`, `duration`, `price`, `color`, `created_at`) VALUES
(5, 'Haircut', NULL, 30, '15.00', 'green', '2026-03-27 19:06:07'),
(2, 'Beard Trim', NULL, 15, '8.00', 'blue', '2026-02-16 00:49:28'),
(3, 'Haircut & Beard', NULL, 45, '20.00', 'red', '2026-02-16 00:49:28'),
(4, 'Hair Wash & Style', NULL, 25, '12.00', 'purple', '2026-02-16 00:49:28');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
