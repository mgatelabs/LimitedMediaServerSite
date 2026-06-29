import { TestBed } from '@angular/core/testing';

import { ImageStateNumberService } from './image-state-number.service';

describe('ImageStateNumberService', () => {
  let service: ImageStateNumberService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageStateNumberService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
