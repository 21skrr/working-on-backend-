# Postman Test Data for Feedback & Surveys API Endpoints

## Setup

1. Import the API endpoints into Postman
2. Setup an environment with:
   - `baseUrl`: Your API base URL (e.g., http://localhost:3000)
   - `token`: Authentication token obtained from login

## Authentication

### Login to get a token

**POST {{baseUrl}}/api/auth/login**

```json
{
  "email": "employee@company.com",
  "password": "password123"
}
```

### Logout

**POST {{baseUrl}}/api/auth/logout**

Headers:
```
Authorization: Bearer {{token}}
```

### Get Current User Profile

**GET {{baseUrl}}/api/auth/me**

Headers:
```
Authorization: Bearer {{token}}
```

## EMPLOYEE ENDPOINTS

### Get Pending Surveys

**GET {{baseUrl}}/api/surveys/pending**

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
page=1
limit=10
```

### Get Assigned Surveys

**GET {{baseUrl}}/api/surveys/assigned**

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
page=1
limit=10
```

### Submit Survey Response

**POST {{baseUrl}}/api/surveys/{surveyId}/submit**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "responses": [
    {
      "questionId": "q123",
      "answer": "Very satisfied with the onboarding process"
    },
    {
      "questionId": "q124",
      "answer": "5",
      "comments": "The training materials were very helpful"
    }
  ]
}
```

### View Feedback History

**GET {{baseUrl}}/api/feedback/history**

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
startDate=2024-01-01
endDate=2024-03-21
page=1
limit=10
```

### Get Survey Reminders

**GET {{baseUrl}}/api/surveys/reminders**

Headers:
```
Authorization: Bearer {{token}}
```

## SUPERVISOR ENDPOINTS

### Get Team Feedback

**GET {{baseUrl}}/api/team/feedback**

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
anonymous=true
page=1
limit=10
```

### Get Team Feedback Analytics

**GET {{baseUrl}}/api/team/feedback/analytics**

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
startDate=2024-01-01
endDate=2024-03-21
metric=participation
```

### Add Feedback Notes

**POST {{baseUrl}}/api/feedback/{feedbackId}/notes**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "notes": "Employee shows great progress in technical skills",
  "visibility": "team"
}
```

### Schedule Follow-up

**POST {{baseUrl}}/api/feedback/{feedbackId}/followup**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "scheduledDate": "2024-03-21T10:00:00Z",
  "participants": ["emp123", "sup456"],
  "notes": "Discuss Q1 performance feedback"
}
```

## MANAGER ENDPOINTS

### Get Department Analytics

**GET {{baseUrl}}/api/departments/feedback/analytics**

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
departmentId=dept123
startDate=2024-01-01
endDate=2024-03-21
```

### Track Survey Participation

**GET {{baseUrl}}/api/departments/surveys/participation**

Headers:
```
Authorization: Bearer {{token}}
```

Query params:
```
milestone=3
departmentId=dept123
```

### Update Employee Status

**PUT {{baseUrl}}/api/employees/{employeeId}/status**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "status": "Integrated",
  "notes": "Successfully completed 3-month integration period"
}
```

## HR ENDPOINTS

### Create Survey Template

**POST {{baseUrl}}/api/surveys/templates**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "title": "3-Month Onboarding Survey",
  "description": "Feedback on your first 3 months with the company",
  "questions": [
    {
      "text": "How satisfied are you with the onboarding process?",
      "type": "rating",
      "options": ["1", "2", "3", "4", "5"],
      "required": true
    },
    {
      "text": "What aspects of the training could be improved?",
      "type": "text",
      "required": false
    }
  ],
  "settings": {
    "anonymous": true,
    "frequency": "3"
  }
}
```

### Configure Survey Schedule

**POST {{baseUrl}}/api/surveys/schedule**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "templateId": "template123",
  "schedule": {
    "startDate": "2024-03-21T00:00:00Z",
    "frequency": "3",
    "targetGroups": ["new-hires", "engineering"]
  }
}
```

### Export Reports

**GET {{baseUrl}}/api/reports/export**

Headers:
```
Authorization: Bearer {{token}}
```

Query params:
```
format=csv
startDate=2024-01-01
endDate=2024-03-21
department=Engineering
```

### Flag Critical Feedback

**POST {{baseUrl}}/api/feedback/{feedbackId}/flag**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "reason": "Immediate attention required - workplace concerns",
  "priority": "high",
  "assignedTo": "hr_manager_123"
}
```

## SURVEY MANAGEMENT ENDPOINTS

### Get Survey Details

**GET {{baseUrl}}/api/surveys/{surveyId}**

Headers:
```
Authorization: Bearer {{token}}
```

### Update Survey

**PUT {{baseUrl}}/api/surveys/{surveyId}**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "title": "Updated 3-Month Survey",
  "description": "Revised feedback collection for 3-month milestone",
  "questions": [
    {
      "id": "q1",
      "text": "Rate your onboarding experience",
      "type": "rating",
      "options": ["1", "2", "3", "4", "5"]
    }
  ],
  "settings": {
    "anonymous": true,
    "allowComments": true
  }
}
```

## NOTIFICATION PREFERENCES

### Update Notification Settings

**PUT {{baseUrl}}/api/notifications/settings**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "email": true,
  "inApp": true,
  "frequency": "daily",
  "types": {
    "survey_reminder": true,
    "feedback_received": true,
    "critical_feedback": true
  }
}
```

## Error Responses

### Unauthorized Access
```json
{
  "success": false,
  "error": {
    "code": "401",
    "message": "Unauthorized access. Please login."
  }
}
```

### Invalid Input
```json
{
  "success": false,
  "error": {
    "code": "422",
    "message": "Invalid input data",
    "details": {
      "field": "questions",
      "error": "At least one question is required"
    }
  }
}
```

### Resource Not Found
```json
{
  "success": false,
  "error": {
    "code": "404",
    "message": "Survey template not found"
  }
}
```

### Server Error
```json
{
  "success": false,
  "error": {
    "code": "500",
    "message": "Server error",
    "details": {
      "timestamp": "2024-03-21T10:00:00Z",
      "requestId": "req_123456",
      "path": "/api/surveys/pending"
    }
  }
}
``` 