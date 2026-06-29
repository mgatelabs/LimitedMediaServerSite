import { TestBed } from '@angular/core/testing';

import { MediaFolderTagService } from './media-folder-tag.service';

describe('MediaFolderTagService', () => {
  let service: MediaFolderTagService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MediaFolderTagService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
