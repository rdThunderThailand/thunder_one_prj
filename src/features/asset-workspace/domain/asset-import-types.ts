export const IMPORT_FIELD_KEYS = [
  "name",
  "category",
  "location",
  "asset_tag",
  "serial_number",
  "purchase_date",
  "condition",
  "assignee",
  "notes",
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELD_KEYS)[number];

export type ImportColumn = {
  key: ImportFieldKey;
  label: string;
  required: boolean;
  maxLength?: number;
  format?: string;
  accepts?: string[];
  example: string;
};

export type ImportOptions = {
  ready: boolean;
  reason: string | null;
  file: {
    extensions: string[];
    mimeTypes: string[];
    maxBytes: number;
    maxRows: number;
    sourceFilePurpose: "import_source";
  };
  chunks: {
    rowsPerRequest: number;
    confirmRowsPerRequest: number;
  };
  columns: ImportColumn[];
  referenceMatching: {
    category: string[];
    location: string[];
    locationPathSeparator: string;
    assignee: string[];
    ambiguous: "error";
  };
  conditions: string[];
  conditionsByStatus: Record<"Available" | "Assigned", string[]>;
  defaultCondition: string;
  dateFormat: "YYYY-MM-DD";
  tagGeneration: {
    modes: string[];
    prefix: string;
    sequenceDigits: number;
    format: string;
    allocatedOn: string;
    reservesTag: boolean;
  };
  serialOverride: {
    field: string;
    maxLength: number;
    reasonIsConfirmation: boolean;
  };
  referenceSelectors: {
    categories: string;
    locations: string;
    orgUnits: string;
    persons: string;
  };
  registeredAssetsPath: string;
};

export type BatchStatus =
  | "uploaded"
  | "validated"
  | "processing"
  | "completed"
  | "partially_completed"
  | "failed";

export type ImportBatch = {
  id: string;
  batchCode: string;
  status: BatchStatus;
  createdAt: string;
  createdBy: { id: string; name: string };
  sourceFile: {
    id: string;
    name: string;
    sizeBytes: number;
    mimeType: string;
  } | null;
  totalRows: number;
  counts: {
    valid: number;
    warning: number;
    error: number;
    created: number;
    createdWithWarning: number;
    notRegistered: number;
    pending: number;
  };
  original: { id: string; batchCode: string } | null;
  registeredAssetsPath: string;
};

/** Shared parser output before file metadata and re-import detection. */
export type ParsedImportRows = {
  headers: string[];
  rows: { rowIndex: number; cells: string[] }[];
  totalRows: number;
};

/** Parsed file kept in memory only. */
export type ParsedImportFile = {
  file: File;
  name: string;
  sizeBytes: number;
  kind: "xlsx" | "csv";
  headers: string[];
  rows: { rowIndex: number; cells: string[] }[];
  columnCount: number;
  reimport: { originalImportId: string; sourceRowColumn: number } | null;
};

export type ColumnMapping = (ImportFieldKey | null)[];
