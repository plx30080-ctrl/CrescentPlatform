import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PercentIcon from '@mui/icons-material/Percent';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import HeadcountChart from '../components/dashboards/HeadcountChart';
import { getDashboardSummary, getHeadcountTrend } from '../services/metricsService';
import { getEarlyLeaves } from '../services/earlyLeaveService';
import { formatDate } from '../utils/formatters';
import { STATUS_COLORS } from '../lib/constants';
import type { DashboardSummary, HeadcountTrendPoint } from '../types/metrics';
import type { EarlyLeaveWithAssociate } from '../types/earlyLeave';

ChartJS.register(ArcElement, ChartTooltip, Legend);

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
            width: 56,
            height: 56,
            borderRadius: '12px',
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
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

const PIPELINE_COLORS: Record<string, string> = {
  Applied: '#0288d1',
  Interviewing: '#0277bd',
  'Background Check': '#ed6c02',
  Orientation: '#f57c00',
  Started: '#2e7d32',
  Declined: '#d32f2f',
};

export default function HomePage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trendData, setTrendData] = useState<HeadcountTrendPoint[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<EarlyLeaveWithAssociate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [summaryData, trend, leavesResult] = await Promise.all([
          getDashboardSummary(),
          getHeadcountTrend(30),
          getEarlyLeaves({ pageSize: 10, page: 1 }),
        ]);

        if (!cancelled) {
          setSummary(summaryData);
          setTrendData(trend);
          setRecentLeaves(leavesResult.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const pipelineChartData = useMemo(() => {
    if (!summary?.pipeline_counts) return null;

    const labels = Object.keys(summary.pipeline_counts);
    const values = Object.values(summary.pipeline_counts);
    const colors = labels.map((l) => PIPELINE_COLORS[l] ?? '#9e9e9e');

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };
  }, [summary]);

  const pipelineTotal = useMemo(() => {
    if (!summary?.pipeline_counts) return 0;
    return Object.values(summary.pipeline_counts).reduce((acc, v) => acc + v, 0);
  }, [summary]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
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
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Dashboard
      </Typography>

      {/* Stat cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Associates"
            value={summary?.total_active_associates ?? 0}
            icon={<PeopleIcon sx={{ fontSize: 28 }} />}
            color="#5C2D91"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Pipeline Count"
            value={pipelineTotal}
            icon={<TrendingUpIcon sx={{ fontSize: 28 }} />}
            color="#0288d1"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Today's Fill Rate"
            value={`${fillRate}%`}
            icon={<PercentIcon sx={{ fontSize: 28 }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Early Leaves This Week"
            value={summary?.early_leave_count ?? 0}
            icon={<EventBusyIcon sx={{ fontSize: 28 }} />}
            color="#ed6c02"
          />
        </Grid>
      </Grid>

      {/* Charts row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <HeadcountChart data={trendData} title="Headcount Trend (Last 30 Days)" />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pipeline Breakdown
              </Typography>
              {pipelineChartData && pipelineChartData.labels.length > 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                  <Box sx={{ width: 260, height: 260 }}>
                    <Doughnut
                      data={pipelineChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              padding: 12,
                              usePointStyle: true,
                              font: { size: 11 },
                            },
                          },
                          tooltip: {
                            callbacks: {
                              label(ctx) {
                                const label = ctx.label ?? '';
                                const val = ctx.parsed;
                                return `${label}: ${val}`;
                              },
                            },
                          },
                        },
                        cutout: '55%',
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No pipeline data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Early Leaves */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Early Leaves
          </Typography>
          {recentLeaves.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No recent early leaves
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>EID</TableCell>
                    <TableCell>Shift</TableCell>
                    <TableCell>Time Left</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentLeaves.map((leave) => (
                    <TableRow key={leave.id} hover>
                      <TableCell>{formatDate(leave.date)}</TableCell>
                      <TableCell>
                        {leave.associate
                          ? `${leave.associate.first_name} ${leave.associate.last_name}`
                          : leave.eid}
                      </TableCell>
                      <TableCell>{leave.eid}</TableCell>
                      <TableCell>
                        <Chip
                          label={leave.shift}
                          size="small"
                          color={STATUS_COLORS[leave.shift] ?? 'default'}
                        />
                      </TableCell>
                      <TableCell>{leave.time_left}</TableCell>
                      <TableCell>{leave.reason ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
