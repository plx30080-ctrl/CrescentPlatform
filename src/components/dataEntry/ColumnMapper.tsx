import { useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface ColumnMapperProps {
  headers: string[];
  targetFields: {
    required: string[];
    optional: string[];
    all: string[];
  };
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}

function normalizeString(s: string): string {
  return s
    .toLowerCase()
    .replace(/[_\-\s]+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function fuzzyMatch(header: string, fieldName: string): number {
  const normHeader = normalizeString(header);
  const normField = normalizeString(fieldName);

  if (normHeader === normField) return 1.0;
  if (normHeader.includes(normField) || normField.includes(normHeader)) return 0.8;

  const shorter = normHeader.length <= normField.length ? normHeader : normField;
  const longer = normHeader.length > normField.length ? normHeader : normField;
  let matched = 0;
  let lastIndex = -1;
  for (const ch of shorter) {
    const idx = longer.indexOf(ch, lastIndex + 1);
    if (idx > -1) {
      matched++;
      lastIndex = idx;
    }
  }
  const similarity = shorter.length > 0 ? matched / shorter.length : 0;
  return similarity > 0.6 ? similarity * 0.6 : 0;
}

export default function ColumnMapper({
  headers,
  targetFields,
  mapping,
  onMappingChange,
}: ColumnMapperProps) {
  const mappedTargetFields = useMemo(() => {
    return new Set(Object.values(mapping).filter(Boolean));
  }, [mapping]);

  const unmappedRequired = useMemo(() => {
    return targetFields.required.filter((f) => !mappedTargetFields.has(f));
  }, [targetFields.required, mappedTargetFields]);

  const handleFieldChange = useCallback(
    (header: string, targetField: string) => {
      const newMapping = { ...mapping };
      if (targetField) {
        newMapping[header] = targetField;
      } else {
        delete newMapping[header];
      }
      onMappingChange(newMapping);
    },
    [mapping, onMappingChange],
  );

  const handleAutoMap = useCallback(() => {
    const newMapping: Record<string, string> = {};
    const usedFields = new Set<string>();

    for (const header of headers) {
      let bestField = '';
      let bestScore = 0;

      for (const field of targetFields.all) {
        if (usedFields.has(field)) continue;
        const score = fuzzyMatch(header, field);
        if (score > bestScore) {
          bestScore = score;
          bestField = field;
        }
      }

      if (bestField && bestScore >= 0.5) {
        newMapping[header] = bestField;
        usedFields.add(bestField);
      }
    }

    onMappingChange(newMapping);
  }, [headers, targetFields.all, onMappingChange]);

  const handleClearAll = useCallback(() => {
    onMappingChange({});
  }, [onMappingChange]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Map Columns</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AutoFixHighIcon />}
            onClick={handleAutoMap}
          >
            Auto-Map
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="secondary"
            startIcon={<ClearAllIcon />}
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      {/* Required fields status */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Required Fields
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {targetFields.required.map((field) => {
            const isMapped = mappedTargetFields.has(field);
            return (
              <Chip
                key={field}
                label={field}
                size="small"
                color={isMapped ? 'success' : 'error'}
                icon={isMapped ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
                variant={isMapped ? 'filled' : 'outlined'}
              />
            );
          })}
        </Box>
        {unmappedRequired.length > 0 && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            {unmappedRequired.length} required field(s) not yet mapped
          </Typography>
        )}
      </Paper>

      {/* Column mapping list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {headers.map((header) => {
          const currentTarget = mapping[header] ?? '';

          return (
            <Paper
              key={header}
              variant="outlined"
              sx={{
                p: 1.5,
                bgcolor: currentTarget ? 'action.hover' : 'background.paper',
              }}
            >
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {header}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ArrowForwardIcon color="action" />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={currentTarget}
                    onChange={(e) => handleFieldChange(header, e.target.value)}
                    label="Target Field"
                  >
                    <MenuItem value="">
                      <em>-- Skip --</em>
                    </MenuItem>
                    {targetFields.all.map((field) => {
                      const alreadyUsed =
                        mappedTargetFields.has(field) && mapping[header] !== field;
                      const req = targetFields.required.includes(field);
                      return (
                        <MenuItem
                          key={field}
                          value={field}
                          disabled={alreadyUsed}
                          sx={{ opacity: alreadyUsed ? 0.5 : 1 }}
                        >
                          {field}
                          {req && (
                            <Typography
                              component="span"
                              color="error"
                              variant="caption"
                              sx={{ ml: 0.5 }}
                            >
                              *
                            </Typography>
                          )}
                          {alreadyUsed && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              (mapped)
                            </Typography>
                          )}
                        </MenuItem>
                      );
                    })}
                  </TextField>
                </Grid>
              </Grid>
            </Paper>
          );
        })}
      </Box>

      {headers.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No headers to map. Please upload a file first.
        </Typography>
      )}
    </Box>
  );
}
