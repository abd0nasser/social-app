import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE, ENDPOINTS } from './config';
import { ApiResponse, AppNotification, User, pickList } from './models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);

  suggestions(page = 1, limit = 10): Observable<User[]> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http
      .get<ApiResponse<unknown>>(API_BASE + ENDPOINTS.suggestions, { params })
      .pipe(map((r) => pickList<User>(r.data, ['suggestions', 'users'])));
  }

  /** Toggles follow / unfollow. */
  follow(id: string): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(API_BASE + ENDPOINTS.follow(id), {});
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);

  list(unreadOnly = false, page = 1, limit = 30): Observable<AppNotification[]> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (unreadOnly) params = params.set('unread', true);
    return this.http
      .get<ApiResponse<unknown>>(API_BASE + ENDPOINTS.notifications, { params })
      .pipe(map((r) => pickList<AppNotification>(r.data, ['notifications'])));
  }

  markRead(id: string): Observable<ApiResponse<unknown>> {
    return this.http.patch<ApiResponse<unknown>>(API_BASE + ENDPOINTS.notificationRead(id), {});
  }

  markAllRead(): Observable<ApiResponse<unknown>> {
    return this.http.patch<ApiResponse<unknown>>(API_BASE + ENDPOINTS.notificationsReadAll, {});
  }
}
