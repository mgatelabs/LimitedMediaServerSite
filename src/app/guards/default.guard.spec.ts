import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { defaultGuard } from './default.guard';

describe('defaultGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => defaultGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
