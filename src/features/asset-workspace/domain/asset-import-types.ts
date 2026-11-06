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

export type Severity = "valid" | "warning" | "error";

export type RowResult = "created" | "created_with_warning" | "not_registered";

export type RowCode =
  | "VALIDATION"
  | "REQUIRED"
  | "INVALID_DATE"
  | "INVALID_CONDITION"
  | "UNKNOWN_CATEGORY"
  | "UNKNOWN_LOCATION"
  | "UNKNOWN_ASSIGNEE"
  | "AMBIGUOUS_REFERENCE"
  | "SERIAL_REQUIRED"
  | "SERIAL_DUPLICATE"
  | "TAG_TAKEN"
  | "TAG_DUPLICATE_IN_FILE"
  | "ALREADY_IMPORTED"
  | "UNKNOWN_SOURCE_ROW"
  | "SOURCE_ROW_DUPLICATE_IN_FILE";

export type RowMessage = {
  field: ImportFieldKey | "row";
  code: RowCode;
  severity: "error" | "warning";
  message: string;
  detailsTotal?: number;
  // rows = other rows, at most 20; total = all rows sharing the value, this row included.
  details?:
    | { id: string; assetTag: string | null; name: string }[]
    | { rows: number[]; total: number }
    | { candidates: string[] };
};

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

export type ImportRow = {
  id: string;
  rowIndex: number;
  values: Partial<Record<ImportFieldKey, string>>;
  severity: Severity;
  messages: RowMessage[];
  errorCode?: string | null;
  errorMessage?: string | null;
  result: RowResult | null;
  createdAsset: { id: string; assetTag: string; name: string } | null;
  override: {
    reason: string | null;
    // Null once the approving user has been removed.
    by: { id: string; name: string } | null;
    at: string;
  } | null;
  originalRowIndex: number | null;
};

export type RowsQuery = {
  severity?: Severity;
  result?: RowResult | "pending";
  q?: string;
  page: number;
  pageSize: number;
};

export type RowsPage = {
  rows: ImportRow[];
  page: number;
  pageSize: number;
  total: number;
};

export type SendRow = {
  row_index: number;
  original_row_index?: number;
  values: Partial<Record<ImportFieldKey, string>>;
};

export type ConfirmMode = "ready_and_warnings" | "ready_only";
export type ImportConfirmBody = { mode?: ConfirmMode; override_reason?: string };

export type ConfirmResult = {
  batchId: string;
  status: BatchStatus;
  processed: number;
  remaining: number;
  counts: {
    created: number;
    createdWithWarning: number;
    notRegistered: number;
  };
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
