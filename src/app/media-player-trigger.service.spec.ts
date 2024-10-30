import { TestBed } from '@angular/core/testing';

import { MediaPlayerTriggerService } from './media-player-trigger.service';

describe('MediaPlayerTriggerService', () => {
  let service: MediaPlayerTriggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MediaPlayerTriggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
