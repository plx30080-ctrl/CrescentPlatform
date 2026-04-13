import { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { z } from 'zod';
import {
  ASSOCIATE_STATUS,
  PIPELINE_STATUS,
  SHIFTS,
  BADGE_STATUS,
} from '../../lib/constants';
import type { AssociateFormData } from '../../types/associate';

const associateSchema = z.object({
  eid: z.string().min(1, 'EID is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').nullable().optional(),
  phone: z.string().nullable().optional(),
  status: z.enum(ASSOCIATE_STATUS),
  pipeline_status: z.enum(PIPELINE_STATUS),
  shift: z.enum(SHIFTS).nullable().optional(),
  branch: z.string().nullable().optional(),
  recruiter: z.string().nullable().optional(),
  process_date: z.string().nullable().optional(),
  planned_start_date: z.string().nullable().optional(),
  i9_cleared: z.boolean(),
  background_check_status: z.enum(BADGE_STATUS).nullable().optional(),
  notes: z.string().nullable().optional(),
});

interface AssociateFormProps {
  initialData?: Partial<AssociateFormData>;
  onSubmit: (data: AssociateFormData) => void | Promise<void>;
  onCancel: () => void;
}

export default function AssociateForm({
  initialData,
  onSubmit,
  onCancel,
}: AssociateFormProps) {
  const isEditMode = Boolean(initialData?.eid);

  const [formData, setFormData] = useState<AssociateFormData>({
    eid: initialData?.eid ?? '',
    first_name: initialData?.first_name ?? '',
    last_name: initialData?.last_name ?? '',
    email: initialData?.email ?? null,
    phone: initialData?.phone ?? null,
    status: initialData?.status ?? 'Active',
    pipeline_status: initialData?.pipeline_status ?? 'Applied',
    shift: initialData?.shift ?? null,
    branch: initialData?.branch ?? null,
    recruiter: initialData?.recruiter ?? null,
    recruiter_uid: initialData?.recruiter_uid ?? null,
    process_date: initialData?.process_date ?? null,
    planned_start_date: initialData?.planned_start_date ?? null,
    actual_start_date: initialData?.actual_start_date ?? null,
    termination_date: initialData?.termination_date ?? null,
    termination_reason: initialData?.termination_reason ?? null,
    eligible_for_rehire: initialData?.eligible_for_rehire ?? null,
    i9_cleared: initialData?.i9_cleared ?? false,
    background_check_status: initialData?.background_check_status ?? null,
    photo_url: initialData?.photo_url ?? null,
    notes: initialData?.notes ?? null,
    updated_by: initialData?.updated_by ?? null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof AssociateFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToValidate = {
      ...formData,
      email: formData.email || null,
      phone: formData.phone || null,
      shift: formData.shift || null,
      branch: formData.branch || null,
      recruiter: formData.recruiter || null,
      process_date: formData.process_date || null,
      planned_start_date: formData.planned_start_date || null,
      background_check_status: formData.background_check_status || null,
      notes: formData.notes || null,
    };

    const result = associateSchema.safeParse(dataToValidate);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(dataToValidate as AssociateFormData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="EID"
            value={formData.eid}
            onChange={(e) => handleChange('eid', e.target.value)}
            required
            disabled={isEditMode}
            error={Boolean(errors.eid)}
            helperText={errors.eid}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="First Name"
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            required
            error={Boolean(errors.first_name)}
            helperText={errors.first_name}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Last Name"
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            required
            error={Boolean(errors.last_name)}
            helperText={errors.last_name}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email ?? ''}
            onChange={(e) => handleChange('email', e.target.value || null)}
            error={Boolean(errors.email)}
            helperText={errors.email}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Phone"
            value={formData.phone ?? ''}
            onChange={(e) => handleChange('phone', e.target.value || null)}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            fullWidth
            label="Status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            error={Boolean(errors.status)}
            helperText={errors.status}
          >
            {ASSOCIATE_STATUS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            fullWidth
            label="Pipeline Status"
            value={formData.pipeline_status}
            onChange={(e) => handleChange('pipeline_status', e.target.value)}
            error={Boolean(errors.pipeline_status)}
            helperText={errors.pipeline_status}
          >
            {PIPELINE_STATUS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            fullWidth
            label="Shift"
            value={formData.shift ?? ''}
            onChange={(e) => handleChange('shift', e.target.value || null)}
          >
            <MenuItem value="">None</MenuItem>
            {SHIFTS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Branch"
            value={formData.branch ?? ''}
            onChange={(e) => handleChange('branch', e.target.value || null)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Recruiter"
            value={formData.recruiter ?? ''}
            onChange={(e) => handleChange('recruiter', e.target.value || null)}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Process Date"
            type="date"
            value={formData.process_date ?? ''}
            onChange={(e) => handleChange('process_date', e.target.value || null)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Planned Start Date"
            type="date"
            value={formData.planned_start_date ?? ''}
            onChange={(e) => handleChange('planned_start_date', e.target.value || null)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            label="Background Check Status"
            value={formData.background_check_status ?? ''}
            onChange={(e) =>
              handleChange('background_check_status', e.target.value || null)
            }
          >
            <MenuItem value="">None</MenuItem>
            {BADGE_STATUS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.i9_cleared}
                  onChange={(e) => handleChange('i9_cleared', e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">I-9 Cleared</Typography>
              }
            />
          </Box>
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            label="Notes"
            value={formData.notes ?? ''}
            onChange={(e) => handleChange('notes', e.target.value || null)}
            multiline
            rows={3}
          />
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
