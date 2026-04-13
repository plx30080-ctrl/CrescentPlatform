import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getAssociate } from '../services/associateService';
import { STATUS_COLORS } from '../lib/constants';
import { formatDate } from '../utils/formatters';
import type { Associate } from '../types/associate';

export default function AssociateProfilePage() {
  const { eid } = useParams<{ eid: string }>();
  const navigate = useNavigate();
  const [associate, setAssociate] = useState<Associate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eid) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAssociate(eid);
        if (!cancelled) setAssociate(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load associate');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [eid]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/associates')} sx={{ mb: 2 }}>
          Back to Associates
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!associate) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/associates')} sx={{ mb: 2 }}>
          Back to Associates
        </Button>
        <Alert severity="warning">Associate not found.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/associates')} sx={{ mb: 2 }}>
        Back to Associates
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {associate.first_name} {associate.last_name}
        </Typography>
        <Chip
          label={associate.status}
          color={STATUS_COLORS[associate.status] ?? 'default'}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
              <InfoRow label="EID" value={associate.eid} />
              <InfoRow label="Email" value={associate.email ?? '-'} />
              <InfoRow label="Phone" value={associate.phone ?? '-'} />
              <InfoRow label="Branch" value={associate.branch ?? '-'} />
              <InfoRow label="Shift" value={associate.shift ?? '-'} />
              <InfoRow label="Recruiter" value={associate.recruiter ?? '-'} />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pipeline & Dates</Typography>
              <InfoRow label="Pipeline Status" value={associate.pipeline_status} />
              <InfoRow label="Process Date" value={formatDate(associate.process_date)} />
              <InfoRow label="Planned Start" value={formatDate(associate.planned_start_date)} />
              <InfoRow label="Actual Start" value={formatDate(associate.actual_start_date)} />
              <InfoRow label="Termination Date" value={formatDate(associate.termination_date)} />
              <InfoRow label="Termination Reason" value={associate.termination_reason ?? '-'} />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Compliance</Typography>
              <InfoRow label="I-9 Cleared" value={associate.i9_cleared ? 'Yes' : 'No'} />
              <InfoRow label="Background Check" value={associate.background_check_status ?? '-'} />
              <InfoRow label="Eligible for Rehire" value={associate.eligible_for_rehire == null ? '-' : associate.eligible_for_rehire ? 'Yes' : 'No'} />
            </CardContent>
          </Card>
        </Grid>

        {associate.notes && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Notes</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {associate.notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 160, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}
