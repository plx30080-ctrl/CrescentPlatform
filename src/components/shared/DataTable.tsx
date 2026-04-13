import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: number | string;
}

type SortDirection = 'asc' | 'desc';

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  rowsPerPageOptions?: number[];
  emptyMessage?: string;
  serverSidePagination?: boolean;
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  onRowClick,
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50],
  emptyMessage = 'No data available.',
  serverSidePagination = false,
}: DataTableProps<T>) {
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(rowsPerPageOptions[0] ?? 10);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const page = controlledPage ?? internalPage;
  const rowsPerPage = controlledRowsPerPage ?? internalRowsPerPage;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const paginatedData = useMemo(() => {
    if (serverSidePagination) return sortedData;
    const start = page * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage, serverSidePagination]);

  const handlePageChange = (_event: unknown, newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newRowsPerPage);
    } else {
      setInternalRowsPerPage(newRowsPerPage);
      setInternalPage(0);
    }
    if (onPageChange) {
      onPageChange(0);
    } else {
      setInternalPage(0);
    }
  };

  const displayCount = totalCount ?? data.length;
  const skeletonRows = rowsPerPage;

  if (loading) {
    return (
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key} sx={{ width: col.width }}>
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: skeletonRows }).map((_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  if (!data.length) {
    return (
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key} sx={{ width: col.width }}>
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} sx={{ width: col.width }}>
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={sortKey === col.key}
                      direction={sortKey === col.key ? sortDirection : 'asc'}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, rowIdx) => (
              <TableRow
                key={rowIdx}
                hover
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:last-child td': { borderBottom: 0 },
                }}
              >
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render
                      ? col.render(row)
                      : (String(getNestedValue(row, col.key) ?? ''))}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={displayCount}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={rowsPerPageOptions}
      />
    </Paper>
  );
}
