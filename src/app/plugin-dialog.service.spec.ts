import { TestBed } from '@angular/core/testing';

import { PluginDialogService } from './plugin-dialog.service';

describe('PluginDialogService', () => {
  let service: PluginDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PluginDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
