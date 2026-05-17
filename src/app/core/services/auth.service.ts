import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthUser, Role } from '../models';

// ── Login — 3 cenários possíveis ────────────────────────────────────
export interface LoginResponse {
  // cenário 1: role sem 2FA
  access_token?:   string;
  requires2fa:     boolean;
  twoFactorSetup:  boolean;
  user?:           AuthUser;
  // cenário 2: 2FA activo → tempToken para /auth/2fa/validate
  tempToken?:      string;
  message?:        string;
}

export interface RegisterResponse {
  access_token: string;
  user:         AuthUser;
}

export interface RegisterDto {
  email:    string;
  password: string;
  fullName: string;
  phone?:   string;
  role:     'buyer' | 'producer' | 'operator';
}

export interface TwoFASetupResponse {
  secret:  string;
  qrCode:  string;
  message: string;
}

export interface TwoFAValidateResponse {
  access_token: string;
  user:         AuthUser;
}

const HOME_ROUTES: Record<Role, string> = {
  admin:      '/dashboard/admin',
  state:      '/dashboard/state',
  staff:      '/dashboard/staff',
  specialist: '/dashboard/specialist',
  producer:   '/dashboard/producer',
  buyer:      '/dashboard/buyer',
  operator:   '/dashboard/operator',
  customs:    '/dashboard/customs',
  analyst:    '/dashboard/analyst',
  compliance: '/dashboard/compliance',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/auth/login`, { email, password });
  }

  register(dto: RegisterDto): Observable<RegisterResponse> {
    return this.http
      .post<RegisterResponse>(`${this.api}/auth/register`, dto)
      .pipe(
        tap((res) => {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('user', JSON.stringify(res.user));
        }),
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('temp_token');
    this.router.navigate(['/login']);
  }

  getMe(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.api}/auth/me`).pipe(
      tap((user) => localStorage.setItem('user', JSON.stringify(user))),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  // ── 2FA ────────────────────────────────────────────────────────────

  setup2FA(): Observable<TwoFASetupResponse> {
    return this.http.post<TwoFASetupResponse>(`${this.api}/auth/2fa/setup`, {});
  }

  verify2FA(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/auth/2fa/verify`, { code });
  }

  validate2FA(tempToken: string, code: string): Observable<TwoFAValidateResponse> {
    return this.http.post<TwoFAValidateResponse>(`${this.api}/auth/2fa/validate`, {
      tempToken,
      code,
    });
  }

  disable2FA(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/auth/2fa/disable`, { code });
  }

  // ── Helpers locais ─────────────────────────────────────────────────

  saveSession(token: string, user: AuthUser): void {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getHomeRoute(role: Role): string {
    return HOME_ROUTES[role];
  }
}
