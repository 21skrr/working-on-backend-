# Seed Data for Reports & Analytics System

## 1. Default Report Templates

```sql
INSERT INTO report_templates (id, name, description, type, config, is_system_template) VALUES
-- Employee Templates
(uuid_generate_v4(), 'Personal Progress Report', 'Individual progress tracking report', 'employee', 
'{
  "sections": [
    {"type": "checklist_progress", "title": "Checklist Completion"},
    {"type": "training_summary", "title": "Training Progress"},
    {"type": "feedback_history", "title": "Recent Feedback"}
  ],
  "timeframe": "last_30_days"
}', true),

-- Supervisor Templates
(uuid_generate_v4(), 'Team Performance Overview', 'Comprehensive team performance report', 'supervisor',
'{
  "sections": [
    {"type": "checklist_progress", "title": "Team Checklist Progress"},
    {"type": "training_completion", "title": "Training Participation"},
    {"type": "feedback_analysis", "title": "Team Feedback Trends"},
    {"type": "coaching_summary", "title": "Coaching Sessions Overview"}
  ],
  "aggregation": "by_employee"
}', true),

-- Manager Templates
(uuid_generate_v4(), 'Department Analytics Report', 'Department-wide performance metrics', 'manager',
'{
  "sections": [
    {"type": "onboarding_kpis", "title": "Onboarding Performance"},
    {"type": "probation_tracking", "title": "Probation Status"},
    {"type": "evaluation_comparison", "title": "Team Evaluations"},
    {"type": "satisfaction_trends", "title": "Employee Satisfaction"}
  ],
  "aggregation": "by_team"
}', true),

-- HR Templates
(uuid_generate_v4(), 'Organization Health Report', 'Complete organizational analytics', 'hr',
'{
  "sections": [
    {"type": "completion_rates", "title": "Program Completion Rates"},
    {"type": "feedback_participation", "title": "Feedback Metrics"},
    {"type": "training_effectiveness", "title": "Training Analysis"},
    {"type": "evaluation_metrics", "title": "Evaluation Effectiveness"}
  ],
  "aggregation": "by_department"
}', true);
```

## 2. Default Analytics Metrics

```sql
INSERT INTO analytics_metrics (id, name, category, calculation_method, config, is_custom) VALUES
-- Employee Metrics
(uuid_generate_v4(), 'Checklist Completion Rate', 'onboarding', 'percentage',
'{
  "formula": "completed_items / total_items * 100",
  "data_source": "checklistprogresses",
  "update_frequency": "real-time"
}', false),

-- Supervisor Metrics
(uuid_generate_v4(), 'Team Training Completion', 'training', 'aggregate',
'{
  "formula": "AVG(completion_rate) GROUP BY team_id",
  "data_source": "training_analytics",
  "update_frequency": "daily"
}', false),

-- Manager Metrics
(uuid_generate_v4(), 'Department Onboarding Health', 'onboarding', 'composite',
'{
  "components": [
    {"metric": "checklist_completion", "weight": 0.4},
    {"metric": "training_progress", "weight": 0.3},
    {"metric": "feedback_score", "weight": 0.3}
  ],
  "update_frequency": "daily"
}', false),

-- HR Metrics
(uuid_generate_v4(), 'Organization Training Effectiveness', 'training', 'composite',
'{
  "components": [
    {"metric": "completion_rate", "weight": 0.3},
    {"metric": "assessment_scores", "weight": 0.4},
    {"metric": "feedback_ratings", "weight": 0.3}
  ],
  "update_frequency": "weekly"
}', false);
```

## 3. Default Dashboard Configurations

```sql
INSERT INTO analytics_dashboards (id, name, type, config, role_access) VALUES
-- Employee Dashboard
(uuid_generate_v4(), 'My Progress Dashboard', 'personal',
'{
  "layout": "grid",
  "refresh_rate": 3600,
  "widgets": [
    {"type": "progress_chart", "size": "medium", "position": 1},
    {"type": "checklist_status", "size": "small", "position": 2},
    {"type": "recent_feedback", "size": "medium", "position": 3}
  ]
}',
'["employee"]'),

-- Supervisor Dashboard
(uuid_generate_v4(), 'Team Overview Dashboard', 'team',
'{
  "layout": "grid",
  "refresh_rate": 1800,
  "widgets": [
    {"type": "team_progress", "size": "large", "position": 1},
    {"type": "coaching_summary", "size": "medium", "position": 2},
    {"type": "feedback_trends", "size": "medium", "position": 3}
  ]
}',
'["supervisor"]'),

-- Manager Dashboard
(uuid_generate_v4(), 'Department Analytics Dashboard', 'department',
'{
  "layout": "grid",
  "refresh_rate": 3600,
  "widgets": [
    {"type": "department_kpis", "size": "large", "position": 1},
    {"type": "team_comparison", "size": "large", "position": 2},
    {"type": "probation_tracking", "size": "medium", "position": 3}
  ]
}',
'["manager"]'),

-- HR Dashboard
(uuid_generate_v4(), 'Organization Analytics Dashboard', 'organization',
'{
  "layout": "grid",
  "refresh_rate": 7200,
  "widgets": [
    {"type": "org_completion_rates", "size": "large", "position": 1},
    {"type": "feedback_analysis", "size": "large", "position": 2},
    {"type": "training_effectiveness", "size": "large", "position": 3}
  ]
}',
'["hr"]');
```

## 4. Default Analytics Widgets

```sql
INSERT INTO analytics_widgets (dashboard_id, name, type, config, position, refresh_interval)
SELECT 
  d.id,
  w.name,
  w.type,
  w.config::jsonb,
  w.position,
  w.refresh
FROM analytics_dashboards d
CROSS JOIN LATERAL (
  VALUES 
    ('Progress Chart', 'progress_chart', '{"data_source": "checklistprogresses", "chart_type": "line"}', 1, 3600),
    ('Checklist Status', 'checklist_status', '{"data_source": "checklistitems", "display": "percentage"}', 2, 1800),
    ('Recent Feedback', 'recent_feedback', '{"data_source": "feedback", "limit": 5}', 3, 1800)
) AS w(name, type, config, position, refresh)
WHERE d.type = 'personal';
```

## Notes on Seed Data:

1. **Templates**:
   - Provided role-specific report templates
   - Included common reporting scenarios
   - Configurable sections and metrics

2. **Metrics**:
   - Basic metrics for each role
   - Calculation methods defined
   - Update frequencies specified

3. **Dashboards**:
   - Role-specific layouts
   - Widget configurations
   - Access control built-in

4. **Widgets**:
   - Common analytics visualizations
   - Data source mappings
   - Refresh intervals defined

## Implementation Steps:

1. Create a migration file with this seed data
2. Run the migration after table creation
3. Test data access with the analytics endpoints
4. Verify role-based access control
5. Test report generation with templates

## Additional Considerations:

1. Backup the seed data before deployment
2. Consider environment-specific configurations
3. Plan for custom template additions
4. Set up data refresh schedules
5. Monitor analytics performance
6. Plan for data archival strategy 