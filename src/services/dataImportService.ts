import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import type { UploadType } from '../lib/constants';

export interface ParsedFile {
  headers: string[];
  rows: Record<string, unknown>[];
}

export interface ColumnMapping {
  [sourceColumn: string]: string; // source column -> target column
}

export interface UploadHistoryRecord {
  id: string;
  target_table: string;
  record_count: number;
  file_name: string | null;
  upload_type: string | null;
  column_mapping: Record<string, string> | null;
  uploaded_by: string | null;
  uploaded_at: string;
  details: Record<string, unknown> | null;
}

type TargetTable = 'associates' | 'on_premise_data' | 'hours_data' | 'branch_metrics' | 'early_leaves';

const TARGET_TABLE_FIELDS: Record<TargetTable, { required: string[]; optional: string[] }> = {
  associates: {
    required: ['eid', 'first_name', 'last_name'],
    optional: [
      'email', 'phone', 'status', 'pipeline_status', 'shift', 'branch',
      'recruiter', 'process_date', 'planned_start_date', 'actual_start_date',
      'termination_date', 'termination_reason', 'eligible_for_rehire',
      'i9_cleared', 'background_check_status', 'photo_url', 'notes',
    ],
  },
  on_premise_data: {
    required: ['date', 'shift'],
    optional: [
      'requested', 'required', 'working', 'new_starts',
      'send_homes', 'line_cuts', 'notes',
    ],
  },
  hours_data: {
    required: ['week_ending'],
    optional: [
      'shift1_total', 'shift1_direct', 'shift1_indirect',
      'shift2_total', 'shift2_direct', 'shift2_indirect',
      'employee_count',
    ],
  },
  branch_metrics: {
    required: ['branch'],
    optional: [
      'date', 'week_ending', 'is_weekly_summary',
      'interviews_scheduled', 'interview_shows',
      'shift1_processed', 'shift2_processed', 'shift2_confirmations',
      'next_day_confirmations', 'total_applicants', 'total_processed',
      'total_headcount', 'on_premise_count', 'scheduled_count',
      'attendance_pct', 'notes',
    ],
  },
  early_leaves: {
    required: ['associate_eid', 'date'],
    optional: [
      'shift', 'leave_time', 'scheduled_end', 'hours_worked',
      'reason', 'corrective_action', 'notes',
    ],
  },
};

export async function parseFile(file: File): Promise<ParsedFile> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv' || extension === 'tsv') {
    return parseCsv(file);
  }

  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  }

  throw new Error(`Unsupported file type: .${extension}. Please upload a CSV, TSV, XLSX, or XLS file.`);
}

function parseCsv(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete(results) {
        if (results.errors.length > 0) {
          const errorMessages = results.errors
            .slice(0, 5)
            .map((e) => `Row ${e.row}: ${e.message}`)
            .join('; ');
          reject(new Error(`CSV parsing errors: ${errorMessages}`));
          return;
        }

        const headers = results.meta.fields ?? [];
        const rows = results.data as Record<string, unknown>[];

        resolve({ headers, rows });
      },
      error(error: Error) {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

async function parseExcel(file: File): Promise<ParsedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Excel file contains no sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: null,
    raw: false,
  });

  if (jsonData.length === 0) {
    throw new Error('Excel sheet is empty or contains no data rows.');
  }

  const headers = Object.keys(jsonData[0]);

  return { headers, rows: jsonData };
}

export function validateMapping(
  mapping: ColumnMapping,
  targetTable: TargetTable
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const fields = TARGET_TABLE_FIELDS[targetTable];

  if (!fields) {
    return { valid: false, errors: [`Unknown target table: ${targetTable}`] };
  }

  const mappedTargetColumns = new Set(Object.values(mapping).filter(Boolean));

  for (const requiredField of fields.required) {
    if (!mappedTargetColumns.has(requiredField)) {
      errors.push(`Required field "${requiredField}" is not mapped to any source column.`);
    }
  }

  const allValidFields = new Set([...fields.required, ...fields.optional]);
  for (const [sourceCol, targetCol] of Object.entries(mapping)) {
    if (targetCol && !allValidFields.has(targetCol)) {
      errors.push(`"${sourceCol}" is mapped to unknown field "${targetCol}".`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export async function importData(
  rows: Record<string, unknown>[],
  mapping: ColumnMapping,
  targetTable: TargetTable,
  uploadType: UploadType,
  userId?: string,
  fileName?: string
): Promise<{ inserted: number; updated: number; errors: string[] }> {
  const mappedRows = rows.map((row) => {
    const mapped: Record<string, unknown> = {};
    for (const [sourceCol, targetCol] of Object.entries(mapping)) {
      if (targetCol && row[sourceCol] !== undefined && row[sourceCol] !== null && row[sourceCol] !== '') {
        mapped[targetCol] = row[sourceCol];
      }
    }
    return mapped;
  });

  const validRows = mappedRows.filter((row) => {
    const fields = TARGET_TABLE_FIELDS[targetTable];
    return fields.required.every((f) => row[f] !== undefined && row[f] !== null);
  });

  const skippedCount = mappedRows.length - validRows.length;
  const importErrors: string[] = [];

  if (skippedCount > 0) {
    importErrors.push(`${skippedCount} row(s) skipped due to missing required fields.`);
  }

  if (validRows.length === 0) {
    return { inserted: 0, updated: 0, errors: ['No valid rows to import after validation.'] };
  }

  let inserted = 0;
  let updated = 0;

  if (uploadType === 'replace') {
    const { error: deleteError } = await supabase.from(targetTable).delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      throw new Error(`Failed to clear table before replace: ${deleteError.message}`);
    }
  }

  if (uploadType === 'upsert') {
    const conflictColumn = targetTable === 'associates' ? 'eid' : 'id';
    const batchSize = 500;

    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      const { error } = await supabase
        .from(targetTable)
        .upsert(batch, { onConflict: conflictColumn });

      if (error) {
        importErrors.push(`Batch ${Math.floor(i / batchSize) + 1} error: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    }
  } else {
    const batchSize = 500;

    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      const { error } = await supabase.from(targetTable).insert(batch);

      if (error) {
        importErrors.push(`Batch ${Math.floor(i / batchSize) + 1} error: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    }
  }

  await supabase.from('upload_history').insert({
    target_table: targetTable,
    record_count: inserted + updated,
    file_name: fileName ?? null,
    upload_type: uploadType,
    column_mapping: mapping,
    uploaded_by: userId ?? null,
    details: {
      total_rows: rows.length,
      valid_rows: validRows.length,
      skipped_rows: skippedCount,
      inserted,
      updated,
      errors: importErrors,
    },
  });

  return { inserted, updated, errors: importErrors };
}

export async function getUploadHistory(): Promise<UploadHistoryRecord[]> {
  const { data, error } = await supabase
    .from('upload_history')
    .select('*')
    .order('uploaded_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Failed to fetch upload history: ${error.message}`);
  }

  return (data as UploadHistoryRecord[]) ?? [];
}

export function getTargetTableFields(
  table: TargetTable
): { required: string[]; optional: string[]; all: string[] } {
  const fields = TARGET_TABLE_FIELDS[table];

  if (!fields) {
    throw new Error(`Unknown target table: ${table}`);
  }

  return {
    required: fields.required,
    optional: fields.optional,
    all: [...fields.required, ...fields.optional],
  };
}
