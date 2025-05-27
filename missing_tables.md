# Missing Tables for Reports & Analytics Implementation

## Report Management Tables

### 1. `report_templates`
```sql
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    created_by UUID REFERENCES users(id),
    is_system_template BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. `report_schedules`
```sql
CREATE TABLE report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES report_templates(id),
    name VARCHAR(255) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    recipients JSONB NOT NULL,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3. `report_executions`
```sql
CREATE TABLE report_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES report_schedules(id),
    template_id UUID REFERENCES report_templates(id),
    status VARCHAR(50) NOT NULL,
    result_url VARCHAR(512),
    error_message TEXT,
    execution_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Analytics Tables

### 4. `analytics_dashboards`
```sql

CREATE TABLE onboarding_analytics (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    program_id INT,
    milestone_completion JSON,
    time_to_completion INT,
    bottlenecks JSON,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (program_id) REFERENCES programs(id)
);

```

### 5. `analytics_widgets`
```sql
CREATE TABLE analytics_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID REFERENCES analytics_dashboards(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    position INTEGER,
    size JSONB,
    refresh_interval INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 6. `analytics_metrics`
```sql
CREATE TABLE analytics_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    calculation_method VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    is_custom BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 7. `analytics_data_cache`
```sql
CREATE TABLE analytics_data_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_id UUID REFERENCES analytics_metrics(id),
    data JSONB NOT NULL,
    cache_key VARCHAR(255) NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Tracking Tables

### 8. `training_analytics`
```sql
CREATE TABLE training_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    course_id UUID REFERENCES courses(id),
    progress INTEGER DEFAULT 0,
    completion_time INTEGER,
    score INTEGER,
    attempts INTEGER DEFAULT 0,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 9. `onboarding_analytics`
```sql
CREATE TABLE onboarding_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    program_id UUID REFERENCES programs(id),
    milestone_completion JSONB,
    time_to_completion INTEGER,
    bottlenecks JSONB,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Modifications to Existing Tables

### 1. Add to `users` table:
```sql
ALTER TABLE users ADD COLUMN analytics_preferences JSONB;
ALTER TABLE users ADD COLUMN dashboard_config JSONB;
```

### 2. Add to `teams` table:
```sql
ALTER TABLE teams ADD COLUMN analytics_config JSONB;
ALTER TABLE teams ADD COLUMN performance_metrics JSONB;
```

### 3. Add to `departments` table (if not exists):
```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    analytics_config JSONB,
    performance_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Notes
1. All tables use UUID as primary keys for consistency
2. JSONB type is used for flexible configuration storage
3. Timestamps are included for tracking and auditing
4. Foreign keys maintain data integrity
5. Indexes should be added based on query patterns
6. Consider partitioning large tables like `analytics_data_cache`
7. Implement proper archiving strategy for historical data 