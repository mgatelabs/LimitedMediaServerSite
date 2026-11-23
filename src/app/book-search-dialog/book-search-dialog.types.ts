export type BookSortOrder = 'AZ' | 'ZA' | 'DA' | 'DD';

export interface ProcessorOption {
  value: string;
  name: string;
}

export interface BookSearchDialogData {
  availableTags: string[];
  processors: ProcessorOption[];
  sortOptions: Array<{ value: BookSortOrder; label: string }>;
  typeOptions: Array<{ value: string; label: string }>;
  blurLevels: Array<{ value: number; label: string }>;
  filterLevels: Array<{ value: number; label: string }>;
  initial: Partial<BookSearchDialogResult>;
}

export interface BookSearchDialogResult {
  text: string;
  type: string;
  tags: string[];
  processors: string[];
  sortOrder: string;
  blurLevel: number;
  filterLevel: number;
}
