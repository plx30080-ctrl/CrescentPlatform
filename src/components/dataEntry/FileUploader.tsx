import { useCallback, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface FileUploaderProps {
  onFileLoaded: (headers: string[], rows: unknown[][]) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUploader({ onFileLoaded }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ];
  const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

  const isValidFile = useCallback(
    (file: File): boolean => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      return (
        ACCEPTED_TYPES.includes(file.type) ||
        ACCEPTED_EXTENSIONS.includes(ext)
      );
    },
    [],
  );

  const parseExcel = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
            header: 1,
          });

          if (jsonData.length < 2) {
            setError('File must have at least a header row and one data row.');
            return;
          }

          const headers = (jsonData[0] as unknown[]).map((h) =>
            String(h ?? '').trim(),
          );
          const rows = jsonData.slice(1).filter((row) =>
            (row as unknown[]).some(
              (cell) => cell !== null && cell !== undefined && cell !== '',
            ),
          ) as unknown[][];

          setError(null);
          onFileLoaded(headers, rows);
        } catch {
          setError('Failed to parse file. Please check the format.');
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [onFileLoaded],
  );

  const parseCsv = useCallback(
    (file: File) => {
      Papa.parse(file, {
        complete: (results) => {
          const allRows = results.data as unknown[][];
          if (allRows.length < 2) {
            setError('File must have at least a header row and one data row.');
            return;
          }

          const headers = allRows[0].map((h) => String(h ?? '').trim());
          const rows = allRows.slice(1).filter((row) =>
            row.some(
              (cell) => cell !== null && cell !== undefined && cell !== '',
            ),
          );

          setError(null);
          onFileLoaded(headers, rows);
        },
        error: () => {
          setError('Failed to parse CSV file.');
        },
      });
    },
    [onFileLoaded],
  );

  const processFile = useCallback(
    (file: File) => {
      if (!isValidFile(file)) {
        setError('Invalid file type. Please upload .xlsx, .xls, or .csv files.');
        return;
      }

      setSelectedFile(file);
      setError(null);

      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (ext === '.csv') {
        parseCsv(file);
      } else {
        parseExcel(file);
      }
    },
    [isValidFile, parseCsv, parseExcel],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [processFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFile(e.target.files[0]);
      }
    },
    [processFile],
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileInput}
        style={{ display: 'none' }}
        id="file-upload-input"
      />

      {!selectedFile ? (
        <Paper
          variant="outlined"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            p: 5,
            textAlign: 'center',
            cursor: 'pointer',
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: dragActive ? 'primary.main' : 'divider',
            bgcolor: dragActive ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'primary.light',
              bgcolor: 'action.hover',
            },
          }}
          onClick={() => inputRef.current?.click()}
        >
          <CloudUploadIcon
            sx={{ fontSize: 56, color: 'text.secondary', mb: 2 }}
          />
          <Typography variant="h6" gutterBottom>
            Drag & drop your file here
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            or click to browse
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
            {ACCEPTED_EXTENSIONS.map((ext) => (
              <Chip
                key={ext}
                label={ext}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <InsertDriveFileIcon color="primary" sx={{ fontSize: 40 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedFile.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(selectedFile.size)}
            </Typography>
          </Box>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleRemoveFile}
          >
            Remove
          </Button>
        </Paper>
      )}

      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
