import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule, TranslocoTestingOptions } from '@jsverse/transloco';
import { Subject } from 'rxjs';

import { SessionWidgetComponent } from './session-widget.component';
import { AuthService, AuthSession } from '../auth.service';

class AuthServiceMock {
  sessionData$ = new Subject<void>();
  private session: AuthSession = {
    username: '',
    exp: -1,
    features: 0,
    limits: { volume: 0, media: 0 },
    token: ''
  };

  isLoggedIn() {
    return !!this.session.token && this.session.exp > Math.floor(Date.now() / 1000);
  }

  getSessionTimeRemaining() {
    if (!this.session.token) return 0;
    const remaining = this.session.exp - Math.floor(Date.now() / 1000);
    return remaining > 0 ? remaining : 0;
  }

  getToken() {
    return this.session.token || null;
  }

  parseToken() {
    return null;
  }

  renew() {
    return new Subject<boolean>();
  }

  setValid(token: string, secondsLeft: number) {
    this.session = { ...this.session, username: 'tester', token, exp: Math.floor(Date.now() / 1000) + secondsLeft };
  }

  clear() {
    this.session = { ...this.session, token: '', exp: -1 };
  }
}

describe('SessionWidgetComponent', () => {
  const translocoConfig: TranslocoTestingOptions = {
    langs: {
      en: {
        widget: {
          session: 'Session',
          session_remaining: 'Time remaining',
          session_renew: 'Renew Session',
          session_renewing: 'Renewing...'
        },
        menu: {
          renew_token: 'Renew Token',
          sign_in: 'Sign In'
        }
      }
    }
  };

  let component: SessionWidgetComponent;
  let fixture: ComponentFixture<SessionWidgetComponent>;
  let authService: AuthServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionWidgetComponent, TranslocoTestingModule.forRoot(translocoConfig)],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SessionWidgetComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as AuthServiceMock;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the signed-out state when there is no session', () => {
    expect(component.authenticated).toBeFalse();
  });

  it('should report remaining time for a valid session', () => {
    authService.setValid('tok', 3600);
    authService.sessionData$.next();
    fixture.detectChanges();
    expect(component.authenticated).toBeTrue();
    expect(component.secondsLeft).toBeGreaterThan(0);
  });

  it('should report no remaining time when logged out', () => {
    authService.clear();
    authService.sessionData$.next();
    fixture.detectChanges();
    expect(component.authenticated).toBeFalse();
    expect(component.secondsLeft).toBe(0);
  });
});
