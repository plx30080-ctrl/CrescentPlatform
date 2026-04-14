import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SendIcon from '@mui/icons-material/Send';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { SHIFTS, UPLOAD_TYPES } from '../lib/constants';
import type { Shift, UploadType } from '../lib/constants';
import { submitOnPremiseData, submitBranchMetrics, submitHoursData } from '../services/metricsService';
import {
  validateMapping,
  importData,
  getUploadHistory,
  getTargetTableFields,
  type ColumnMapping,
  type UploadHistoryRecord,
} from '../services/dataImportService';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate } from '../utils/formatters';
import FileUploader from '../components/dataEntry/FileUploader';
import ColumnMapper from '../components/dataEntry/ColumnMapper';

type TargetTable = 'associates' | 'on_premise_data' | 'hours_data' | 'branch_metrics' | 'early_leaves';

const TARGET_TABLE_OPTIONS: { value: TargetTable; label: string }[] = [
  { value: 'associates', label: 'Associates' },
  { value: 'on_premise_data', label: 'On-Premise Data' },
  { value: 'hours_data', label: 'Hours Data' },
  { value: 'branch_metrics', label: 'Branch Metrics' },
  { value: 'early_leaves', label: 'Early Leaves' },
];

const IMPORT_STEPS = [
  'Select Target',
  'Upload File',
  'Map Columns',
  'Preview',
  'Import',
];

export default function DataEntryPage() {
  const { showSuccess, showError } = useNotification();
  const [mainTab, setMainTab] = useState(0);
  const [manualSubTab, setManualSubTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Data Entry
      </Typography>

      <Card>
        <Tabs
          value={mainTab}
          onChange={(_, v) => setMainTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Manual Entry" />
          <Tab label="Import Data" />
          <Tab label="Upload History" />
        </Tabs>

        <CardContent>
          {mainTab === 0 && (
            <Box>
              <Tabs
                value={manualSubTab}
                onChange={(_, v) => setManualSubTab(v)}
                sx={{ mb: 3 }}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="On-Premise Data" />
                <Tab label="Branch Metrics" />
                <Tab label="Hours Data" />
              </Tabs>

              {manualSubTab === 0 && (
                <OnPremiseForm
                  onSuccess={() => showSuccess('On-premise data submitted successfully')}
                  onError={(msg) => showError(msg)}
                />
              )}
              {manualSubTab === 1 && (
                <BranchMetricsForm
                  onSuccess={() => showSuccess('Branch metrics submitted successfully')}
                  onError={(msg) => showError(msg)}
                />
              )}
              {manualSubTab === 2 && (
                <HoursDataForm
                  onSuccess={() => showSuccess('Hours data submitted successfully')}
                  onError={(msg) => showError(msg)}
                />
              )}
            </Box>
          )}

          {mainTab === 1 && (
            <ImportWizard
              onSuccess={() => showSuccess('Data imported successfully')}
              onError={(msg) => showError(msg)}
            />
          )}

          {mainTab === 2 && <UploadHistoryTab />}
        </CardContent>
      </Card>
    </Box>
  );
}

/* ======================== On-Premise Form ======================== */

function OnPremiseForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: '1st' as Shift,
    requested: '',
    required: '',
    working: '',
    new_starts: '',
    send_homes: '',
    line_cuts: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await submitOnPremiseData({
        date: form.date,
        shift: form.shift,
        requested: parseInt(form.requested) || 0,
        required: parseInt(form.required) || 0,
        working: parseInt(form.working) || 0,
        new_starts: parseInt(form.new_starts) || 0,
        send_homes: parseInt(form.send_homes) || 0,
        line_cuts: parseInt(form.line_cuts) || 0,
        notes: form.notes || undefined,
      });
      onSuccess();
      setForm({
        date: new Date().toISOString().split('T')[0],
        shift: '1st',
        requested: '',
        required: '',
        working: '',
        new_starts: '',
        send_homes: '',
        line_cuts: '',
        notes: '',
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to submit data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
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
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            fullWidth
            label="Shift"
            value={form.shift}
            onChange={(e) => handleChange('shift', e.target.value)}
            required
          >
            {SHIFTS.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Requested"
            type="number"
            value={form.requested}
            onChange={(e) => handleChange('requested', e.target.value)}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Required"
            type="number"
            value={form.required}
            onChange={(e) => handleChange('required', e.target.value)}
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Working"
            type="number"
            value={form.working}
            onChange={(e) => handleChange('working', e.target.value)}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="New Starts"
            type="number"
            value={form.new_starts}
            onChange={(e) => handleChange('new_starts', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Send Homes"
            type="number"
            value={form.send_homes}
            onChange={(e) => handleChange('send_homes', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Line Cuts"
            type="number"
            value={form.line_cuts}
            onChange={(e) => handleChange('line_cuts', e.target.value)}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            label="Notes"
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            multiline
            rows={2}
          />
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SendIcon />}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

/* ======================== Branch Metrics Form ======================== */

function BranchMetricsForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    branch: '',
    week_ending: '',
    is_weekly_summary: false,
    interviews_scheduled: '',
    interview_shows: '',
    shift1_processed: '',
    shift2_processed: '',
    shift2_confirmations: '',
    next_day_confirmations: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await submitBranchMetrics({
        date: form.date || null,
        week_ending: form.week_ending || null,
        branch: form.branch,
        is_weekly_summary: form.is_weekly_summary,
        interviews_scheduled: parseInt(form.interviews_scheduled) || 0,
        interview_shows: parseInt(form.interview_shows) || 0,
        shift1_processed: parseInt(form.shift1_processed) || 0,
        shift2_processed: parseInt(form.shift2_processed) || 0,
        shift2_confirmations: parseInt(form.shift2_confirmations) || 0,
        next_day_confirmations: parseInt(form.next_day_confirmations) || 0,
        total_applicants: null,
        total_processed: null,
        total_headcount: null,
        on_premise_count: null,
        scheduled_count: null,
        attendance_pct: null,
        notes: form.notes || null,
        submitted_by: null,
      });
      onSuccess();
      setForm({
        date: new Date().toISOString().split('T')[0],
        branch: form.branch,
        week_ending: '',
        is_weekly_summary: false,
        interviews_scheduled: '',
        interview_shows: '',
        shift1_processed: '',
        shift2_processed: '',
        shift2_confirmations: '',
        next_day_confirmations: '',
        notes: '',
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to submit metrics');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
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
            fullWidth
            label="Branch"
            value={form.branch}
            onChange={(e) => handleChange('branch', e.target.value)}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Interviews Scheduled"
            type="number"
            value={form.interviews_scheduled}
            onChange={(e) => handleChange('interviews_scheduled', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Interview Shows"
            type="number"
            value={form.interview_shows}
            onChange={(e) => handleChange('interview_shows', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Shift 1 Processed"
            type="number"
            value={form.shift1_processed}
            onChange={(e) => handleChange('shift1_processed', e.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Shift 2 Processed"
            type="number"
            value={form.shift2_processed}
            onChange={(e) => handleChange('shift2_processed', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Shift 2 Confirmations"
            type="number"
            value={form.shift2_confirmations}
            onChange={(e) => handleChange('shift2_confirmations', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Next Day Confirmations"
            type="number"
            value={form.next_day_confirmations}
            onChange={(e) => handleChange('next_day_confirmations', e.target.value)}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            label="Notes"
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            multiline
            rows={2}
          />
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SendIcon />}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

/* ======================== Hours Data Form ======================== */

function HoursDataForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const getLastFriday = () => {
    const d = new Date();
    const day = d.getDay(); // 0=Sun … 6=Sat
    d.setDate(d.getDate() - ((day + 2) % 7 || 7));
    return d.toISOString().split('T')[0];
  };

  const [form, setForm] = useState({
    week_ending: getLastFriday(),
    shift1_total: '',
    shift1_direct: '',
    shift1_indirect: '',
    shift2_total: '',
    shift2_direct: '',
    shift2_indirect: '',
    employee_count: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await submitHoursData(
        {
          week_ending: form.week_ending,
          shift1_total: parseFloat(form.shift1_total) || 0,
          shift1_direct: parseFloat(form.shift1_direct) || 0,
          shift1_indirect: parseFloat(form.shift1_indirect) || 0,
          shift2_total: parseFloat(form.shift2_total) || 0,
          shift2_direct: parseFloat(form.shift2_direct) || 0,
          shift2_indirect: parseFloat(form.shift2_indirect) || 0,
          employee_count: parseInt(form.employee_count) || 0,
          submitted_by: null,
        },
        [],
      );
      onSuccess();
      setForm((prev) => ({
        ...prev,
        shift1_total: '',
        shift1_direct: '',
        shift1_indirect: '',
        shift2_total: '',
        shift2_direct: '',
        shift2_indirect: '',
        employee_count: '',
      }));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to submit hours data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Week Ending"
            type="date"
            value={form.week_ending}
            onChange={(e) => handleChange('week_ending', e.target.value)}
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Employee Count"
            type="number"
            value={form.employee_count}
            onChange={(e) => handleChange('employee_count', e.target.value)}
            required
          />
        </Grid>

        <Grid size={12}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
            Shift 1 Hours
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Total"
            type="number"
            value={form.shift1_total}
            onChange={(e) => handleChange('shift1_total', e.target.value)}
            slotProps={{ input: { inputProps: { step: '0.5', min: '0' } } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Direct"
            type="number"
            value={form.shift1_direct}
            onChange={(e) => handleChange('shift1_direct', e.target.value)}
            slotProps={{ input: { inputProps: { step: '0.5', min: '0' } } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Indirect"
            type="number"
            value={form.shift1_indirect}
            onChange={(e) => handleChange('shift1_indirect', e.target.value)}
            slotProps={{ input: { inputProps: { step: '0.5', min: '0' } } }}
          />
        </Grid>

        <Grid size={12}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
            Shift 2 Hours
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Total"
            type="number"
            value={form.shift2_total}
            onChange={(e) => handleChange('shift2_total', e.target.value)}
            slotProps={{ input: { inputProps: { step: '0.5', min: '0' } } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Direct"
            type="number"
            value={form.shift2_direct}
            onChange={(e) => handleChange('shift2_direct', e.target.value)}
            slotProps={{ input: { inputProps: { step: '0.5', min: '0' } } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Indirect"
            type="number"
            value={form.shift2_indirect}
            onChange={(e) => handleChange('shift2_indirect', e.target.value)}
            slotProps={{ input: { inputProps: { step: '0.5', min: '0' } } }}
          />
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SendIcon />}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

/* ======================== Import Wizard ======================== */

function ImportWizard({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [targetTable, setTargetTable] = useState<TargetTable>('associates');
  const [uploadType, setUploadType] = useState<UploadType>('append');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<unknown[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [targetFields, setTargetFields] = useState<{ required: string[]; optional: string[]; all: string[] }>({
    required: [],
    optional: [],
    all: [],
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{
    inserted: number;
    updated: number;
    errors: string[];
  } | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const fields = getTargetTableFields(targetTable);
    setTargetFields(fields);
  }, [targetTable]);

  const handleFileLoaded = (fileHeaders: string[], fileRows: unknown[][]) => {
    setHeaders(fileHeaders);
    setRows(fileRows);
    setActiveStep(2);
  };

  const handleMappingChange = (newMapping: ColumnMapping) => {
    setMapping(newMapping);
  };

  const handleValidateAndPreview = () => {
    const result = validateMapping(mapping, targetTable);
    if (!result.valid) {
      setValidationErrors(result.errors);
      return;
    }
    setValidationErrors([]);
    setActiveStep(3);
  };

  const getMappedPreviewRows = (): Record<string, unknown>[] => {
    return rows.slice(0, 20).map((row) => {
      const mapped: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        const targetCol = mapping[header];
        if (targetCol) {
          mapped[targetCol] = (row as unknown[])[idx];
        }
      });
      return mapped;
    });
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      const mappedRows: Record<string, unknown>[] = rows.map((row) => {
        const mapped: Record<string, unknown> = {};
        headers.forEach((header, idx) => {
          const targetCol = mapping[header];
          if (targetCol) {
            mapped[targetCol] = (row as unknown[])[idx];
          }
        });
        return mapped;
      });

      const result = await importData(mappedRows, mapping, targetTable, uploadType);
      setImportResult(result);
      setActiveStep(4);
      if (result.errors.length === 0) {
        onSuccess();
      } else {
        onError(`Import completed with ${result.errors.length} error(s)`);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setValidationErrors([]);
    setImportResult(null);
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {IMPORT_STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 0: Select Target */}
      {activeStep === 0 && (
        <Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Target Table"
                value={targetTable}
                onChange={(e) => setTargetTable(e.target.value as TargetTable)}
              >
                {TARGET_TABLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Upload Type"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as UploadType)}
              >
                {UPLOAD_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" onClick={() => setActiveStep(1)}>
              Next
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 1: Upload File */}
      {activeStep === 1 && (
        <Box>
          <FileUploader onFileLoaded={handleFileLoaded} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Typography variant="body2" color="text.secondary">
              Upload a file to continue
            </Typography>
          </Box>
        </Box>
      )}

      {/* Step 2: Map Columns */}
      {activeStep === 2 && (
        <Box>
          <ColumnMapper
            headers={headers}
            targetFields={targetFields}
            mapping={mapping}
            onMappingChange={handleMappingChange}
          />

          {validationErrors.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Mapping validation errors:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button onClick={() => setActiveStep(1)}>Back</Button>
            <Button variant="contained" onClick={handleValidateAndPreview}>
              Preview
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 3: Preview */}
      {activeStep === 3 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Preview ({Math.min(rows.length, 20)} of {rows.length} rows)
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {targetFields.all
                    .filter((f) => Object.values(mapping).includes(f))
                    .map((field) => (
                      <TableCell key={field}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {field}
                          {targetFields.required.includes(field) && (
                            <Typography component="span" color="error" variant="caption">
                              *
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {getMappedPreviewRows().map((row, idx) => {
                  const missingRequired = targetFields.required.some(
                    (f) => row[f] === undefined || row[f] === null || row[f] === ''
                  );
                  return (
                    <TableRow
                      key={idx}
                      sx={{
                        bgcolor: missingRequired ? 'error.light' : undefined,
                        '& td': { opacity: missingRequired ? 0.7 : 1 },
                      }}
                    >
                      {targetFields.all
                        .filter((f) => Object.values(mapping).includes(f))
                        .map((field) => (
                          <TableCell key={field}>
                            {row[field] != null ? String(row[field]) : ''}
                          </TableCell>
                        ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button onClick={() => setActiveStep(2)}>Back</Button>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? 'Importing...' : `Import ${rows.length} Rows`}
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 4: Results */}
      {activeStep === 4 && importResult && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Import Complete
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 3 }}>
            <Box>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                {importResult.inserted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inserted
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                {importResult.updated}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Updated
              </Typography>
            </Box>
          </Box>

          {importResult.errors.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                Errors during import:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {importResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Button variant="contained" onClick={handleReset}>
            Start New Import
          </Button>
        </Box>
      )}
    </Box>
  );
}

/* ======================== Upload History Tab ======================== */

function UploadHistoryTab() {
  const [history, setHistory] = useState<UploadHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUploadHistory();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (history.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        No upload history yet
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Target Table</TableCell>
            <TableCell>File</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Records</TableCell>
            <TableCell>Uploaded By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.map((record) => (
            <TableRow key={record.id} hover>
              <TableCell>{formatDate(record.uploaded_at, 'MM/dd/yyyy HH:mm')}</TableCell>
              <TableCell>
                <Chip label={record.target_table} size="small" variant="outlined" />
              </TableCell>
              <TableCell>{record.file_name ?? '-'}</TableCell>
              <TableCell>{record.upload_type ?? '-'}</TableCell>
              <TableCell>{record.record_count}</TableCell>
              <TableCell>{record.uploaded_by ?? '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
