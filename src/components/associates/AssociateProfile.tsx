import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { getAssociateProfile, updateAssociate } from '../../services/associateService';
import { createBadge } from '../../services/badgeService';
import { useNotification } from '../../contexts/NotificationContext';
import { formatDate, formatPhone } from '../../utils/formatters';
import { STATUS_COLORS } from '../../lib/constants';
import AssociateForm from './AssociateForm';
import type { Associate, AssociateFormData } from '../../types/associate';
import type { Badge } from '../../types/badge';
import type { EarlyLeave, CorrectiveAction } from '../../types/earlyLeave';

interface ProfileData {
  associate: Associate;
  badge: Badge | null;
  early_leaves: EarlyLeave[];
  corrective_actions: CorrectiveAction[];
  hours_summary: {
    total_hours: number;
    regular_hours: number;
    overtime_hours: number;
  } | null;
}

export default function AssociateProfile() {
  const { eid } = useParams<{ eid: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [creatingBadge, setCreatingBadge] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!eid) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getAssociateProfile(eid);
      setProfile(data as unknown as ProfileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [eid]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleEditSubmit = async (data: AssociateFormData) => {
    if (!eid) return;
    try {
      await updateAssociate(eid, data);
      showSuccess('Associate updated successfully');
      setEditDialogOpen(false);
      loadProfile();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update associate');
    }
  };

  const handleCreateBadge = async () => {
    if (!eid) return;
    try {
      setCreatingBadge(true);
      await createBadge(eid);
      showSuccess('Badge created successfully');
      loadProfile();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create badge');
    } finally {
      setCreatingBadge(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/associates')} sx={{ mb: 2 }}>
          Back to Associates
        </Button>
        <Alert severity="error">{error ?? 'Profile not found'}</Alert>
      </Box>
    );
  }

  const { associate, badge, early_leaves, corrective_actions, hours_summary } = profile;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/associates')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {associate.first_name} {associate.last_name}
            </Typography>
            <Chip
              label={associate.status}
              color={STATUS_COLORS[associate.status] ?? 'default'}
              size="small"
            />
            <Chip
              label={associate.pipeline_status}
              color={STATUS_COLORS[associate.pipeline_status] ?? 'default'}
              size="small"
              variant="outlined"
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            EID: {associate.eid}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!badge && (
            <Button
              variant="outlined"
              startIcon={<BadgeIcon />}
              onClick={handleCreateBadge}
              disabled={creatingBadge}
            >
              {creatingBadge ? 'Creating...' : 'Create Badge'}
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditDialogOpen(true)}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Info Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Contact Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Info
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {associate.email ?? 'No email on file'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {formatPhone(associate.phone) || 'No phone on file'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Employment Details */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Employment Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    Shift: {associate.shift ?? 'Unassigned'}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  Branch: {associate.branch ?? 'Unassigned'}
                </Typography>
                <Typography variant="body2">
                  Recruiter: {associate.recruiter ?? 'N/A'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarTodayIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    Process Date: {formatDate(associate.process_date) || 'N/A'}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  Planned Start: {formatDate(associate.planned_start_date) || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  Actual Start: {formatDate(associate.actual_start_date) || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  I-9 Cleared:{' '}
                  <Chip
                    label={associate.i9_cleared ? 'Yes' : 'No'}
                    size="small"
                    color={associate.i9_cleared ? 'success' : 'warning'}
                  />
                </Typography>
                <Typography variant="body2">
                  Background Check:{' '}
                  {associate.background_check_status ? (
                    <Chip
                      label={associate.background_check_status}
                      size="small"
                      color={STATUS_COLORS[associate.background_check_status] ?? 'default'}
                    />
                  ) : (
                    'N/A'
                  )}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Badge Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Badge Info
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {badge ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="body2">
                    Badge ID: {badge.id.slice(0, 8)}
                  </Typography>
                  <Typography variant="body2">
                    Status:{' '}
                    <Chip
                      label={badge.status}
                      size="small"
                      color={STATUS_COLORS[badge.status] ?? 'default'}
                    />
                  </Typography>
                  <Typography variant="body2">
                    Issued: {formatDate(badge.issued_at) || 'Pending'}
                  </Typography>
                  <Typography variant="body2">
                    Created: {formatDate(badge.created_at) || 'N/A'}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No badge has been created for this associate.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Notes */}
      {associate.notes && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notes
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {associate.notes}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label={`Early Leaves (${early_leaves?.length ?? 0})`} />
          <Tab label={`Corrective Actions (${corrective_actions?.length ?? 0})`} />
          <Tab label="Hours Summary" />
        </Tabs>

        <CardContent>
          {activeTab === 0 && (
            <>
              {(!early_leaves || early_leaves.length === 0) ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No early leave records
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Shift</TableCell>
                        <TableCell>Time Left</TableCell>
                        <TableCell>Hours Worked</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {early_leaves.map((leave: EarlyLeave) => (
                        <TableRow key={leave.id} hover>
                          <TableCell>{formatDate(leave.date)}</TableCell>
                          <TableCell>{leave.shift}</TableCell>
                          <TableCell>{leave.leave_time}</TableCell>
                          <TableCell>
                            {leave.hours_worked != null ? leave.hours_worked.toFixed(1) : '-'}
                          </TableCell>
                          <TableCell>{leave.reason ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {activeTab === 1 && (
            <>
              {(!corrective_actions || corrective_actions.length === 0) ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No corrective action records
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Action Type</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Issued By</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {corrective_actions.map((action: CorrectiveAction) => (
                        <TableRow key={action.id} hover>
                          <TableCell>{formatDate(action.date)}</TableCell>
                          <TableCell>
                            <Chip
                              label={action.action}
                              size="small"
                              color={STATUS_COLORS[action.action] ?? 'default'}
                            />
                          </TableCell>
                          <TableCell>{action.offense_category ?? '-'}</TableCell>
                          <TableCell>{action.created_by ?? '-'}</TableCell>
                          <TableCell>{action.notes ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {activeTab === 2 && (
            <>
              {hours_summary ? (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Hours
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {hours_summary.total_hours.toFixed(1)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Regular Hours
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {hours_summary.regular_hours.toFixed(1)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Overtime Hours
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                          {hours_summary.overtime_hours.toFixed(1)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No hours data available
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Associate</DialogTitle>
        <DialogContent>
          <AssociateForm
            initialData={associate as AssociateFormData}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
