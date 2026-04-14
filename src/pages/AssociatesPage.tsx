import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import {
  ASSOCIATE_STATUS,
  PIPELINE_STATUS,
  SHIFTS,
  STATUS_COLORS,
} from '../lib/constants';
import { getAssociates, createAssociate } from '../services/associateService';
import { exportToCSV } from '../utils/csv';
import { formatDate } from '../utils/formatters';
import { useNotification } from '../contexts/NotificationContext';
import AssociateForm from '../components/associates/AssociateForm';
import type { Associate, AssociateFilters, AssociateFormData } from '../types/associate';
import type { AssociateStatus, PipelineStatus, Shift } from '../lib/constants';

export default function AssociatesPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [associates, setAssociates] = useState<Associate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssociateStatus | ''>('');
  const [pipelineFilter, setPipelineFilter] = useState<PipelineStatus | ''>('');
  const [shiftFilter, setShiftFilter] = useState<Shift | ''>('');
  const [branchFilter, setBranchFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadAssociates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: AssociateFilters = {
        page: page + 1,
        pageSize: rowsPerPage,
      };

      if (search.trim()) filters.search = search.trim();
      if (statusFilter) filters.status = statusFilter;
      if (pipelineFilter) filters.pipeline_status = pipelineFilter;
      if (shiftFilter) filters.shift = shiftFilter;
      if (branchFilter.trim()) filters.branch = branchFilter.trim();

      const result = await getAssociates(filters);
      setAssociates(result.data);
      setTotalCount(result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load associates');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, pipelineFilter, shiftFilter, branchFilter]);

  useEffect(() => {
    loadAssociates();
  }, [loadAssociates]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const result = await getAssociates({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        pipeline_status: pipelineFilter || undefined,
        shift: shiftFilter || undefined,
        branch: branchFilter.trim() || undefined,
        page: 1,
        pageSize: 10000,
      });
      const rows = result.data.map((a) => ({
        EID: a.eid,
        'First Name': a.first_name,
        'Last Name': a.last_name,
        Status: a.status,
        Pipeline: a.pipeline_status,
        Shift: a.shift ?? '',
        Branch: a.branch ?? '',
        Recruiter: a.recruiter ?? '',
        'Process Date': a.process_date ?? '',
        'Planned Start': a.planned_start_date ?? '',
        'Actual Start': a.actual_start_date ?? '',
        'I-9 Cleared': a.i9_cleared ? 'Yes' : 'No',
        'Background Check': a.background_check_status ?? '',
        Email: a.email ?? '',
        Phone: a.phone ?? '',
      }));
      exportToCSV(rows, `associates_${new Date().toISOString().split('T')[0]}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadAssociates();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(0);
  };

  const handleRowClick = (eid: string) => {
    navigate(`/associates/${eid}`);
  };

  const handleAddSubmit = async (data: AssociateFormData) => {
    try {
      await createAssociate(data);
      showSuccess('Associate created successfully');
      setAddDialogOpen(false);
      loadAssociates();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create associate');
    }
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Associates
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Associate
          </Button>
        </Box>
      </Box>

      {/* Search bar */}
      <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name or EID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
      </Box>

      {/* Filter row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            fullWidth
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as AssociateStatus | '');
              setPage(0);
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {ASSOCIATE_STATUS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            fullWidth
            label="Pipeline Status"
            value={pipelineFilter}
            onChange={(e) => {
              setPipelineFilter(e.target.value as PipelineStatus | '');
              setPage(0);
            }}
          >
            <MenuItem value="">All Pipeline</MenuItem>
            {PIPELINE_STATUS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
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
            label="Branch"
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setPage(0);
            }}
            placeholder="Filter by branch"
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
        ) : associates.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No associates found
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>EID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Pipeline</TableCell>
                    <TableCell>Shift</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell>Recruiter</TableCell>
                    <TableCell>Start Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {associates.map((assoc) => (
                    <TableRow
                      key={assoc.eid}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleRowClick(assoc.eid)}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{assoc.eid}</TableCell>
                      <TableCell>
                        {assoc.first_name} {assoc.last_name}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={assoc.status}
                          size="small"
                          color={STATUS_COLORS[assoc.status] ?? 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={assoc.pipeline_status}
                          size="small"
                          color={STATUS_COLORS[assoc.pipeline_status] ?? 'default'}
                        />
                      </TableCell>
                      <TableCell>{assoc.shift ?? '-'}</TableCell>
                      <TableCell>{assoc.branch ?? '-'}</TableCell>
                      <TableCell>{assoc.recruiter ?? '-'}</TableCell>
                      <TableCell>
                        {formatDate(assoc.planned_start_date ?? assoc.actual_start_date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Paper>

      {/* Add Associate dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Associate</DialogTitle>
        <DialogContent>
          <AssociateForm
            onSubmit={handleAddSubmit}
            onCancel={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
