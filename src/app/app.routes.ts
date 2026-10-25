import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'feed' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: 'feed',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/feed/feed.component').then((m) => m.FeedComponent),
  },
  {
    path: 'posts/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/post-details/post-details.component').then((m) => m.PostDetailsComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/notifications/notifications.component').then((m) => m.NotificationsComponent),
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent,
      ),
  },
  { path: '**', redirectTo: 'feed' },
];
