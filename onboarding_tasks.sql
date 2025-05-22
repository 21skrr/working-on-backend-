-- Create OnboardingTasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS `OnboardingTasks` (
  `id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `stage` ENUM('prepare', 'orient', 'land', 'integrate', 'excel') NOT NULL,
  `order` INT NOT NULL DEFAULT 0,
  `isDefault` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create UserTaskProgresses table if it doesn't exist
CREATE TABLE IF NOT EXISTS `UserTaskProgresses` (
  `id` CHAR(36) NOT NULL,
  `UserId` CHAR(36) NOT NULL,
  `OnboardingTaskId` CHAR(36) NOT NULL,
  `isCompleted` TINYINT(1) NOT NULL DEFAULT 0,
  `completedAt` DATETIME,
  `notes` TEXT,
  `supervisorNotes` TEXT,
  `supervisorNotesUpdatedAt` DATETIME,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `UserTaskProgresses_UserId_foreign` FOREIGN KEY (`UserId`) REFERENCES `Users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `UserTaskProgresses_OnboardingTaskId_foreign` FOREIGN KEY (`OnboardingTaskId`) REFERENCES `OnboardingTasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create NotificationSettings table if it doesn't exist
CREATE TABLE IF NOT EXISTS `NotificationSettings` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `category` VARCHAR(255) NOT NULL DEFAULT 'onboarding',
  `settings` JSON NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `NotificationSettings_userId_foreign` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default tasks for each stage
INSERT INTO OnboardingTasks (id, title, description, stage, `order`, isDefault, createdAt, updatedAt) VALUES
-- PREPARE stage
(UUID(), 'Complete paperwork', 'Fill out all required employment forms', 'prepare', 1, true, NOW(), NOW()),
(UUID(), 'Review welcome materials', 'Read through the welcome packet', 'prepare', 2, true, NOW(), NOW()),
(UUID(), 'Set up system access', 'Get access to necessary IT systems', 'prepare', 3, true, NOW(), NOW()),
(UUID(), 'Complete pre-onboarding surveys', 'Fill out surveys before first day', 'prepare', 4, true, NOW(), NOW()),

-- ORIENT stage
(UUID(), 'Attend orientation session', 'Participate in company orientation', 'orient', 1, true, NOW(), NOW()),
(UUID(), 'Meet your team', 'Get introduced to team members', 'orient', 2, true, NOW(), NOW()),
(UUID(), 'Receive equipment', 'Collect laptop and other required equipment', 'orient', 3, true, NOW(), NOW()),
(UUID(), 'Complete system training', 'Learn to use essential company systems', 'orient', 4, true, NOW(), NOW()),

-- LAND stage
(UUID(), 'Complete self-study modules', 'Go through learning materials for your role', 'land', 1, true, NOW(), NOW()),
(UUID(), 'Shadow team members', 'Observe colleagues performing relevant duties', 'land', 2, true, NOW(), NOW()),
(UUID(), 'Meet with your buddy', 'Connect with your assigned onboarding buddy', 'land', 3, true, NOW(), NOW()),
(UUID(), 'Practice system usage', 'Apply what you've learned in practical scenarios', 'land', 4, true, NOW(), NOW()),

-- INTEGRATE stage
(UUID(), 'Lead team interactions', 'Begin taking the lead in meetings/calls', 'integrate', 1, true, NOW(), NOW()),
(UUID(), 'Demonstrate system autonomy', 'Work independently in required systems', 'integrate', 2, true, NOW(), NOW()),
(UUID(), 'Complete knowledge assessment', 'Take assessment to validate learning', 'integrate', 3, true, NOW(), NOW()),
(UUID(), 'Present learnings to team', 'Share what you've learned so far', 'integrate', 4, true, NOW(), NOW()),

-- EXCEL stage
(UUID(), 'Create development plan', 'Work with manager on growth goals', 'excel', 1, true, NOW(), NOW()),
(UUID(), 'Join coaching sessions', 'Participate in advanced training', 'excel', 2, true, NOW(), NOW()),
(UUID(), 'Complete on-the-job training', 'Finish specialized role training', 'excel', 3, true, NOW(), NOW()),
(UUID(), 'Set performance goals', 'Establish KPIs with your manager', 'excel', 4, true, NOW(), NOW()); 