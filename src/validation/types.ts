export interface ValidationResult {
  check: string;
  passed: boolean;
  message: string;
  details?: string[];
}

export interface ValidationReport {
  results: ValidationResult[];
  passed: number;
  failed: number;
  warnings: number;
  timestamp: string;
}
