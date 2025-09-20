import { ViewMode } from "./media-browser/ViewMode";

export const SESSION_AUTH: boolean = false;
export const DEFAULT_ITEM_LIMIT: number = 20;

export const ATTR_VOLUME_PAGESIZE = 'volume_page_size';
export const ATTR_VOLUME_RATING_LIMIT = 'volume_rating_limit';
export const ATTR_VOLUME_RATING_BLUR = 'volume_rating_blur';
export const ATTR_VOLUME_PAGEINDEX = 'volume_page_index';
export const ATTR_VOLUME_SORTING = 'volume_sorting';
export const ATTR_VOLUME_RESTRICTED = 'volume_restricted';
export const ATTR_VOLUME_VIEW_MODE = 'volume_view_mode';

export const ATTR_CHAPTER_PAGESIZE = 'chapter_page_size';
export const ATTR_CHAPTER_PAGEINDEX = 'chapter_page_index';
export const ATTR_CHAPTER_VIEW_MODE = 'chapter_view_mode';
export const ATTR_CHAPTER_LAST_VOLUME = 'chapter_last_volume';

export const ATTR_MEDIA_PAGESIZE = 'media_page_size';
export const ATTR_MEDIA_RATING_LIMIT = 'media_rating_limit';
export const ATTR_MEDIA_RATING_BLUR = 'media_rating_blur';
export const ATTR_MEDIA_SORTING = 'media_sorting';
export const ATTR_MEDIA_VIEW_MODE = 'media_view_mode';

export const BOOK_RATINGS_LOOKUP: Record<string, number> = {
    '0': 0,
    '40': 40,
    '60': 60,
    '80': 80,
    '90': 90,
    '100': 100,
    '200': 200,
};

export const SERIES_RATINGS_LOOKUP: Record<string, number> = {
    '0': 0,
    '3': 3,
    '6': 6,
    '9': 9,
    '12': 12,
    '15': 15,
    '200': 200,
};

export const PAGE_SIZE_LOOKUP: Record<string, number> = {
    '10': 10,
    '20': 20,
    '50': 50,
    '100': 100,
    '150': 150,
};

export const VOLUME_VIEW_MODE_LOOKUP: Record<string, ViewMode> = {
    'G': ViewMode.GRID,
    'L': ViewMode.LIST,
    'S': ViewMode.SPLIT
};