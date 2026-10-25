import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE, ENDPOINTS } from './config';
import { ApiResponse, Comment, Post, pickList, pickOne } from './models';

export type FeedMode = 'feed' | 'mine' | 'community' | 'saved';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private http = inject(HttpClient);

  /** Sidebar tabs: Feed (home timeline), My Posts, Community (everyone), Saved (bookmarks). */
  getPosts(mode: FeedMode, page = 1, limit = 20): Observable<Post[]> {
    if (mode === 'saved') {
      const params = new HttpParams().set('page', page).set('limit', limit);
      return this.http
        .get<ApiResponse<unknown>>(API_BASE + ENDPOINTS.bookmarks, { params })
        .pipe(map((r) => pickList<Post>(r.data, ['bookmarks', 'posts'])));
    }
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (mode === 'mine') params = params.set('only', 'me');
    if (mode === 'community') params = params.set('only', 'all');
    return this.http
      .get<ApiResponse<unknown>>(API_BASE + ENDPOINTS.feed, { params })
      .pipe(map((r) => pickList<Post>(r.data, ['posts'])));
  }

  getPost(id: string): Observable<Post> {
    return this.http
      .get<ApiResponse<unknown>>(API_BASE + ENDPOINTS.post(id))
      .pipe(map((r) => pickOne<Post>(r.data, 'post')));
  }

  createPost(body: string, image?: File | null, privacy = 'public'): Observable<ApiResponse<unknown>> {
    const fd = this.postForm(body, image);
    if (privacy !== 'public') fd.append('privacy', privacy);
    return this.http.post<ApiResponse<unknown>>(API_BASE + ENDPOINTS.posts, fd);
  }

  updatePost(id: string, body: string, image?: File | null): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(API_BASE + ENDPOINTS.post(id), this.postForm(body, image));
  }

  deletePost(id: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(API_BASE + ENDPOINTS.post(id));
  }

  toggleLike(id: string): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(API_BASE + ENDPOINTS.like(id), {});
  }

  toggleBookmark(id: string): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(API_BASE + ENDPOINTS.bookmark(id), {});
  }

  // ---- comments ----

  getComments(postId: string, page = 1, limit = 50): Observable<Comment[]> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http
      .get<ApiResponse<unknown>>(API_BASE + ENDPOINTS.comments(postId), { params })
      .pipe(map((r) => pickList<Comment>(r.data, ['comments'])));
  }

  createComment(postId: string, content: string): Observable<ApiResponse<unknown>> {
    const fd = new FormData();
    fd.append('content', content);
    return this.http.post<ApiResponse<unknown>>(API_BASE + ENDPOINTS.comments(postId), fd);
  }

  updateComment(postId: string, commentId: string, content: string): Observable<ApiResponse<unknown>> {
    const fd = new FormData();
    fd.append('content', content);
    return this.http.put<ApiResponse<unknown>>(API_BASE + ENDPOINTS.comment(postId, commentId), fd);
  }

  deleteComment(postId: string, commentId: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(API_BASE + ENDPOINTS.comment(postId, commentId));
  }

  private postForm(body: string, image?: File | null): FormData {
    const fd = new FormData();
    fd.append('body', body);
    if (image) fd.append('image', image);
    return fd;
  }
}
