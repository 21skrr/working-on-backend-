ADMIN PANEL – Endpoints Overview

## USER MANAGEMENT

GET    /users
→ List all users

POST   /users
→ Create a new user

PUT    /users/:id
→ Update user details (name, email, role, supervisorId, teamId)

DELETE /users/:id
→ Delete or deactivate a user

---

## TEAM MANAGEMENT

GET    /teams
→ View all teams

POST   /teams
→ Create a team

PUT    /teams/:id
→ Update team details or assign members

---

## ROLE & PERMISSION CONTROL

GET    /roles
→ List all roles and their permissions

POST   /roles
→ Create a new role

PUT    /roles/:id
→ Modify permissions or role metadata

DELETE /roles/:id
→ Remove role (if not system-critical)

---

## SYSTEM CONFIGURATION

GET    /systemsettings
→ View all global settings (onboarding logic, survey timing, feedback policies)

PUT    /systemsettings
→ Update or toggle automation features, defaults, alert settings

---

## REPORT & AUDIT ACCESS

GET    /activitylogs
→ View user action logs (searchable by user/date/entity)

GET    /reports
→ Access and run pre-configured reports or templates

GET    /reports/:id/export
→ Export report (PDF/Excel)

---

## NOTIFICATION MANAGEMENT

GET    /notifications
→ View all platform-generated notifications (filterable by user/type/date)

POST   /notifications
→ Send a manual broadcast/alert

PUT    /notificationtemplates/:id
→ Update predefined templates for onboarding, reminders, evaluations

---

These endpoints support the full admin panel functionality for managing users, teams, roles, system logic, and platform settings.
