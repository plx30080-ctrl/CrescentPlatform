import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import {
  getBadges,
  createBadge,
  updateBadge,
  getPrintQueue,
  addToPrintQueue,
  updatePrintJob,
} from '../services/badgeService';
import { searchAssociates } from '../services/associateService';
import { printBadge } from '../services/printService';
import { uploadBadgePhoto } from '../services/storageService';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate } from '../utils/formatters';
import { STATUS_COLORS } from '../lib/constants';
import BadgePreview from '../components/badges/BadgePreview';
import type { BadgeWithAssociate, BadgePrintJobWithDetails } from '../types/badge';
import type { Associate } from '../types/associate';

export default function BadgeManagementPage() {
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState(0);
  const [badges, setBadges] = useState<BadgeWithAssociate[]>([]);
  const [printQueue, setPrintQueue] = useState<BadgePrintJobWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithAssociate | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Associate[]>([]);
  const [selectedAssociate, setSelectedAssociate] = useState<Associate | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const updatePhotoInputRef = useRef<HTMLInputElement>(null);

  const badgePreviewRef = useRef<HTMLDivElement>(null);

  const loadBadges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getBadges();
      setBadges(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load badges');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPrintQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPrintQueue();
      setPrintQueue(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load print queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 0) {
      loadBadges();
    } else {
      loadPrintQueue();
    }
  }, [activeTab, loadBadges, loadPrintQueue]);

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

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPhotoFile(file);
  };

  const handleCreateBadge = async () => {
    if (!selectedAssociate) return;

    try {
      setCreating(true);
      let photoUrl: string | null = null;
      if (photoFile) {
        photoUrl = await uploadBadgePhoto(photoFile, selectedAssociate.eid);
      }
      await createBadge(selectedAssociate.eid, photoUrl, true);
      showSuccess(`Badge created for ${selectedAssociate.first_name} ${selectedAssociate.last_name}`);
      setCreateDialogOpen(false);
      setSelectedAssociate(null);
      setSearchQuery('');
      setPhotoFile(null);
      setPhotoPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      loadBadges();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create badge');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdatePhoto = async (file: File) => {
    if (!selectedBadge) return;
    try {
      setUploadingPhoto(true);
      const photoUrl = await uploadBadgePhoto(file, selectedBadge.associate_eid);
      await updateBadge(selectedBadge.id, { photo_url: photoUrl });
      showSuccess('Photo updated');
      setSelectedBadge((prev) => prev ? { ...prev, photo_url: photoUrl } : prev);
      loadBadges();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePrintBadge = (badge: BadgeWithAssociate) => {
    setSelectedBadge(badge);
    setTimeout(() => {
      if (badgePreviewRef.current) {
        printBadge(badgePreviewRef.current);
      }
    }, 150);
  };

  const handleAddToQueue = async (badge: BadgeWithAssociate) => {
    try {
      await addToPrintQueue(badge.id);
      showSuccess('Badge added to print queue');
      if (activeTab === 1) loadPrintQueue();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add to queue');
    }
  };

  const handleUpdatePrintJob = async (jobId: string, status: 'Completed' | 'Failed') => {
    try {
      await updatePrintJob(jobId, status);
      showSuccess(`Print job marked as ${status.toLowerCase()}`);
      loadPrintQueue();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update print job');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Badge Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Badge
        </Button>
      </Box>

      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Badges" />
          <Tab label="Print Queue" />
        </Tabs>

        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : activeTab === 0 ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: selectedBadge ? 8 : 12 }}>
                {badges.length === 0 ? (
                  <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No badges found
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Badge #</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>EID</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Created</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {badges.map((b) => (
                          <TableRow
                            key={b.id}
                            hover
                            selected={selectedBadge?.id === b.id}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => setSelectedBadge(b)}
                          >
                            <TableCell sx={{ fontWeight: 600 }}>
                              {b.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>
                              {b.associate
                                ? `${b.associate.first_name} ${b.associate.last_name}`
                                : b.associate_eid}
                            </TableCell>
                            <TableCell>{b.associate_eid}</TableCell>
                            <TableCell>
                              <Chip
                                label={b.status}
                                size="small"
                                color={STATUS_COLORS[b.status] ?? 'default'}
                              />
                            </TableCell>
                            <TableCell>{formatDate(b.created_at)}</TableCell>
                            <TableCell align="right">
                              <Tooltip title="Print Badge">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrintBadge(b);
                                  }}
                                >
                                  <PrintIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Add to Print Queue">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToQueue(b);
                                  }}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>

              {selectedBadge && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Badge Preview
                    </Typography>
                    <Box
                      ref={badgePreviewRef}
                      sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}
                    >
                      <BadgePreview
                        associate={{
                          first_name: selectedBadge.associate?.first_name ?? '',
                          last_name: selectedBadge.associate?.last_name ?? '',
                          eid: selectedBadge.associate_eid,
                          shift: selectedBadge.associate?.shift,
                        }}
                        photoUrl={selectedBadge.photo_url}
                        badgeNumber={selectedBadge.id.slice(0, 8)}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        size="small"
                        onClick={() => handlePrintBadge(selectedBadge)}
                      >
                        Print
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        size="small"
                        onClick={() => handleAddToQueue(selectedBadge)}
                      >
                        Queue
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={uploadingPhoto}
                        onClick={() => updatePhotoInputRef.current?.click()}
                      >
                        {uploadingPhoto ? 'Uploading...' : 'Update Photo'}
                      </Button>
                      <input
                        ref={updatePhotoInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpdatePhoto(file);
                          e.target.value = '';
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          ) : (
            /* Print Queue tab */
            printQueue.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Print queue is empty
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Job ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>EID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Queued</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {printQueue.map((job) => (
                      <TableRow key={job.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {job.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          {job.badge?.associate
                            ? `${job.badge.associate.first_name} ${job.badge.associate.last_name}`
                            : job.badge_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>{job.badge?.associate_eid ?? '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={job.status}
                            size="small"
                            color={STATUS_COLORS[job.status] ?? 'default'}
                          />
                        </TableCell>
                        <TableCell>{job.priority}</TableCell>
                        <TableCell>{formatDate(job.queued_at, 'MM/dd/yyyy HH:mm')}</TableCell>
                        <TableCell align="right">
                          {(job.status === 'Queued' || job.status === 'Printing') && (
                            <>
                              <Tooltip title="Mark Completed">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleUpdatePrintJob(job.id, 'Completed')}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Mark Failed">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleUpdatePrintJob(job.id, 'Failed')}
                                >
                                  <ErrorIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </CardContent>
      </Card>

      {/* Create Badge Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Badge</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Search for an associate to create a badge for:
          </Typography>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoFileChange}
          />
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
                label="Search Associate"
                placeholder="Type name or EID..."
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
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <li key={key} {...rest}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {option.first_name} {option.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      EID: {option.eid} | {option.shift ?? 'No shift'} | {option.branch ?? 'No branch'}
                    </Typography>
                  </Box>
                </li>
              );
            }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => photoInputRef.current?.click()}
            sx={{ color: 'text.secondary' }}
          >
            {photoPreview ? 'Change Photo' : 'Add Photo (optional)'}
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {photoPreview && (
              <Box
                component="img"
                src={photoPreview}
                alt="preview"
                sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover' }}
              />
            )}
            <Button onClick={() => { setCreateDialogOpen(false); setPhotoFile(null); setPhotoPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; }); }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateBadge}
              disabled={!selectedAssociate || creating}
            >
              {creating ? 'Creating...' : 'Create Badge'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
