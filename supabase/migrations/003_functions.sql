-- CrescentPlatform Database Functions
-- Atomic multi-table operations that ensure data consistency

-- ============================================================
-- FUNCTION: Create badge for associate (atomic)
-- Locks the associate row, creates badge, optionally queues for print
-- ============================================================
CREATE OR REPLACE FUNCTION create_badge_for_associate(
    p_eid TEXT,
    p_photo_url TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL,
    p_auto_queue BOOLEAN DEFAULT FALSE
) RETURNS JSONB AS $$
DECLARE
    v_associate RECORD;
    v_badge_number TEXT;
    v_badge_id UUID;
BEGIN
    -- Lock the associate row to prevent race conditions
    SELECT * INTO v_associate FROM associates WHERE eid = p_eid FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Associate not found');
    END IF;

    -- Check if badge already exists (UNIQUE constraint also enforces this)
    IF EXISTS (SELECT 1 FROM badges WHERE associate_eid = p_eid) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Badge already exists for this EID');
    END IF;

    -- Generate badge number: PLX-{EID}-{LAST3}
    v_badge_number := 'PLX-' || p_eid || '-' || UPPER(LEFT(v_associate.last_name, 3));

    -- Create badge
    INSERT INTO badges (associate_eid, badge_number, photo_url, status, created_by)
    VALUES (p_eid, v_badge_number, COALESCE(p_photo_url, v_associate.photo_url), 'Pending', p_created_by)
    RETURNING id INTO v_badge_id;

    -- Optionally add to print queue
    IF p_auto_queue THEN
        INSERT INTO badge_print_queue (badge_id, queued_by)
        VALUES (v_badge_id, p_created_by);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'badge_id', v_badge_id,
        'badge_number', v_badge_number
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Submit on-premise data (atomic)
-- Creates headcount snapshot + links new start EIDs in one transaction
-- ============================================================
CREATE OR REPLACE FUNCTION submit_on_premise_data(
    p_date DATE,
    p_shift TEXT,
    p_requested INTEGER,
    p_required INTEGER,
    p_working INTEGER,
    p_new_starts INTEGER,
    p_send_homes INTEGER DEFAULT 0,
    p_line_cuts INTEGER DEFAULT 0,
    p_new_start_eids TEXT[] DEFAULT '{}',
    p_notes TEXT DEFAULT NULL,
    p_submitted_by UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_on_premise_id UUID;
    v_eid TEXT;
    v_invalid_eids TEXT[] := '{}';
BEGIN
    -- Validate all EIDs exist before proceeding
    IF array_length(p_new_start_eids, 1) > 0 THEN
        FOR v_eid IN SELECT unnest(p_new_start_eids) LOOP
            IF NOT EXISTS (SELECT 1 FROM associates WHERE eid = v_eid) THEN
                v_invalid_eids := array_append(v_invalid_eids, v_eid);
            END IF;
        END LOOP;

        IF array_length(v_invalid_eids, 1) > 0 THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Invalid EIDs: ' || array_to_string(v_invalid_eids, ', ')
            );
        END IF;
    END IF;

    -- Upsert on-premise data (update if date+shift already exists)
    INSERT INTO on_premise_data (date, shift, requested, required, working, new_starts, send_homes, line_cuts, notes, submitted_by)
    VALUES (p_date, p_shift, p_requested, p_required, p_working, p_new_starts, p_send_homes, p_line_cuts, p_notes, p_submitted_by)
    ON CONFLICT (date, shift) DO UPDATE SET
        requested = EXCLUDED.requested,
        required = EXCLUDED.required,
        working = EXCLUDED.working,
        new_starts = EXCLUDED.new_starts,
        send_homes = EXCLUDED.send_homes,
        line_cuts = EXCLUDED.line_cuts,
        notes = EXCLUDED.notes,
        submitted_by = EXCLUDED.submitted_by,
        submitted_at = now()
    RETURNING id INTO v_on_premise_id;

    -- Link new start EIDs (triggers will auto-update associate status)
    IF array_length(p_new_start_eids, 1) > 0 THEN
        FOR v_eid IN SELECT unnest(p_new_start_eids) LOOP
            INSERT INTO on_premise_new_starts (on_premise_id, associate_eid, validated)
            VALUES (v_on_premise_id, v_eid, TRUE)
            ON CONFLICT (on_premise_id, associate_eid) DO NOTHING;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'on_premise_id', v_on_premise_id,
        'new_starts_linked', COALESCE(array_length(p_new_start_eids, 1), 0)
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Get associate full profile (with all related data)
-- ============================================================
CREATE OR REPLACE FUNCTION get_associate_profile(p_eid TEXT)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'associate', row_to_json(a),
        'badge', (SELECT row_to_json(b) FROM badges b WHERE b.associate_eid = a.eid),
        'early_leaves', (
            SELECT COALESCE(jsonb_agg(row_to_json(el) ORDER BY el.date DESC), '[]'::jsonb)
            FROM early_leaves el WHERE el.associate_eid = a.eid
        ),
        'corrective_actions', (
            SELECT COALESCE(jsonb_agg(row_to_json(ca) ORDER BY ca.date DESC), '[]'::jsonb)
            FROM corrective_actions ca WHERE ca.associate_eid = a.eid
        ),
        'hours_summary', (
            SELECT jsonb_build_object(
                'total_hours', COALESCE(SUM(hed.total_hours), 0),
                'records', COUNT(*)
            )
            FROM hours_employee_detail hed WHERE hed.associate_eid = a.eid
        )
    ) INTO v_result
    FROM associates a
    WHERE a.eid = p_eid;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Dashboard summary stats
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_summary(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'total_associates', (SELECT COUNT(*) FROM associates WHERE status = 'Active'),
        'total_dnr', (SELECT COUNT(*) FROM associates WHERE status = 'DNR'),
        'pipeline', (
            SELECT jsonb_object_agg(pipeline_status, cnt)
            FROM (
                SELECT pipeline_status, COUNT(*) as cnt
                FROM associates WHERE status = 'Active'
                GROUP BY pipeline_status
            ) sub
        ),
        'headcount_trend', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'date', opd.date,
                'shift', opd.shift,
                'requested', opd.requested,
                'required', opd.required,
                'working', opd.working,
                'fill_rate', CASE WHEN opd.required > 0
                    THEN ROUND((opd.working::numeric / opd.required) * 100, 1)
                    ELSE 0 END
            ) ORDER BY opd.date DESC), '[]'::jsonb)
            FROM on_premise_data opd
            WHERE opd.date BETWEEN p_start_date AND p_end_date
        ),
        'recent_early_leaves', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'date', el.date,
                'eid', el.associate_eid,
                'name', a.first_name || ' ' || a.last_name,
                'reason', el.reason,
                'corrective_action', el.corrective_action
            ) ORDER BY el.date DESC), '[]'::jsonb)
            FROM early_leaves el
            JOIN associates a ON a.eid = el.associate_eid
            WHERE el.date BETWEEN p_start_date AND p_end_date
            LIMIT 20
        )
    );
END;
$$ LANGUAGE plpgsql;
