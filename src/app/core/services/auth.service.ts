import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthUser, Role, CompanyCountry } from '../models';

interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  access_token: string;
  user: AuthUser;
  company: {
    id:            string;
    cd:            string;
    name:          string;
    country:       CompanyCountry;
    licenseStatus: string;
    message:       string;
  };
}

export interface RegisterDto {
  email:           string;
  password:        string;
  fullName:        string;
  role:            'buyer' | 'producer' | 'operator';
  companyName?:    string;
  companyCountry?: CompanyCountry;
  companyEmail?:   string;
  companyPhone?:   string;
  companyAddress?: string;
  companyId?:      string;
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
    return this.http
      .post<LoginResponse>(`${this.api}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('user', JSON.stringify(res.user));
        }),
      );
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
    this.router.navigate(['/login']);
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
