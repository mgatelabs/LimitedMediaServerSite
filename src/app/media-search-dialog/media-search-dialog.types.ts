/*
export interface MediaFolderTagInfo {
  bit: number;          // 0..127 or 1..128 depending on your convention
  shortTag: string;     // up to 6 chars
  longTag: string;      // up to 16 chars
  description?: string; // optional
}
*/

import { MediaFolderTag } from "../media-folder-tag.service";

// Sort options
export type MediaSortOrder =
  | 'AZ'
  | 'ZA'
  | 'DA'
  | 'DD'
  | 'FA'
  | 'FD';

export interface MediaSearchDialogData {
  availableTags: MediaFolderTag[];
  blurLevels: Array<{ value: number; label: string }>;
  filterLevels: Array<{ value: number; label: string }>;
  initial?: Partial<MediaSearchDialogResult>;
}

export interface MediaSearchDialogResult {
  text: string;
  tagBitsPositive: number[];          // <- the "list of numbers" you want
  tagBitsNegative: number[];          // <- the "list of numbers" you want
  sortOrder: string;
  blurLevel: number;
  filterLevel: number;

  // Optional convenience values (recommended):
  tagMaskBigInt?: string;     // string form so it can be serialized safely
}
