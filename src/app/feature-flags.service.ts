import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagsService {

  // Management Features
  public readonly MANAGE_APP: number = 1;
  public readonly RESERVED_1: number = 2;
  public readonly MANAGE_BOOK: number = 4;
  public readonly MANAGE_PROCESSES: number = 8;
  public readonly MANAGE_MEDIA: number = 16;

  // Plugin Features
  public readonly GENERAL_PLUGINS: number = 32;
  public readonly UTILITY_PLUGINS: number = 64;
  public readonly BOOK_PLUGINS: number = 128; // End of BYTE 1
  public readonly RESERVED_2: number = 256; // Start of Byte 2
  public readonly MEDIA_PLUGINS: number = 512;

  // Viewing Features (Bits 7-10)
  public readonly VIEW_PROCESSES: number = 1024;
  public readonly VIEW_BOOKS: number = 2048;
  public readonly RESERVED_3: number = 4096;
  public readonly RESERVED_4: number = 8192;
  public readonly VIEW_MEDIA: number = 16384;

  // Extra Features (Bits 12-13)
  public readonly BOOKMARKS: number = 32768; // End of Byte 2
  public readonly RESERVED_5: number = 65536; // Start of Byte 3
  public readonly RESERVED_6: number = 131072;
  public readonly RESERVED_7: number = 262144;
  public readonly RESERVED_8: number = 524288;
  public readonly RESERVED_9: number = 1048576;
  public readonly RESERVED_10: number = 2097152;
  public readonly RESERVED_11: number = 4194304;
  public readonly RESERVED_12: number = 8388608; // End of byte 3

  constructor() { }

  // You can also define any utility functions here if needed.
  // For example, a method to check if a flag is set:
  public hasFeature(flags: number, feature: number): boolean {
    return (flags & feature) === feature;
  }
}
