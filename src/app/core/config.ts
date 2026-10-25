/**
 * Single place to adjust the backend contract.
 * If a path or field name differs from the Postman docs, fix it here only.
 */
export const API_BASE = 'https://route-posts.routemisr.com';

export const ENDPOINTS = {
  signup: '/users/signup',
  signin: '/users/signin',
  changePassword: '/users/change-password',
  uploadPhoto: '/users/upload-photo',
  profile: '/users/profile-data',
  suggestions: '/users/suggestions',
  follow: (id: string) => `/users/${id}/follow`,
  bookmarks: '/users/bookmarks',
  feed: '/posts/feed',
  posts: '/posts',
  post: (id: string) => `/posts/${id}`,
  like: (id: string) => `/posts/${id}/like`,
  bookmark: (id: string) => `/posts/${id}/bookmark`,
  comments: (postId: string) => `/posts/${postId}/comments`,
  comment: (postId: string, commentId: string) => `/posts/${postId}/comments/${commentId}`,
  notifications: '/notifications',
  notificationsReadAll: '/notifications/read-all',
  notificationRead: (id: string) => `/notifications/${id}/read`,
} as const;

export const TOKEN_KEY = 'social_token';
export const USER_KEY = 'social_user';
