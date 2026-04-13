import Chip from '@mui/material/Chip';
import { STATUS_COLORS } from '../../lib/constants';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

export default function StatusChip({ status, size = 'small' }: StatusChipProps) {
  const color = STATUS_COLORS[status] ?? 'default';

  return (
    <Chip
      label={status}
      color={color}
      size={size}
      variant="filled"
    />
  );
}
