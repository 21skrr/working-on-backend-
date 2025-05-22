-- Create the AutoAssignRules table without foreign key constraint
CREATE TABLE IF NOT EXISTS `AutoAssignRules` (
  `id` CHAR(36) NOT NULL,
  `checklistId` CHAR(36) NOT NULL,
  `programTypes` JSON DEFAULT NULL,
  `departments` JSON DEFAULT NULL,
  `stages` JSON DEFAULT NULL,
  `autoNotify` BOOLEAN DEFAULT false,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_checklist` (`checklistId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for the checklist in your request
INSERT INTO `AutoAssignRules` (`id`, `checklistId`, `programTypes`, `departments`, `stages`, `autoNotify`, `createdAt`, `updatedAt`)
VALUES
(UUID(), '71bf4554-35c9-11f0-97fc-f875a44d165a', 
 '["inkompass", "earlyTalent"]', 
 '["Marketing", "HR"]', 
 '["prepare"]', 
 true, 
 NOW(), 
 NOW()); 