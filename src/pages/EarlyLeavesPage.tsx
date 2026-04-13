import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Autocomplete,
  InputAdornment,
  IconButton,
  Collapse,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WarningIcon from '@mui/icons-material/Warning';
import BlockIcon from '@mui/icons-material/Block';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {
  SHIFTS,
  STATUS_COLORS,
} from '../lib/constants';
import type { Shift } from '../lib/constants';
import {
  getEarlyLeaves,
  createEarlyLeave,
  getCorrectiveActions,
  getEarlyLeaveStats,
} from '../services/earlyLeaveService';
import { searchAssociates } from '../services/associateService';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate } from '../utils/formatters';
import type { EarlyLeaveWithAssociate, EarlyLeaveStats, CorrectiveAction } from '../types/earlyLeave';
import type { Associate } from '../types/associate';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '10px',
            bgcolor: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Box sx={{ color, display: 'flex' }}>{icon}</Box>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function EarlyLeavesPage() {
  const { showSuccess, showError } = useNotification();

  const [leaves, setLeaves] = useState<EarlyLeaveWithAssociate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<EarlyLeaveStats | null>(null);
  const [weekTotal, setWeekTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState<Shift | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [rowActions, setRowActions] = useState<Record<string, CorrectiveAction[]>>({});
  const [loadingActions, setLoadingActions] = useState<string | null>(null);

  const loadLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getEarlyLeaves({
        page: page + 1,
        pageSize: rowsPerPage,
        shift: shiftFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: search.trim() || undefined,
      });
      setLeaves(result.data);
      setTotalCount(result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load early leaves');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, shiftFilter, startDate, endDate, search]);

  const loadStats = useCallback(async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [weekStats, monthStats] = await Promise.all([
        getEarlyLeaveStats(
          startOfWeek.toISOString().split('T')[0],
          now.toISOString().split('T')[0],
        ),
        getEarlyLeaveStats(
          startOfMonth.toISOString().split('T')[0],
          now.toISOString().split('T')[0],
        ),
      ]);

      setWeekTotal(weekStats.total_this_week);
      setStats(monthStats);
    } catch {
      // Stats are non-critical
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRowExpand = async (leaveEid: string, leaveId: string) => {
    if (expandedRow === leaveId) {
      setExpandedRow(null);
      return;
    }

    setExpandedRow(leaveId);

    if (!rowActions[leaveEid]) {
      try {
        setLoadingActions(leaveId);
        const actions = await getCorrectiveActions(leaveEid);
        setRowActions((prev) => ({ ...prev, [leaveEid]: actions }));
      } catch {
        // Silently fail for detail expansion
      } finally {
        setLoadingActions(null);
      }
    }
  };

  const dnrCount = stats?.dnr_count ?? 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Early Leaves
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Record Early Leave
        </Button>
      </Box>

      {/* Stats cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="This Week"
            value={weekTotal}
            icon={<EventBusyIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="This Month"
            value={stats?.total_this_month ?? 0}
            icon={<CalendarMonthIcon />}
            color="#0288d1"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="DNR Eligible"
            value={dnrCount}
            icon={<BlockIcon />}
            color="#d32f2f"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Warnings"
            value={stats?.warning_count ?? 0}
            icon={<WarningIcon />}
            color="#5C2D91"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by EID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearch('');
                        setPage(0);
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            fullWidth
            label="Shift"
            value={shiftFilter}
            onChange={(e) => {
              setShiftFilter(e.target.value as Shift | '');
              setPage(0);
            }}
          >
            <MenuItem value="">All Shifts</MenuItem>
            {SHIFTS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(0);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(0);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper variant="outlined">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : leaves.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No early leaves found
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={40} />
                    <TableCell>Date</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>EID</TableCell>
                    <TableCell>Shift</TableCell>
                    <TableCell>Leave Time</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Hours Worked</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaves.map((leave) => (
                    <>
                      <TableRow
                        key={leave.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleRowExpand(leave.associate_eid, leave.id)}
                      >
                        <TableCell>
                          <IconButton size="small">
                            {expandedRow === leave.id ? (
                              <ExpandLessIcon fontSize="small" />
                            ) : (
                              <ExpandMoreIcon fontSize="small" />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell>{formatDate(leave.date)}</TableCell>
                        <TableCell>
                          {leave.associate
                            ? `${leave.associate.first_name} ${leave.associate.last_name}`
                            : leave.associate_eid}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{leave.associate_eid}</TableCell>
                        <TableCell>{leave.shift}</TableCell>
                        <TableCell>{leave.leave_time}</TableCell>
                        <TableCell>{leave.reason ?? '-'}</TableCell>
                        <TableCell>
                          {leave.hours_worked != null ? leave.hours_worked.toFixed(1) : '-'}
                        </TableCell>
                      </TableRow>
                      <TableRow key={`${leave.id}-detail`}>
                        <TableCell
                          colSpan={8}
                          sx={{
                            py: 0,
                            borderBottom: expandedRow === leave.id ? undefined : 'none',
                          }}
                        >
                          <Collapse in={expandedRow === leave.id} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2, px: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Corrective Action History for {leave.associate_eid}
                              </Typography>
                              {loadingActions === leave.id ? (
                                <CircularProgress size={20} />
                              ) : rowActions[leave.associate_eid] &&
                                rowActions[leave.associate_eid].length > 0 ? (
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Date</TableCell>
                                      <TableCell>Action</TableCell>
                                      <TableCell>Reason</TableCell>
                                      <TableCell>Issued By</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {rowActions[leave.associate_eid].map((action) => (
                                      <TableRow key={action.id}>
                                        <TableCell>{formatDate(action.date)}</TableCell>
                                        <TableCell>
                                          <Chip
                                            label={action.action}
                                            size="small"
                                            color={
                                              STATUS_COLORS[action.action] ?? 'default'
                                            }
                                          />
                                        </TableCell>
                                        <TableCell>{action.offense_category ?? '-'}</TableCell>
                                        <TableCell>{action.created_by ?? '-'}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No corrective actions on record
                                </Typography>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        )}
      </Paper>

      {/* Create Early Leave Dialog */}
      <CreateEarlyLeaveDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={() => {
          setCreateDialogOpen(false);
          showSuccess('Early leave recorded');
          loadLeaves();
          loadStats();
        }}
        onError={(msg) => showError(msg)}
      />
    </Box>
  );
}

/* ======================== Create Early Leave Dialog ======================== */

function CreateEarlyLeaveDialog({
  open,
  onClose,
  onCreated,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Associate[]>([]);
  const [selectedAssociate, setSelectedAssociate] = useState<Associate | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: '1st' as Shift,
    time_left: '',
    hours_worked: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await searchAssociates(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedAssociate) {
      onError('Please select an associate');
      return;
    }

    try {
      setSubmitting(true);
      await createEarlyLeave({
        associate_eid: selectedAssociate.eid,
        date: form.date,
        shift: form.shift,
        leave_time: form.time_left || null,
        scheduled_end: null,
        hours_worked: form.hours_worked ? parseFloat(form.hours_worked) : null,
        reason: form.reason || null,
        corrective_action: 'None',
        notes: form.notes || null,
        created_by: null,
      });
      onCreated();
      setSelectedAssociate(null);
      setSearchQuery('');
      setForm({
        date: new Date().toISOString().split('T')[0],
        shift: '1st',
        time_left: '',
        hours_worked: '',
        reason: '',
        notes: '',
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to record early leave');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record Early Leave</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Autocomplete
            options={searchResults}
            getOptionLabel={(option) =>
              `${option.first_name} ${option.last_name} (${option.eid})`
            }
            value={selectedAssociate}
            onChange={(_, value) => setSelectedAssociate(value)}
            inputValue={searchQuery}
            onInputChange={(_, value) => setSearchQuery(value)}
            loading={searching}
            isOptionEqualToValue={(option, value) => option.eid === value.eid}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Associate"
                placeholder="Search by name or EID..."
                required
                slotProps={{
                  input: {
                    ...params.slotProps?.input,
                    endAdornment: (
                      <>
                        {searching && <CircularProgress color="inherit" size={20} />}
                        {(params.slotProps?.input as Record<string, unknown>)?.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />

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
                label="Shift"
                value={form.shift}
                onChange={(e) => handleChange('shift', e.target.value)}
                required
              >
                {SHIFTS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Leave Time"
                type="time"
                value={form.time_left}
                onChange={(e) => handleChange('time_left', e.target.value)}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Hours Worked"
                type="number"
                value={form.hours_worked}
                onChange={(e) => handleChange('hours_worked', e.target.value)}
                slotProps={{
                  input: { inputProps: { step: '0.5', min: '0' } },
                }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Reason"
            value={form.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
          />

          <TextField
            fullWidth
            label="Notes"
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            multiline
            rows={2}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedAssociate || !form.date || !form.time_left || submitting}
        >
          {submitting ? 'Saving...' : 'Record'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
