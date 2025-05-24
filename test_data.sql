-- Insert test users if they don't exist
INSERT INTO Users (id, name, email, passwordHash, role, department, createdAt, updatedAt)
VALUES 
('11111111-1111-1111-1111-111111111111', 'HR Manager', 'hr@example.com', 'hash', 'hr', 'HR', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'Dev Manager', 'dev@example.com', 'hash', 'manager', 'Development', NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Insert weekly report notifications
INSERT INTO Notifications (id, userId, title, message, type, isRead, metadata, createdAt, updatedAt)
VALUES
-- HR Department Reports
(UUID(), '11111111-1111-1111-1111-111111111111', 
 'HR Weekly Progress Report', 
 'Weekly progress report for HR department activities', 
 'weekly_report',
 false,
 '{"department": "HR", "week": "2025-W20", "completedTasks": 15, "pendingTasks": 5}',
 '2025-05-12 00:00:00',
 NOW()),

(UUID(), '11111111-1111-1111-1111-111111111111',
 'HR Weekly Progress Report',
 'Weekly progress report for HR department activities',
 'weekly_report',
 false,
 '{"department": "HR", "week": "2025-W19", "completedTasks": 12, "pendingTasks": 3}',
 '2025-05-05 00:00:00',
 NOW()),

-- Development Department Reports
(UUID(), '22222222-2222-2222-2222-222222222222',
 'Development Weekly Progress Report',
 'Weekly progress report for Development team activities',
 'weekly_report',
 false,
 '{"department": "Development", "week": "2025-W20", "completedTasks": 20, "pendingTasks": 8}',
 '2025-05-12 00:00:00',
 NOW()),

(UUID(), '22222222-2222-2222-2222-222222222222',
 'Development Weekly Progress Report',
 'Weekly progress report for Development team activities',
 'weekly_report',
 false,
 '{"department": "Development", "week": "2025-W19", "completedTasks": 18, "pendingTasks": 5}',
 '2025-05-05 00:00:00',
 NOW());

-- Add more test data as needed 