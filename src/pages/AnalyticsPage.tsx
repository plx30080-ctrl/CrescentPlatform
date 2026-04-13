import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import HeadcountChart from '../components/dashboards/HeadcountChart';
import FillRateGauge from '../components/dashboards/FillRateGauge';
import { getHeadcountTrend, getDashboardSummary } from '../services/metricsService';
import type { HeadcountTrendPoint, DashboardSummary } from '../types/metrics';

export default function AnalyticsPage() {
  const [trendData, setTrendData] = useState<HeadcountTrendPoint[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [trend, summaryData] = await Promise.all([
          getHeadcountTrend(90),
          getDashboardSummary(),
        ]);
        if (!cancelled) {
          setTrendData(trend);
          setSummary(summaryData);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const fillRate = summary
    ? summary.target_headcount_today > 0
      ? Math.round((summary.total_headcount_today / summary.target_headcount_today) * 100)
      : 0
    : 0;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <HeadcountChart data={trendData} title="Headcount Trend (Last 90 Days)" />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Fill Rate</Typography>
              <FillRateGauge value={fillRate} />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Active Associates</Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {summary?.total_active_associates ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Today's Headcount</Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                {summary?.total_headcount_today ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Target: {summary?.target_headcount_today ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Early Leaves This Week</Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {summary?.early_leave_count ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
