import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Box, Typography, useTheme } from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface HeadcountDataPoint {
  date: string;
  shift: string;
  requested?: number;
  required?: number;
  working?: number;
  headcount?: number;
  target_headcount?: number;
}

interface HeadcountChartProps {
  data: HeadcountDataPoint[];
  title?: string;
}

export default function HeadcountChart({ data, title }: HeadcountChartProps) {
  const theme = useTheme();

  const chartData = useMemo(() => {
    const sorted = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const labels = sorted.map((d) => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const requested = sorted.map(
      (d) => d.requested ?? d.target_headcount ?? 0,
    );
    const required = sorted.map(
      (d) => d.required ?? d.target_headcount ?? 0,
    );
    const working = sorted.map((d) => d.working ?? d.headcount ?? 0);

    return {
      labels,
      datasets: [
        {
          label: 'Requested',
          data: requested,
          borderColor: theme.palette.info.main,
          backgroundColor: 'transparent',
          borderDash: [6, 3],
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
        },
        {
          label: 'Required',
          data: required,
          borderColor: theme.palette.warning.main,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
        },
        {
          label: 'Working',
          data: working,
          borderColor: theme.palette.success.main,
          backgroundColor: `${theme.palette.success.main}18`,
          fill: true,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
        },
      ],
    };
  }, [data, theme]);

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 16,
            font: { family: theme.typography.fontFamily as string, size: 12 },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 13 },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 6,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 11 },
            maxRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: { font: { size: 11 }, stepSize: 5 },
        },
      },
    }),
    [theme],
  );

  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Box sx={{ position: 'relative', height: 350 }}>
        <Line data={chartData} options={options} />
      </Box>
    </Box>
  );
}
