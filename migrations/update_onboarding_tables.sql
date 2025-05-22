-- Add supervisorNotes column to tasks table
ALTER TABLE tasks ADD COLUMN supervisorNotes TEXT;

-- Create user task progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS usertaskprogresses (
  id char(36) NOT NULL,
  userId char(36) NOT NULL,
  taskId char(36) NOT NULL,
  status enum('pending','in_progress','completed') DEFAULT 'pending',
  completedAt datetime DEFAULT NULL,
  notes text,
  supervisorNotes text,
  verifiedBy char(36) DEFAULT NULL,
  verifiedAt datetime DEFAULT NULL,
  createdAt datetime NOT NULL,
  updatedAt datetime NOT NULL,
  PRIMARY KEY (id),
  KEY userId (userId),
  KEY taskId (taskId),
  KEY verifiedBy (verifiedBy),
  CONSTRAINT usertaskprogresses_ibfk_1 FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT usertaskprogresses_ibfk_2 FOREIGN KEY (taskId) REFERENCES tasks (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT usertaskprogresses_ibfk_3 FOREIGN KEY (verifiedBy) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create onboarding metrics table if not exists (for dashboard data)
CREATE TABLE IF NOT EXISTS onboardingmetrics (
  id char(36) NOT NULL,
  programType enum('inkompass','earlyTalent','apprenticeship','academicPlacement','workExperience','all') NOT NULL,
  metricDate date NOT NULL,
  totalOnboarded int NOT NULL DEFAULT '0',
  avgDuration int DEFAULT NULL,
  completionRate decimal(5,2) DEFAULT NULL,
  satisfactionScore decimal(3,2) DEFAULT NULL,
  createdAt datetime NOT NULL,
  updatedAt datetime NOT NULL,
  PRIMARY KEY (id)
); 