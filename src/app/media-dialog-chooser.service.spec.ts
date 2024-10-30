import { TestBed } from '@angular/core/testing';

import { MediaDialogChooserService } from './media-dialog-chooser.service';

describe('MediaDialogChooserService', () => {
  let service: MediaDialogChooserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MediaDialogChooserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
