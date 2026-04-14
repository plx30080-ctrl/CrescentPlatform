import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { createCorrectiveAction } from '../../services/earlyLeaveService';
import { CORRECTIVE_ACTIONS } from '../../lib/constants';
import type { CorrectiveAction as CorrectiveActionType } from '../../lib/constants';

interface Props {
  open: boolean;
  associateEid: string;
  onClose: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
}

export default function CorrectiveActionDialog({
  open,
  associateEid,
  onClose,
  onCreated,
  onError,
}: Props) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    action: 'Warning' as CorrectiveActionType,
    offense_category: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await createCorrectiveAction({
        associate_eid: associateEid,
        early_leave_id: null,
        date: form.date,
        action: form.action,
        offense_category: form.offense_category || null,
        notes: form.notes || null,
        created_by: null,
      });
      onCreated();
      setForm({
        date: new Date().toISOString().split('T')[0],
        action: 'Warning',
        offense_category: '',
        notes: '',
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to log corrective action');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Log Corrective Action</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Action"
                value={form.action}
                onChange={(e) => handleChange('action', e.target.value)}
                required
              >
                {CORRECTIVE_ACTIONS.filter((a) => a !== 'None').map((a) => (
                  <MenuItem key={a} value={a}>{a}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Offense Category"
            value={form.offense_category}
            onChange={(e) => handleChange('offense_category', e.target.value)}
            placeholder="e.g. Attendance, Conduct, Safety..."
          />

          <TextField
            fullWidth
            label="Notes"
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving...' : 'Log Action'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
