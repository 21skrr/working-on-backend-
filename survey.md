# Postman Test Data for Survey API Endpoints

## Setup

1. Import the API endpoints into Postman
2. Setup an environment with:
   - `baseUrl`: Your API base URL (e.g., http://localhost:5000)
   - `token`: Authentication token obtained from login

## EMPLOYEE ENDPOINTS

### View Available Surveys

**GET {{baseUrl}}/api/surveys/available**

Headers:
```
Authorization: Bearer {{token}}
```

### Submit Survey Response

**POST {{baseUrl}}/api/surveys/:surveyId/respond**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "responses": [
    {
      "questionId": "q1",
      "answer": "Very satisfied",
      "rating": 5,
      "comments": "The onboarding process was well structured"
    }
  ],
  "isAnonymous": false,
  "completionTime": "2024-03-15T14:30:00Z"
}
```

### View Survey History

**GET {{baseUrl}}/api/surveys/history**

Headers:
```
Authorization: Bearer {{token}}
```

## SUPERVISOR ENDPOINTS

### View Team Survey Results

**GET {{baseUrl}}/api/surveys/team/results**

Headers:
```
Authorization: Bearer {{token}}
```

### Track Survey Completion Status

**GET {{baseUrl}}/api/surveys/team/completion**

Headers:
```
Authorization: Bearer {{token}}
```

## MANAGER ENDPOINTS

### View Department Survey Analytics

**GET {{baseUrl}}/api/surveys/department/analytics**

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
startDate=2024-01-01
endDate=2024-12-31
surveyType=onboarding
```

### Generate Survey Insights

**GET {{baseUrl}}/api/surveys/department/insights**

Headers:
```
Authorization: Bearer {{token}}
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
  "description": "Evaluate your onboarding experience after 3 months",
  "questions": [
    {
      "type": "rating",
      "text": "How satisfied are you with the onboarding process?",
      "options": ["1", "2", "3", "4", "5"]
    },
    {
      "type": "multiple_choice",
      "text": "Which training sessions were most helpful?",
      "options": ["Technical", "Company Culture", "Team Building"]
    }
  ],
  "settings": {
    "isAnonymous": true,
    "allowComments": true,
    "reminderFrequency": "weekly"
  }
}
```

### Schedule Survey Distribution

**POST {{baseUrl}}/api/surveys/schedule**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "surveyTemplateId": "template123",
  "schedule": {
    "triggerType": "timeAfterJoining",
    "triggerValue": 90,
    "reminderDays": [7, 3, 1]
  },
  "targetAudience": {
    "departments": ["all"],
    "roles": ["new_employees"],
    "joiningDateRange": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  }
}
```

### Monitor Survey Participation

**GET {{baseUrl}}/api/surveys/monitoring**

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
surveyId=survey123
department=Engineering
startDate=2024-01-01
```

### Export Survey Results

**GET {{baseUrl}}/api/surveys/export**

Headers:
```
Authorization: Bearer {{token}}
```

Query params (optional):
```
format=xlsx
surveyId=survey123
dateRange=quarterly
includeComments=true
```

### Update Survey Template

**PUT {{baseUrl}}/api/surveys/templates/:templateId**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "title": "Updated 3-Month Survey",
  "questions": [],
  "settings": {
    "isActive": true,
    "allowPartialSubmission": false
  }
}
```

### Configure Survey Rules

**PUT {{baseUrl}}/api/surveys/settings**

Headers:
```
Authorization: Bearer {{token}}
```

Body:
```json
{
  "autoScheduling": true,
  "reminderSettings": {
    "enabled": true,
    "frequency": "weekly",
    "maxReminders": 3
  },
  "anonymityRules": {
    "defaultIsAnonymous": true,
    "allowResponderChoice": false
  },
  "dataRetention": {
    "keepResponsesForDays": 365,
    "archiveAfterDays": 90
  }
}
```
