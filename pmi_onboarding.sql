<<<<<<< HEAD
-- Create database
CREATE DATABASE IF NOT EXISTS pmi_onboarding;
USE pmi_onboarding;
=======
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: pmi_onboarding
-- ------------------------------------------------------
-- Server version	8.0.37
>>>>>>> 618f5714edc2eba371cb83fa2a359398aa510e8f

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `totalModules` int NOT NULL DEFAULT '1',
  `programType` enum('inkompass','earlyTalent','apprenticeship','academicPlacement','workExperience','all') DEFAULT 'all',
  `isRequired` tinyint(1) DEFAULT '1',
  `createdBy` char(36) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documentaccess`
--

DROP TABLE IF EXISTS `documentaccess`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documentaccess` (
  `id` char(36) NOT NULL,
  `documentId` char(36) NOT NULL,
  `userId` char(36) NOT NULL,
  `accessType` enum('view','edit','admin') DEFAULT 'view',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `documentId` (`documentId`),
  KEY `userId` (`userId`),
  CONSTRAINT `documentaccess_ibfk_1` FOREIGN KEY (`documentId`) REFERENCES `documents` (`id`),
  CONSTRAINT `documentaccess_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documentaccess`
--

LOCK TABLES `documentaccess` WRITE;
/*!40000 ALTER TABLE `documentaccess` DISABLE KEYS */;
/*!40000 ALTER TABLE `documentaccess` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `filePath` varchar(255) NOT NULL,
  `fileType` varchar(50) DEFAULT NULL,
  `fileSize` int DEFAULT NULL,
  `uploadedBy` char(36) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `uploadedBy` (`uploadedBy`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`uploadedBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluationcriteria`
--

<<<<<<< HEAD
-- SurveyQuestions table
CREATE TABLE IF NOT EXISTS SurveyQuestions (
    id CHAR(36) PRIMARY KEY,
    surveyId CHAR(36) NOT NULL,
    questionText TEXT NOT NULL,
    questionType ENUM('text', 'rating', 'multiple_choice', 'checkbox') NOT NULL,
    options JSON,
    isRequired BOOLEAN DEFAULT TRUE,
    orderIndex INT NOT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    FOREIGN KEY (surveyId) REFERENCES Surveys(id)
);

-- SurveyResponses table
CREATE TABLE IF NOT EXISTS SurveyResponses (
    id CHAR(36) PRIMARY KEY,
    surveyId CHAR(36) NOT NULL,
    userId CHAR(36) NOT NULL,
    completedAt DATETIME,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    FOREIGN KEY (surveyId) REFERENCES Surveys(id),
    FOREIGN KEY (userId) REFERENCES Users(id)
);
=======
DROP TABLE IF EXISTS `evaluationcriteria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluationcriteria` (
  `id` char(36) NOT NULL,
  `evaluationId` char(36) NOT NULL,
  `category` varchar(255) NOT NULL,
  `criteria` varchar(255) NOT NULL,
  `rating` int DEFAULT NULL,
  `comments` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `evaluationId` (`evaluationId`),
  CONSTRAINT `evaluationcriteria_ibfk_1` FOREIGN KEY (`evaluationId`) REFERENCES `evaluations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluationcriteria`
--
>>>>>>> 618f5714edc2eba371cb83fa2a359398aa510e8f

LOCK TABLES `evaluationcriteria` WRITE;
/*!40000 ALTER TABLE `evaluationcriteria` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluationcriteria` ENABLE KEYS */;
UNLOCK TABLES;

<<<<<<< HEAD
-- CoachingSessions table
CREATE TABLE IF NOT EXISTS CoachingSessions (
    id CHAR(36) PRIMARY KEY,
    employeeId CHAR(36) NOT NULL,
    coachId CHAR(36) NOT NULL,
    scheduledDate DATETIME NOT NULL,
    duration INT NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    FOREIGN KEY (employeeId) REFERENCES Users(id),
    FOREIGN KEY (coachId) REFERENCES Users(id)
);
=======
--
-- Table structure for table `evaluations`
--

DROP TABLE IF EXISTS `evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluations` (
  `id` char(36) NOT NULL,
  `employeeId` char(36) NOT NULL,
  `evaluatorId` char(36) NOT NULL,
  `type` enum('3-month','6-month','12-month','training','general') NOT NULL,
  `status` enum('draft','in_progress','completed') DEFAULT 'draft',
  `completedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `employeeId` (`employeeId`),
  KEY `evaluatorId` (`evaluatorId`),
  CONSTRAINT `evaluations_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `users` (`id`),
  CONSTRAINT `evaluations_ibfk_2` FOREIGN KEY (`evaluatorId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluations`
--

LOCK TABLES `evaluations` WRITE;
/*!40000 ALTER TABLE `evaluations` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventparticipants`
--

DROP TABLE IF EXISTS `eventparticipants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventparticipants` (
  `id` char(36) NOT NULL,
  `eventId` char(36) NOT NULL,
  `userId` char(36) NOT NULL,
  `status` enum('attending','declined','pending') DEFAULT 'pending',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `eventId` (`eventId`),
  KEY `userId` (`userId`),
  CONSTRAINT `eventparticipants_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`),
  CONSTRAINT `eventparticipants_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventparticipants`
--

LOCK TABLES `eventparticipants` WRITE;
/*!40000 ALTER TABLE `eventparticipants` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventparticipants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `startDate` datetime NOT NULL,
  `endDate` datetime NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `type` enum('meeting','training','event','planning') DEFAULT 'meeting',
  `createdBy` char(36) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id` char(36) NOT NULL,
  `fromUserId` char(36) NOT NULL,
  `toUserId` char(36) DEFAULT NULL,
  `toDepartment` varchar(255) DEFAULT NULL,
  `type` enum('onboarding','training','support','general') DEFAULT 'general',
  `message` text NOT NULL,
  `isAnonymous` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fromUserId` (`fromUserId`),
  KEY `toUserId` (`toUserId`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`fromUserId`) REFERENCES `users` (`id`),
  CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`toUserId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `userId` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('task','event','evaluation','feedback','system') NOT NULL,
  `isRead` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `onboardingprogress`
--

DROP TABLE IF EXISTS `onboardingprogress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `onboardingprogress` (
  `id` char(36) NOT NULL,
  `userId` char(36) NOT NULL,
  `stage` enum('prepare','orient','land','integrate','excel') NOT NULL DEFAULT 'prepare',
  `progress` int NOT NULL DEFAULT '0',
  `stageStartDate` datetime NOT NULL,
  `estimatedCompletionDate` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `onboardingprogress_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `onboardingprogress`
--

LOCK TABLES `onboardingprogress` WRITE;
/*!40000 ALTER TABLE `onboardingprogress` DISABLE KEYS */;
/*!40000 ALTER TABLE `onboardingprogress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `onboardingprogresses`
--

DROP TABLE IF EXISTS `onboardingprogresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `onboardingprogresses` (
  `id` char(36) NOT NULL,
  `stage` enum('prepare','orient','land','integrate','excel') NOT NULL DEFAULT 'prepare',
  `progress` int NOT NULL DEFAULT '0',
  `stageStartDate` datetime NOT NULL,
  `estimatedCompletionDate` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `UserId` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `onboardingprogresses_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `onboardingprogresses`
--

LOCK TABLES `onboardingprogresses` WRITE;
/*!40000 ALTER TABLE `onboardingprogresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `onboardingprogresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `surveyquestions`
--

DROP TABLE IF EXISTS `surveyquestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `surveyquestions` (
  `id` char(36) NOT NULL,
  `surveyId` char(36) NOT NULL,
  `question` text NOT NULL,
  `type` enum('text','multiple_choice','rating') NOT NULL,
  `required` tinyint(1) DEFAULT '0',
  `options` json DEFAULT NULL,
  `questionOrder` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `surveyId` (`surveyId`),
  CONSTRAINT `surveyquestions_ibfk_1` FOREIGN KEY (`surveyId`) REFERENCES `surveys` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `surveyquestions`
--

LOCK TABLES `surveyquestions` WRITE;
/*!40000 ALTER TABLE `surveyquestions` DISABLE KEYS */;
/*!40000 ALTER TABLE `surveyquestions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `surveys`
--

DROP TABLE IF EXISTS `surveys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `surveys` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `type` enum('3-month','6-month','12-month','training','general') DEFAULT 'general',
  `status` enum('draft','active','completed') DEFAULT 'draft',
  `createdBy` char(36) NOT NULL,
  `dueDate` datetime DEFAULT NULL,
  `targetRole` enum('employee','supervisor','manager','hr','all') DEFAULT 'employee',
  `targetProgram` enum('inkompass','earlyTalent','apprenticeship','academicPlacement','workExperience','all') DEFAULT 'all',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `surveys_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `surveys`
--

LOCK TABLES `surveys` WRITE;
/*!40000 ALTER TABLE `surveys` DISABLE KEYS */;
/*!40000 ALTER TABLE `surveys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` char(36) NOT NULL,
  `userId` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `dueDate` datetime DEFAULT NULL,
  `isCompleted` tinyint(1) DEFAULT '0',
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `onboardingStage` enum('prepare','orient','land','integrate','excel') DEFAULT NULL,
  `controlledBy` enum('hr','supervisor','employee') DEFAULT 'hr',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usercourses`
--

DROP TABLE IF EXISTS `usercourses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usercourses` (
  `id` char(36) NOT NULL,
  `userId` char(36) NOT NULL,
  `courseId` char(36) NOT NULL,
  `progress` int NOT NULL DEFAULT '0',
  `modulesCompleted` int NOT NULL DEFAULT '0',
  `completedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `courseId` (`courseId`),
  CONSTRAINT `usercourses_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `usercourses_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usercourses`
--

LOCK TABLES `usercourses` WRITE;
/*!40000 ALTER TABLE `usercourses` DISABLE KEYS */;
/*!40000 ALTER TABLE `usercourses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `role` enum('employee','supervisor','manager','admin') NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `startDate` date DEFAULT NULL,
  `programType` enum('inkompass','earlyTalent','apprenticeship','academicPlacement','workExperience') DEFAULT NULL,
  `supervisorId` char(36) DEFAULT NULL,
  `onboardingProgress` int DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `supervisorId` (`supervisorId`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`supervisorId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-18 12:10:02
>>>>>>> 618f5714edc2eba371cb83fa2a359398aa510e8f
