-- CrescentPlatform Database Schema
-- PostgreSQL via Supabase
-- All tables use associates.eid as the universal key for cross-module consistency

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS (app users - managers, recruiters, admins)
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_uid UUID UNIQUE, -- links to Supabase Auth
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'onsite_manager'
        CHECK (role IN ('admin', 'market_manager', 'recruiter', 'onsite_manager')),
    branch TEXT NOT NULL DEFAULT 'Main',
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login TIMESTAMPTZ
);

-- ============================================================
-- 2. ASSOCIATES (THE single source of truth for every person)
-- ============================================================
CREATE TABLE associates (
    eid TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Active', 'Inactive', 'DNR', 'Terminated')),
    pipeline_status TEXT NOT NULL DEFAULT 'Applied'
        CHECK (pipeline_status IN ('Applied', 'Interviewing', 'Background Check',
               'Orientation', 'Started', 'Declined')),
    shift TEXT CHECK (shift IN ('1st', '2nd')),
    branch TEXT NOT NULL DEFAULT 'Main',
    recruiter TEXT,
    recruiter_uid UUID REFERENCES users(id) ON DELETE SET NULL,
    process_date DATE,
    planned_start_date DATE,
    actual_start_date DATE,
    termination_date DATE,
    termination_reason TEXT,
    eligible_for_rehire BOOLEAN,
    i9_cleared BOOLEAN DEFAULT FALSE,
    background_check_status TEXT,
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_associates_status ON associates(status);
CREATE INDEX idx_associates_pipeline ON associates(pipeline_status);
CREATE INDEX idx_associates_recruiter ON associates(recruiter);
CREATE INDEX idx_associates_branch ON associates(branch);
CREATE INDEX idx_associates_shift ON associates(shift);
CREATE INDEX idx_associates_name ON associates(last_name, first_name);

-- ============================================================
-- 3. BADGES (one active badge per associate)
-- ============================================================
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    associate_eid TEXT NOT NULL REFERENCES associates(eid) ON UPDATE CASCADE ON DELETE CASCADE,
    badge_number TEXT UNIQUE NOT NULL,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Cleared', 'Not Cleared', 'Suspended')),
    printed_at TIMESTAMPTZ,
    printed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ,
    issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    UNIQUE(associate_eid)
);

-- ============================================================
-- 4. BADGE PRINT QUEUE
-- ============================================================
CREATE TABLE badge_print_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    priority TEXT NOT NULL DEFAULT 'Normal'
        CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
    status TEXT NOT NULL DEFAULT 'Queued'
        CHECK (status IN ('Queued', 'Printing', 'Completed', 'Failed')),
    queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    queued_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    error TEXT
);

CREATE INDEX idx_print_queue_status ON badge_print_queue(status) WHERE status IN ('Queued', 'Printing');

-- ============================================================
-- 5. BADGE TEMPLATES
-- ============================================================
CREATE TABLE badge_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    card_size JSONB NOT NULL DEFAULT '{"width": 212.5, "height": 337.5}',
    elements JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. ON-PREMISE DATA (daily headcount snapshots)
-- ============================================================
CREATE TABLE on_premise_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    shift TEXT NOT NULL CHECK (shift IN ('1st', '2nd')),
    requested INTEGER NOT NULL DEFAULT 0,
    required INTEGER NOT NULL DEFAULT 0,
    working INTEGER NOT NULL DEFAULT 0,
    new_starts INTEGER NOT NULL DEFAULT 0,
    send_homes INTEGER NOT NULL DEFAULT 0,
    line_cuts INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(date, shift)
);

CREATE INDEX idx_on_premise_date ON on_premise_data(date DESC);

-- ============================================================
-- 7. ON-PREMISE NEW STARTS (links snapshots to associates)
-- ============================================================
CREATE TABLE on_premise_new_starts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    on_premise_id UUID NOT NULL REFERENCES on_premise_data(id) ON DELETE CASCADE,
    associate_eid TEXT NOT NULL REFERENCES associates(eid) ON UPDATE CASCADE ON DELETE CASCADE,
    validated BOOLEAN DEFAULT FALSE,
    validation_message TEXT,
    UNIQUE(on_premise_id, associate_eid)
);

-- ============================================================
-- 8. HOURS DATA (weekly labor report summaries)
-- ============================================================
CREATE TABLE hours_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_ending DATE NOT NULL,
    shift1_total NUMERIC(10,2) DEFAULT 0,
    shift1_direct NUMERIC(10,2) DEFAULT 0,
    shift1_indirect NUMERIC(10,2) DEFAULT 0,
    shift2_total NUMERIC(10,2) DEFAULT 0,
    shift2_direct NUMERIC(10,2) DEFAULT 0,
    shift2_indirect NUMERIC(10,2) DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(week_ending)
);

CREATE INDEX idx_hours_week ON hours_data(week_ending DESC);

-- ============================================================
-- 9. HOURS EMPLOYEE DETAIL (per-employee breakdown)
-- ============================================================
CREATE TABLE hours_employee_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hours_data_id UUID NOT NULL REFERENCES hours_data(id) ON DELETE CASCADE,
    associate_eid TEXT NOT NULL REFERENCES associates(eid) ON UPDATE CASCADE ON DELETE CASCADE,
    shift TEXT CHECK (shift IN ('1st', '2nd')),
    labor_type TEXT CHECK (labor_type IN ('Direct', 'Indirect')),
    total_hours NUMERIC(10,2) DEFAULT 0,
    regular_hours NUMERIC(10,2) DEFAULT 0,
    overtime_hours NUMERIC(10,2) DEFAULT 0,
    daily_breakdown JSONB,
    UNIQUE(hours_data_id, associate_eid, labor_type)
);

-- ============================================================
-- 10. BRANCH METRICS (recruiter/branch daily & weekly activity)
-- ============================================================
CREATE TABLE branch_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE,
    week_ending DATE,
    branch TEXT NOT NULL DEFAULT 'Main',
    is_weekly_summary BOOLEAN NOT NULL DEFAULT FALSE,
    interviews_scheduled INTEGER DEFAULT 0,
    interview_shows INTEGER DEFAULT 0,
    shift1_processed INTEGER DEFAULT 0,
    shift2_processed INTEGER DEFAULT 0,
    shift2_confirmations INTEGER DEFAULT 0,
    next_day_confirmations INTEGER DEFAULT 0,
    total_applicants INTEGER,
    total_processed INTEGER,
    total_headcount INTEGER,
    on_premise_count INTEGER,
    scheduled_count INTEGER,
    attendance_pct NUMERIC(5,2),
    notes TEXT,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_branch_metrics_date ON branch_metrics(date DESC);
CREATE INDEX idx_branch_metrics_week ON branch_metrics(week_ending DESC) WHERE is_weekly_summary;
CREATE INDEX idx_branch_metrics_branch ON branch_metrics(branch);

-- ============================================================
-- 11. EARLY LEAVES
-- ============================================================
CREATE TABLE early_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    associate_eid TEXT NOT NULL REFERENCES associates(eid) ON UPDATE CASCADE ON DELETE CASCADE,
    date DATE NOT NULL,
    shift TEXT CHECK (shift IN ('1st', '2nd')),
    leave_time TEXT,
    scheduled_end TEXT,
    hours_worked NUMERIC(5,2),
    reason TEXT,
    corrective_action TEXT NOT NULL DEFAULT 'None'
        CHECK (corrective_action IN ('None', 'Warning', '5 Day Suspension', 'DNR')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_early_leaves_date ON early_leaves(date DESC);
CREATE INDEX idx_early_leaves_eid ON early_leaves(associate_eid);

-- ============================================================
-- 12. CORRECTIVE ACTIONS (disciplinary history)
-- ============================================================
CREATE TABLE corrective_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    associate_eid TEXT NOT NULL REFERENCES associates(eid) ON UPDATE CASCADE ON DELETE CASCADE,
    early_leave_id UUID REFERENCES early_leaves(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    action TEXT NOT NULL
        CHECK (action IN ('None', 'Warning', '5 Day Suspension', 'DNR')),
    offense_category TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_corrective_actions_eid ON corrective_actions(associate_eid);

-- ============================================================
-- 13. UPLOAD HISTORY (audit trail for bulk imports)
-- ============================================================
CREATE TABLE upload_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_table TEXT NOT NULL,
    record_count INTEGER NOT NULL DEFAULT 0,
    file_name TEXT,
    upload_type TEXT CHECK (upload_type IN ('append', 'replace', 'upsert')),
    column_mapping JSONB,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    details JSONB
);

-- ============================================================
-- DEFAULT DATA
-- ============================================================
INSERT INTO badge_templates (name, is_default, card_size, elements) VALUES (
    'Standard Badge',
    TRUE,
    '{"width": 212.5, "height": 337.5}',
    '[
        {"type": "logo", "x": 56, "y": 10, "width": 100, "height": 40},
        {"type": "photo", "x": 56, "y": 60, "width": 100, "height": 120},
        {"type": "name", "x": 106, "y": 200, "fontSize": 14, "fontWeight": "bold"},
        {"type": "eid", "x": 106, "y": 220, "fontSize": 11},
        {"type": "shift", "x": 106, "y": 240, "fontSize": 11},
        {"type": "barcode", "x": 106, "y": 270, "width": 160, "height": 50}
    ]'
);
