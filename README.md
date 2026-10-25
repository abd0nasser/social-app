# Route Posts — Angular client

Angular 20 (standalone components, signals, reactive forms) client for the Route Posts API,
styled after the official demo (hash routes `#/auth`, `#/feed`, `#/profile`, `#/notifications`).

## Run

```bash
npm install
npm start        # http://localhost:4200
npm run build    # production build in dist/
```

## Requirements covered

| Requirement | Where |
|---|---|
| Sign-up + Login (tabbed auth page) | `pages/auth` |
| Home page with all posts + create post | `pages/feed` (tabs: Feed / My Posts / Community / Saved) |
| Post details with all comments | `pages/post-details` |
| Profile page | `pages/profile` |
| Create / update / delete post | `pages/feed` (create), `shared/post-card` (⋯ menu: edit, delete) |
| Create / update / delete comment | `pages/post-details` |
| Change password | `pages/change-password` |
| Extras seen in the demo | Notifications, Suggested friends (follow), like, save |

## Structure

- `core/config.ts` — **API base URL and every endpoint path in one place.**
- `core/auth.service.ts` — token + user state (signals); login tries `{email|username}` then `{login}`.
- `core/auth.interceptor.ts` — adds `Authorization: Bearer <token>`, logs out on 401.
- `core/posts.service.ts`, `core/users.service.ts` — API calls.
- `shared/` — post card, avatar, icon set.

## If something doesn't match the API

Field names and a few endpoints were inferred (the Postman docs weren't readable when this
was written). If a request fails, compare it with Postman and adjust:

- Endpoint paths → `core/config.ts` (bookmarks list, follow, notifications are the least certain)
- Sign-up body → `pages/auth/auth.component.ts` (`regForm`)
- Change-password body (`password`, `newPassword`) → `core/auth.service.ts`
- Post / comment body fields (`body`, `content`, `image`, `privacy`) → `core/posts.service.ts`
- Response shapes (`posts`, `comments`, `user`…) → `pickList` / `pickOne` in `core/models.ts`
