import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import HeadcountChart from '../components/dashboards/HeadcountChart';
import FillRateGauge from '../components/dashboards/FillRateGauge';
import {
  getHeadcountTrend,
  getFillRates,
  getOnPremiseData,
  getHoursData,
  getBranchMetrics,
} from '../services/metricsService';
import { SHIFTS } from '../lib/constants';
import type { Shift } from '../lib/constants';
import type { HeadcountTrendPoint, HoursData, BranchMetrics } from '../types/metrics';
import { useTheme } from '@mui/material/styles';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

function EmptyState({ message = 'No data available for the selected period.' }: { message?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

function getDefaultDateRange(daysBack: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - daysBack);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Analytics
      </Typography>

      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Headcount" />
          <Tab label="Attendance" />
          <Tab label="Recruiter" />
          <Tab label="Labor" />
          <Tab label="Year-Over-Year" />
        </Tabs>

        <CardContent>
          {activeTab === 0 && <HeadcountTab />}
          {activeTab === 1 && <AttendanceTab />}
          {activeTab === 2 && <RecruiterTab />}
          {activeTab === 3 && <LaborTab />}
          {activeTab === 4 && <YearOverYearTab />}
        </CardContent>
      </Card>
    </Box>
  );
}

/* ======================== Headcount Tab ======================== */

function HeadcountTab() {
  const [trendData, setTrendData] = useState<HeadcountTrendPoint[]>([]);
  const [fillRates, setFillRates] = useState<Array<{ date: string; shift: string; fill_rate: number }>>([]);
  const [shiftFilter, setShiftFilter] = useState<Shift | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { start, end } = useMemo(() => getDefaultDateRange(30), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [trend, rates] = await Promise.all([
          getHeadcountTrend(30),
          getFillRates(start, end, shiftFilter || undefined),
        ]);
        if (!cancelled) {
          setTrendData(trend);
          setFillRates(rates);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [start, end, shiftFilter]);

  const filteredTrend = useMemo(() => {
    if (!shiftFilter) return trendData;
    return trendData.filter((d) => d.shift === shiftFilter);
  }, [trendData, shiftFilter]);

  const avgFillRate = useMemo(() => {
    if (fillRates.length === 0) return 0;
    return fillRates.reduce((sum, r) => sum + r.fill_rate, 0) / fillRates.length;
  }, [fillRates]);

  const shift1Rate = useMemo(() => {
    const rates = fillRates.filter((r) => r.shift === '1st');
    if (rates.length === 0) return 0;
    return rates.reduce((sum, r) => sum + r.fill_rate, 0) / rates.length;
  }, [fillRates]);

  const shift2Rate = useMemo(() => {
    const rates = fillRates.filter((r) => r.shift === '2nd');
    if (rates.length === 0) return 0;
    return rates.reduce((sum, r) => sum + r.fill_rate, 0) / rates.length;
  }, [fillRates]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  if (filteredTrend.length === 0 && fillRates.length === 0) {
    return <EmptyState />;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          select
          label="Shift Filter"
          value={shiftFilter}
          onChange={(e) => setShiftFilter(e.target.value as Shift | '')}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All Shifts</MenuItem>
          {SHIFTS.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <HeadcountChart data={filteredTrend} title="Headcount Trend (Last 30 Days)" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <FillRateGauge rate={avgFillRate} label="Overall Fill Rate" size={200} />
            <Box sx={{ display: 'flex', gap: 3 }}>
              <FillRateGauge rate={shift1Rate} label="1st Shift" size={140} />
              <FillRateGauge rate={shift2Rate} label="2nd Shift" size={140} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

/* ======================== Attendance Tab ======================== */

function AttendanceTab() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onPremiseData, setOnPremiseData] = useState<
    Array<{ date: string; requested: number; required: number; working: number }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { start, end } = getDefaultDateRange(30);
        const opData = await getOnPremiseData(start, end);

        if (!cancelled) {
          const sorted = [...opData].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
          setOnPremiseData(sorted);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const attendanceChartData = useMemo(() => {
    const labels = onPremiseData.map((d) => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const attendancePct = onPremiseData.map((d) => {
      if (d.requested === 0) return 0;
      return (d.working / d.requested) * 100;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Attendance %',
          data: attendancePct,
          borderColor: theme.palette.success.main,
          backgroundColor: `${theme.palette.success.main}18`,
          fill: true,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
        },
      ],
    };
  }, [onPremiseData, theme]);

  const lineOptions: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const },
        tooltip: { callbacks: { label: (ctx) => `${(ctx.parsed.y ?? 0).toFixed(1)}%` } },
      },
      scales: {
        y: { beginAtZero: false, min: 50, max: 100, ticks: { callback: (v) => `${v}%` } },
        x: { grid: { display: false } },
      },
    }),
    [],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  if (onPremiseData.length === 0) return <EmptyState />;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Attendance % Trend (Last 30 Days)
      </Typography>
      <Box sx={{ position: 'relative', height: 400 }}>
        <Line data={attendanceChartData} options={lineOptions} />
      </Box>
    </Box>
  );
}

/* ======================== Recruiter Tab ======================== */

function RecruiterTab() {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<BranchMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { start, end } = getDefaultDateRange(90);
        const data = await getBranchMetrics(start, end);
        if (!cancelled) setMetrics(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const chartData = useMemo(() => {
    const byBranch: Record<string, { interviewShows: number[]; scheduled: number[] }> = {};

    for (const m of metrics) {
      if (!byBranch[m.branch]) {
        byBranch[m.branch] = { interviewShows: [], scheduled: [] };
      }
      if (m.interview_shows != null) byBranch[m.branch].interviewShows.push(m.interview_shows);
      if (m.interviews_scheduled != null) byBranch[m.branch].scheduled.push(m.interviews_scheduled);
    }

    const branches = Object.keys(byBranch);
    const avgShows = branches.map((b) => {
      const vals = byBranch[b].interviewShows;
      return vals.length > 0 ? vals.reduce((a, c) => a + c, 0) / vals.length : 0;
    });
    const avgScheduled = branches.map((b) => {
      const vals = byBranch[b].scheduled;
      return vals.length > 0 ? vals.reduce((a, c) => a + c, 0) / vals.length : 0;
    });

    return {
      labels: branches,
      datasets: [
        {
          label: 'Avg Interview Shows',
          data: avgShows,
          backgroundColor: theme.palette.success.main,
          borderRadius: 6,
        },
        {
          label: 'Avg Interviews Scheduled',
          data: avgScheduled,
          backgroundColor: theme.palette.error.main,
          borderRadius: 6,
        },
      ],
    };
  }, [metrics, theme]);

  const barOptions: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(1)}` } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v) => `${v}%` } },
        x: { grid: { display: false } },
      },
    }),
    [],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  if (metrics.length === 0) return <EmptyState />;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Branch Performance (Last 90 Days)
      </Typography>
      <Box sx={{ position: 'relative', height: 400 }}>
        <Bar data={chartData} options={barOptions} />
      </Box>
    </Box>
  );
}

/* ======================== Labor Tab ======================== */

function LaborTab() {
  const theme = useTheme();
  const [hoursData, setHoursData] = useState<HoursData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { start, end } = getDefaultDateRange(90);
        const data = await getHoursData(start, end);
        if (!cancelled) setHoursData(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const chartData = useMemo(() => {
    const sorted = [...hoursData].sort(
      (a, b) => new Date(a.week_ending).getTime() - new Date(b.week_ending).getTime(),
    );

    const labels = sorted.map((d) => {
      const dt = new Date(d.week_ending);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Shift 1 Total',
          data: sorted.map((d) => d.shift1_total),
          backgroundColor: theme.palette.primary.main,
          borderRadius: 4,
          stack: 'hours',
        },
        {
          label: 'Shift 2 Total',
          data: sorted.map((d) => d.shift2_total),
          backgroundColor: theme.palette.warning.main,
          borderRadius: 4,
          stack: 'hours',
        },
      ],
    };
  }, [hoursData, theme]);

  const avgHoursChartData = useMemo(() => {
    const sorted = [...hoursData].sort(
      (a, b) => new Date(a.week_ending).getTime() - new Date(b.week_ending).getTime(),
    );

    const labels = sorted.map((d) => {
      const dt = new Date(d.week_ending);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Avg Hours/Employee',
          data: sorted.map((d) => d.employee_count > 0 ? (d.shift1_total + d.shift2_total) / d.employee_count : 0),
          borderColor: theme.palette.info.main,
          backgroundColor: `${theme.palette.info.main}18`,
          fill: true,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    };
  }, [hoursData, theme]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  if (hoursData.length === 0) return <EmptyState />;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          Weekly Hours (Regular vs Overtime)
        </Typography>
        <Box sx={{ position: 'relative', height: 350 }}>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' as const },
              },
              scales: {
                y: { stacked: true, beginAtZero: true },
                x: { stacked: true, grid: { display: false } },
              },
            }}
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          Average Hours per Employee
        </Typography>
        <Box sx={{ position: 'relative', height: 300 }}>
          <Line
            data={avgHoursChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top' as const } },
              scales: {
                y: { beginAtZero: false },
                x: { grid: { display: false } },
              },
            }}
          />
        </Box>
      </Grid>
    </Grid>
  );
}

/* ======================== Year-Over-Year Tab ======================== */

function YearOverYearTab() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<HeadcountTrendPoint[]>([]);
  const [lastYearData, setLastYearData] = useState<HeadcountTrendPoint[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const curEnd = now.toISOString().split('T')[0];
        const curStart = new Date(now);
        curStart.setDate(curStart.getDate() - 30);
        const curStartStr = curStart.toISOString().split('T')[0];

        const lastYearEnd = new Date(now);
        lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);
        const lastYearStart = new Date(lastYearEnd);
        lastYearStart.setDate(lastYearStart.getDate() - 30);

        const [curOpData, lyOpData] = await Promise.all([
          getOnPremiseData(curStartStr, curEnd),
          getOnPremiseData(
            lastYearStart.toISOString().split('T')[0],
            lastYearEnd.toISOString().split('T')[0],
          ),
        ]);

        if (!cancelled) {
          setCurrentData(
            curOpData.map((d) => ({
              date: d.date,
              shift: d.shift,
              requested: d.requested,
              required: d.required,
              working: d.working,
              fill_rate: d.required > 0 ? Math.round((d.working / d.required) * 100 * 10) / 10 : 0,
            })),
          );
          setLastYearData(
            lyOpData.map((d) => ({
              date: d.date,
              shift: d.shift,
              requested: d.requested,
              required: d.required,
              working: d.working,
              fill_rate: d.required > 0 ? Math.round((d.working / d.required) * 100 * 10) / 10 : 0,
            })),
          );
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const chartData = useMemo(() => {
    const sortedCurrent = [...currentData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const sortedLastYear = [...lastYearData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const maxLen = Math.max(sortedCurrent.length, sortedLastYear.length);
    const labels = Array.from({ length: maxLen }, (_, i) => `Day ${i + 1}`);

    return {
      labels,
      datasets: [
        {
          label: 'Current Year - Working',
          data: sortedCurrent.map((d) => d.working),
          borderColor: theme.palette.primary.main,
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: 'Last Year - Working',
          data: sortedLastYear.map((d) => d.working),
          borderColor: theme.palette.grey[400],
          backgroundColor: 'transparent',
          borderDash: [6, 3],
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: 'Current Year - Required',
          data: sortedCurrent.map((d) => d.required),
          borderColor: theme.palette.success.main,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [3, 3],
          tension: 0.3,
          pointRadius: 0,
        },
        {
          label: 'Last Year - Required',
          data: sortedLastYear.map((d) => d.required),
          borderColor: theme.palette.grey[300],
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [3, 3],
          tension: 0.3,
          pointRadius: 0,
        },
      ],
    };
  }, [currentData, lastYearData, theme]);

  const summaryData = useMemo(() => {
    const curAvgHC =
      currentData.length > 0
        ? currentData.reduce((s, d) => s + d.working, 0) / currentData.length
        : 0;
    const lyAvgHC =
      lastYearData.length > 0
        ? lastYearData.reduce((s, d) => s + d.working, 0) / lastYearData.length
        : 0;
    const curAvgTarget =
      currentData.length > 0
        ? currentData.reduce((s, d) => s + d.required, 0) / currentData.length
        : 0;
    const lyAvgTarget =
      lastYearData.length > 0
        ? lastYearData.reduce((s, d) => s + d.required, 0) / lastYearData.length
        : 0;

    const curFillRate = curAvgTarget > 0 ? (curAvgHC / curAvgTarget) * 100 : 0;
    const lyFillRate = lyAvgTarget > 0 ? (lyAvgHC / lyAvgTarget) * 100 : 0;

    return {
      curAvgHC: Math.round(curAvgHC),
      lyAvgHC: Math.round(lyAvgHC),
      hcChange: curAvgHC - lyAvgHC,
      curFillRate: Math.round(curFillRate),
      lyFillRate: Math.round(lyFillRate),
    };
  }, [currentData, lastYearData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  if (currentData.length === 0 && lastYearData.length === 0) return <EmptyState />;

  return (
    <Box>
      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Avg Headcount (Current)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {summaryData.curAvgHC}
              </Typography>
              <Typography
                variant="caption"
                color={summaryData.hcChange >= 0 ? 'success.main' : 'error.main'}
              >
                {summaryData.hcChange >= 0 ? '+' : ''}
                {Math.round(summaryData.hcChange)} vs last year
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Fill Rate (Current)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {summaryData.curFillRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Fill Rate (Last Year)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                {summaryData.lyFillRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chart */}
      <Typography variant="h6" gutterBottom>
        Year-Over-Year Comparison (30-Day Period)
      </Typography>
      <Box sx={{ position: 'relative', height: 400 }}>
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index' as const, intersect: false },
            plugins: {
              legend: {
                position: 'top' as const,
                labels: { usePointStyle: true, padding: 16 },
              },
            },
            scales: {
              y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
              x: { grid: { display: false } },
            },
          }}
        />
      </Box>
    </Box>
  );
}
