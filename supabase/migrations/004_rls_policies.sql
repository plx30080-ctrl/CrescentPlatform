-- CrescentPlatform Row-Level Security Policies
-- All authenticated users can read/write; admins can delete

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE associates ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_print_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE on_premise_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE on_premise_new_starts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hours_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE hours_employee_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE early_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all data
CREATE POLICY "Authenticated read" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON associates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON badges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON badge_print_queue FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON badge_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON on_premise_data FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON on_premise_new_starts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON hours_data FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON hours_employee_detail FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON branch_metrics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON early_leaves FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON corrective_actions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON upload_history FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can insert/update
CREATE POLICY "Authenticated write" ON associates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update" ON associates FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON badges FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update" ON badges FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON badge_print_queue FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update" ON badge_print_queue FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON badge_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update" ON badge_templates FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON on_premise_data FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update" ON on_premise_data FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON on_premise_new_starts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON hours_data FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update" ON hours_data FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON hours_employee_detail FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON branch_metrics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update" ON branch_metrics FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON early_leaves FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update" ON early_leaves FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON corrective_actions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON upload_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update" ON users FOR UPDATE USING (auth.role() = 'authenticated');

-- Delete policies: all authenticated users can delete (admin checks done in app layer)
CREATE POLICY "Authenticated delete" ON associates FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete" ON badges FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete" ON badge_print_queue FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete" ON on_premise_data FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete" ON early_leaves FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete" ON corrective_actions FOR DELETE USING (auth.role() = 'authenticated');
