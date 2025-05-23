-- Add supervisorNotes column to tasks table
ALTER TABLE tasks ADD COLUMN supervisorNotes TEXT;

-- Create user task progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS usertaskprogresses (
  id char(36) NOT NULL,
  UserId char(36) NOT NULL,
  OnboardingTaskId char(36) NOT NULL,
  isCompleted TINYINT(1) NOT NULL DEFAULT 0,
  completedAt datetime DEFAULT NULL,
  notes text,
  supervisorNotes text,
  supervisorNotesUpdatedAt datetime DEFAULT NULL,
  createdAt datetime NOT NULL,
  updatedAt datetime NOT NULL,
  PRIMARY KEY (id),
  KEY UserId (UserId),
  KEY OnboardingTaskId (OnboardingTaskId),
  CONSTRAINT usertaskprogresses_ibfk_1 FOREIGN KEY (UserId) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT usertaskprogresses_ibfk_2 FOREIGN KEY (OnboardingTaskId) REFERENCES onboardingtasks (id) ON DELETE CASCADE ON UPDATE CASCADE
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