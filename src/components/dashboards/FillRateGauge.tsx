import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  type ChartOptions,
  type Plugin,
} from 'chart.js';
import { Box, Typography } from '@mui/material';

ChartJS.register(ArcElement, Tooltip);

interface FillRateGaugeProps {
  rate: number;
  label: string;
  size?: number;
}

function getColor(rate: number): string {
  if (rate < 80) return '#d32f2f';
  if (rate <= 95) return '#ed6c02';
  return '#2e7d32';
}

export default function FillRateGauge({
  rate,
  label,
  size = 180,
}: FillRateGaugeProps) {
  const clampedRate = Math.min(100, Math.max(0, rate));
  const color = getColor(clampedRate);

  const chartData = useMemo(
    () => ({
      datasets: [
        {
          data: [clampedRate, 100 - clampedRate],
          backgroundColor: [color, '#e0e0e0'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270,
          cutout: '78%',
        },
      ],
    }),
    [clampedRate, color],
  );

  const centerTextPlugin: Plugin<'doughnut'> = useMemo(
    () => ({
      id: 'centerText',
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = chartArea.bottom - 10;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        ctx.font = `bold ${size * 0.18}px Inter, Roboto, sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText(`${Math.round(clampedRate)}%`, centerX, centerY - 4);

        ctx.restore();
      },
    }),
    [clampedRate, color, size],
  );

  const options: ChartOptions<'doughnut'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false },
      },
    }),
    [],
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: size,
      }}
    >
      <Box sx={{ width: size, height: size * 0.6 }}>
        <Doughnut
          data={chartData}
          options={options}
          plugins={[centerTextPlugin]}
        />
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: -1, fontWeight: 500 }}
      >
        {label}
      </Typography>
    </Box>
  );
}
