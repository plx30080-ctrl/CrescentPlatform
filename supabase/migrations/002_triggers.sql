-- CrescentPlatform Database Triggers
-- These enforce data consistency at the database level

-- ============================================================
-- TRIGGER 1: Auto-update updated_at on associates
-- ============================================================
CREATE OR REPLACE FUNCTION update_associates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_associates_updated
    BEFORE UPDATE ON associates
    FOR EACH ROW EXECUTE FUNCTION update_associates_timestamp();

-- ============================================================
-- TRIGGER 2: Sync DNR status from early_leaves to associates
-- Bidirectional: handles both adding AND removing DNR
-- ============================================================
CREATE OR REPLACE FUNCTION sync_dnr_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When corrective action is set to DNR, mark associate as DNR
    IF NEW.corrective_action = 'DNR' THEN
        UPDATE associates
        SET status = 'DNR', updated_at = now()
        WHERE eid = NEW.associate_eid AND status != 'DNR';
    END IF;

    -- When changing FROM DNR, check if any other DNR records exist
    IF OLD IS NOT NULL
       AND OLD.corrective_action = 'DNR'
       AND NEW.corrective_action != 'DNR' THEN
        IF NOT EXISTS (
            SELECT 1 FROM early_leaves
            WHERE associate_eid = NEW.associate_eid
              AND corrective_action = 'DNR'
              AND id != NEW.id
        ) THEN
            UPDATE associates
            SET status = 'Active', updated_at = now()
            WHERE eid = NEW.associate_eid AND status = 'DNR';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_dnr
    AFTER INSERT OR UPDATE ON early_leaves
    FOR EACH ROW EXECUTE FUNCTION sync_dnr_status();

-- ============================================================
-- TRIGGER 3: Sync new start status to associates
-- When an associate appears in on_premise_new_starts, update their pipeline
-- ============================================================
CREATE OR REPLACE FUNCTION sync_new_start_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE associates
    SET pipeline_status = 'Started',
        status = CASE
            WHEN status NOT IN ('DNR', 'Terminated') THEN 'Active'
            ELSE status
        END,
        actual_start_date = COALESCE(actual_start_date,
            (SELECT date FROM on_premise_data WHERE id = NEW.on_premise_id)),
        updated_at = now()
    WHERE eid = NEW.associate_eid;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_new_start
    AFTER INSERT ON on_premise_new_starts
    FOR EACH ROW EXECUTE FUNCTION sync_new_start_status();

-- ============================================================
-- TRIGGER 4: Sync hours data to associate status
-- When hours are recorded, ensure associate is marked as Started
-- ============================================================
CREATE OR REPLACE FUNCTION sync_associate_hours()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE associates
    SET pipeline_status = 'Started',
        status = CASE
            WHEN status NOT IN ('DNR', 'Terminated') THEN 'Active'
            ELSE status
        END,
        updated_at = now()
    WHERE eid = NEW.associate_eid
      AND pipeline_status != 'Started';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_associate_hours
    AFTER INSERT ON hours_employee_detail
    FOR EACH ROW EXECUTE FUNCTION sync_associate_hours();

-- ============================================================
-- TRIGGER 5: Auto-update badges.updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_badges_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_badges_updated
    BEFORE UPDATE ON badges
    FOR EACH ROW EXECUTE FUNCTION update_badges_timestamp();

-- ============================================================
-- TRIGGER 6: Auto-update early_leaves.updated_at
-- ============================================================
CREATE TRIGGER trg_early_leaves_updated
    BEFORE UPDATE ON early_leaves
    FOR EACH ROW EXECUTE FUNCTION update_associates_timestamp();

-- ============================================================
-- TRIGGER 7: Auto-create corrective action record when early leave has one
-- ============================================================
CREATE OR REPLACE FUNCTION auto_create_corrective_action()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.corrective_action != 'None' THEN
        -- Only create if this is a new record or the action changed
        IF OLD IS NULL OR OLD.corrective_action != NEW.corrective_action THEN
            INSERT INTO corrective_actions (associate_eid, early_leave_id, date, action, created_by)
            VALUES (NEW.associate_eid, NEW.id, NEW.date, NEW.corrective_action, NEW.created_by);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_corrective_action
    AFTER INSERT OR UPDATE ON early_leaves
    FOR EACH ROW EXECUTE FUNCTION auto_create_corrective_action();
