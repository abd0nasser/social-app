import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { API_BASE, ENDPOINTS, TOKEN_KEY, USER_KEY } from './config';
import { ApiResponse, User, pickOne } from './models';

interface AuthPayload {
  token: string;
  user?: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _user = signal<User | null>(this.readUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  signup(body: Record<string, unknown>): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(API_BASE + ENDPOINTS.signup, body);
  }

  /**
   * The sign-in field name isn't documented in the table ("login/email/username"),
   * so try the likely shapes in order. Only validation-type failures (400/422)
   * move on to the next shape; wrong credentials surface the first error.
   */
  login(identifier: string, password: string): Observable<ApiResponse<AuthPayload>> {
    const id = identifier.trim();
    const primary = id.includes('@') ? { email: id, password } : { username: id, password };
    return this.tryBodies([primary, { login: id, password }]).pipe(
      tap((res) => {
        this.setToken(res.data.token);
        if (res.data.user) this.setUser(res.data.user);
      }),
    );
  }

  private tryBodies(bodies: object[], i = 0): Observable<ApiResponse<AuthPayload>> {
    return this.http.post<ApiResponse<AuthPayload>>(API_BASE + ENDPOINTS.signin, bodies[i]).pipe(
      catchError((err: HttpErrorResponse) => {
        const canRetry = i < bodies.length - 1 && (err.status === 400 || err.status === 422);
        if (!canRetry) return throwError(() => err);
        return this.tryBodies(bodies, i + 1).pipe(catchError(() => throwError(() => err)));
      }),
    );
  }

  changePassword(password: string, newPassword: string): Observable<ApiResponse<Partial<AuthPayload>>> {
    return this.http
      .patch<ApiResponse<Partial<AuthPayload>>>(API_BASE + ENDPOINTS.changePassword, {
        password,
        newPassword,
      })
      .pipe(
        tap((res) => {
          // The API rotates the token when the password changes.
          if (res.data?.token) this.setToken(res.data.token);
        }),
      );
  }

  loadProfile(): Observable<ApiResponse<unknown>> {
    return this.http.get<ApiResponse<unknown>>(API_BASE + ENDPOINTS.profile).pipe(
      tap((res) => {
        const u = pickOne<User>(res.data, 'user');
        if (u && u._id) this.setUser(u);
      }),
    );
  }

  uploadPhoto(file: File): Observable<ApiResponse<unknown>> {
    const fd = new FormData();
    fd.append('photo', file);
    return this.http.put<ApiResponse<unknown>>(API_BASE + ENDPOINTS.uploadPhoto, fd);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigateByUrl('/auth');
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
  }

  private setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  private readUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
