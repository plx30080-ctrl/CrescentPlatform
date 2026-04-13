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
import { submitOnPremiseData, submitBranchMetrics } from '../services/metricsService';
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
    branch: '',
    headcount: '',
    target_headcount: '',
    absent_count: '',
    ncns_count: '',
    early_leave_count: '',
    new_start_count: '',
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
        branch: form.branch,
        headcount: parseInt(form.headcount) || 0,
        target_headcount: parseInt(form.target_headcount) || 0,
        absent_count: parseInt(form.absent_count) || 0,
        ncns_count: parseInt(form.ncns_count) || 0,
        early_leave_count: parseInt(form.early_leave_count) || 0,
        new_start_count: parseInt(form.new_start_count) || 0,
        notes: form.notes || undefined,
      });
      onSuccess();
      setForm({
        date: new Date().toISOString().split('T')[0],
        shift: '1st',
        branch: form.branch,
        headcount: '',
        target_headcount: '',
        absent_count: '',
        ncns_count: '',
        early_leave_count: '',
        new_start_count: '',
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
            label="Branch"
            value={form.branch}
            onChange={(e) => handleChange('branch', e.target.value)}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Headcount (Working)"
            type="number"
            value={form.headcount}
            onChange={(e) => handleChange('headcount', e.target.value)}
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Target Headcount"
            type="number"
            value={form.target_headcount}
            onChange={(e) => handleChange('target_headcount', e.target.value)}
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Absent Count"
            type="number"
            value={form.absent_count}
            onChange={(e) => handleChange('absent_count', e.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="NCNS Count"
            type="number"
            value={form.ncns_count}
            onChange={(e) => handleChange('ncns_count', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Early Leave Count"
            type="number"
            value={form.early_leave_count}
            onChange={(e) => handleChange('early_leave_count', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="New Start Count"
            type="number"
            value={form.new_start_count}
            onChange={(e) => handleChange('new_start_count', e.target.value)}
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
    revenue: '',
    gp_margin: '',
    bill_rate: '',
    pay_rate: '',
    spread: '',
    fill_rate: '',
    turnover_rate: '',
    avg_tenure_days: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const parseNum = (v: string): number | null => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await submitBranchMetrics({
        date: form.date,
        branch: form.branch,
        revenue: parseNum(form.revenue),
        gp_margin: parseNum(form.gp_margin),
        bill_rate: parseNum(form.bill_rate),
        pay_rate: parseNum(form.pay_rate),
        spread: parseNum(form.spread),
        fill_rate: parseNum(form.fill_rate),
        turnover_rate: parseNum(form.turnover_rate),
        avg_tenure_days: parseNum(form.avg_tenure_days),
        notes: form.notes || null,
        submitted_by: null,
      });
      onSuccess();
      setForm({
        date: new Date().toISOString().split('T')[0],
        branch: form.branch,
        revenue: '',
        gp_margin: '',
        bill_rate: '',
        pay_rate: '',
        spread: '',
        fill_rate: '',
        turnover_rate: '',
        avg_tenure_days: '',
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
            label="Revenue"
            type="number"
            value={form.revenue}
            onChange={(e) => handleChange('revenue', e.target.value)}
            slotProps={{ input: { inputProps: { step: '0.01' } } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="GP Margin (%)"
            type="number"
            value={form.gp_margin}
            onChange={(e) => handleChange('gp_margin', e.target.value)}
            slotProps={{ input: { inputProps: { step: '0.01' } } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Fill Rate (%)"
            type="number"
            value={form.fill_rate}
            onChange={(e) => handleChange('fill_rate', e.target.value)}
            slotProps={{ input: { inputProps: { step: '0.1' } } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Bill Rate"
            type="number"
            value={form.bill_rate}
            onChange={(e) => handleChange('bill_rate', e.target.value)}
            slotProps={{ input: { inputProps: { step: '0.01' } } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Pay Rate"
            type="number"
            value={form.pay_rate}
            onChange={(e) => handleChange('pay_rate', e.target.value)}
            slotProps={{ input: { inputProps: { step: '0.01' } } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Spread"
            type="number"
            value={form.spread}
            onChange={(e) => handleChange('spread', e.target.value)}
            slotProps={{ input: { inputProps: { step: '0.01' } } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Turnover Rate (%)"
            type="number"
            value={form.turnover_rate}
            onChange={(e) => handleChange('turnover_rate', e.target.value)}
            slotProps={{ input: { inputProps: { step: '0.1' } } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Avg Tenure (days)"
            type="number"
            value={form.avg_tenure_days}
            onChange={(e) => handleChange('avg_tenure_days', e.target.value)}
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
