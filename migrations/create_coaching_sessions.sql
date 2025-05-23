-- Create coaching_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id char(36) NOT NULL,
  supervisorId char(36) NOT NULL,
  employeeId char(36) NOT NULL,
  scheduledDate datetime NOT NULL,
  actualDate datetime DEFAULT NULL,
  status enum('scheduled', 'completed', 'cancelled', 'rescheduled') NOT NULL DEFAULT 'scheduled',
  goal text,
  notes text,
  outcome text,
  topicTags json,
  createdAt datetime NOT NULL,
  updatedAt datetime NOT NULL,
  PRIMARY KEY (id),
  KEY supervisorId (supervisorId),
  KEY employeeId (employeeId),
  CONSTRAINT coaching_sessions_ibfk_1 FOREIGN KEY (supervisorId) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT coaching_sessions_ibfk_2 FOREIGN KEY (employeeId) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 