import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Grid from '@mui/material/Grid';
import { SHIFTS } from '../lib/constants';
import { getEarlyLeaves } from '../services/earlyLeaveService';
import { formatDate } from '../utils/formatters';
import type { Shift } from '../lib/constants';
import type { EarlyLeaveWithAssociate } from '../types/earlyLeave';

export default function EarlyLeavesPage() {
  const [leaves, setLeaves] = useState<EarlyLeaveWithAssociate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shiftFilter, setShiftFilter] = useState<Shift | ''>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const loadLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getEarlyLeaves({
        page: page + 1,
        pageSize: rowsPerPage,
        shift: shiftFilter || undefined,
      });
      setLeaves(result.data);
      setTotalCount(result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load early leaves');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, shiftFilter]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Early Leaves
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4, md: 3 }}>
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
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : leaves.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">No early leaves found</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>EID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Shift</TableCell>
                    <TableCell>Time Left</TableCell>
                    <TableCell>Hours Worked</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaves.map((leave) => (
                    <TableRow key={leave.id} hover>
                      <TableCell>{formatDate(leave.date)}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{leave.eid}</TableCell>
                      <TableCell>
                        {leave.associate
                          ? `${leave.associate.first_name} ${leave.associate.last_name}`
                          : leave.eid}
                      </TableCell>
                      <TableCell>{leave.shift}</TableCell>
                      <TableCell>{leave.time_left}</TableCell>
                      <TableCell>{leave.hours_worked != null ? leave.hours_worked : '-'}</TableCell>
                      <TableCell>{leave.reason ?? '-'}</TableCell>
                    </TableRow>
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
    </Box>
  );
}
