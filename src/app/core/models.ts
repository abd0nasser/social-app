export interface User {
  _id: string;
  name: string;
  username?: string;
  email?: string;
  photo?: string;
  cover?: string;
  gender?: string;
  dateOfBirth?: string;
  createdAt?: string;
  followersCount?: number;
  followingCount?: number;
  bookmarksCount?: number;
  followers?: unknown[];
  following?: unknown[];
  bookmarks?: unknown[];
  mutualFollowersCount?: number;
  isFollowing?: boolean;
}

export interface Comment {
  _id: string;
  content: string;
  image?: string;
  createdAt?: string;
  likesCount?: number;
  /** Some backends return a populated user, others only the id. */
  commentCreator?: User | string;
  user?: User | string;
}

export interface Post {
  _id: string;
  body?: string;
  image?: string;
  createdAt?: string;
  privacy?: string;
  user?: User | string;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  bookmarked?: boolean;
  comments?: Comment[];
}

export interface AppNotification {
  _id: string;
  type?: string;
  message?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
  actor?: User | string;
  sender?: User | string;
  from?: User | string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

/** Pull the first array out of a response payload, whatever its key is. */
export function pickList<T>(data: unknown, preferredKeys: string[] = []): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const k of preferredKeys) if (Array.isArray(obj[k])) return obj[k] as T[];
    for (const v of Object.values(obj)) if (Array.isArray(v)) return v as T[];
  }
  return [];
}

/** Pull a single entity out of a payload that may wrap it under a key. */
export function pickOne<T>(data: unknown, key: string): T {
  if (data && typeof data === 'object' && key in (data as object)) {
    return (data as Record<string, unknown>)[key] as T;
  }
  return data as T;
}

type WithAuthor = { user?: User | string; commentCreator?: User | string };

export function authorOf(item: WithAuthor): User | null {
  const a = item.commentCreator ?? item.user;
  return a && typeof a === 'object' ? a : null;
}

export function authorId(item: WithAuthor): string {
  const a = item.commentCreator ?? item.user;
  return typeof a === 'string' ? a : (a?._id ?? '');
}

/** Read "followers" style counts whether the API sends a number or an array. */
export function countOf(user: User | null | undefined, key: 'followers' | 'following' | 'bookmarks'): number {
  if (!user) return 0;
  const n = user[`${key}Count` as 'followersCount' | 'followingCount' | 'bookmarksCount'];
  if (typeof n === 'number') return n;
  const arr = user[key];
  return Array.isArray(arr) ? arr.length : 0;
}
