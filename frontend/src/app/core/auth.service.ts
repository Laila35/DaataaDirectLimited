import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { AuthResponse, User } from './models';

const TOKEN = 'dd_token';
const USER = 'dd_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(this.readUser());

  constructor(private http: HttpClient) {}

  login(email: string, password: string, portal: 'staff' | 'admin') {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password, portal }).pipe(tap((res) => this.store(res)));
  }

  register(body: { first_name: string; last_name: string; email: string; employee_code: string; department: string; password: string; role: 'employee' | 'admin' }) {
    return this.http.post<AuthResponse>('/api/auth/register', body).pipe(tap((res) => this.store(res)));
  }

  forgot(email: string) {
    return this.http.post<{ ok: boolean; message: string }>('/api/auth/forgot', { email });
  }

  reset(token: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/reset', { token, password }).pipe(tap((res) => this.store(res)));
  }

  logout() {
    localStorage.removeItem(TOKEN);
    localStorage.removeItem(USER);
    this.user.set(null);
  }

  private store(res: AuthResponse) {
    localStorage.setItem(TOKEN, res.token);
    localStorage.setItem(USER, JSON.stringify(res.user));
    this.user.set(res.user);
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(USER);
    if (!raw || !localStorage.getItem(TOKEN)) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
