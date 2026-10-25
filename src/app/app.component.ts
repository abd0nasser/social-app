import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { AvatarComponent } from './shared/avatar/avatar.component';
import { IconComponent } from './shared/icon/icon.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent, IconComponent],
  template: `
    @if (auth.isLoggedIn()) {
      <header class="topbar">
        <a class="brand" routerLink="/feed">
          <span class="badge">ROUTE</span>
          <span class="brand-name">Route Posts</span>
        </a>

        <nav class="pill">
          <a routerLink="/feed" routerLinkActive="active"><app-icon name="home" /> <span>Feed</span></a>
          <a routerLink="/profile" routerLinkActive="active"><app-icon name="user" /> <span>Profile</span></a>
          <a routerLink="/notifications" routerLinkActive="active"><app-icon name="bell" /> <span>Notifications</span></a>
        </nav>

        <div class="user-menu">
          <button class="user-btn" (click)="toggle($event)" aria-haspopup="menu" [attr.aria-expanded]="open()">
            <app-avatar [user]="auth.user()" [size]="26" />
            <span class="uname">{{ auth.user()?.name ?? 'Account' }}</span>
            <app-icon name="menu" [size]="16" />
          </button>
          @if (open()) {
            <div class="dropdown" role="menu">
              <a routerLink="/profile" role="menuitem" (click)="open.set(false)"><app-icon name="user" [size]="16" /> My profile</a>
              <a routerLink="/change-password" role="menuitem" (click)="open.set(false)"><app-icon name="key" [size]="16" /> Change password</a>
              <button role="menuitem" (click)="auth.logout()"><app-icon name="logout" [size]="16" /> Log out</button>
            </div>
          }
        </div>
      </header>
    }
    <router-outlet />
  `,
  styles: [
    `
      .topbar {
        position: sticky; top: 0; z-index: 20; background: #fff; border-bottom: 1px solid var(--line);
        display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 10px 24px;
      }
      .brand { display: inline-flex; align-items: center; gap: 10px; justify-self: start; }
      .badge {
        background: var(--navy); color: #fff; font-weight: 900; font-size: 9px; letter-spacing: 0.04em;
        width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center;
      }
      .brand-name { font-weight: 700; font-size: 20px; color: var(--ink); }

      .pill {
        display: flex; gap: 4px; padding: 4px; background: #f3f6fc; border: 1px solid var(--line); border-radius: 14px;
      }
      .pill a {
        display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 11px;
        font-weight: 600; font-size: 14.5px; color: var(--text);
      }
      .pill a:hover { background: #e9eefa; }
      .pill a.active { background: #fff; color: var(--blue); box-shadow: 0 1px 4px rgba(20, 40, 100, 0.1); }

      .user-menu { position: relative; justify-self: end; }
      .user-btn {
        display: inline-flex; align-items: center; gap: 10px; padding: 5px 12px 5px 6px; cursor: pointer;
        background: #f3f6fc; border: 1px solid var(--line); border-radius: 999px; color: var(--ink);
        font-weight: 600; font-size: 14px;
      }
      .uname { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dropdown {
        position: absolute; right: 0; top: calc(100% + 8px); min-width: 200px; background: #fff;
        border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 10px 30px rgba(15, 30, 80, 0.14);
        padding: 6px; display: flex; flex-direction: column;
      }
      .dropdown a, .dropdown button {
        display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 0; background: none;
        border-radius: 9px; font: inherit; font-size: 14.5px; color: var(--text); cursor: pointer; text-align: left;
      }
      .dropdown a:hover, .dropdown button:hover { background: #f1f5fd; }
      .dropdown button { color: var(--danger); }

      @media (max-width: 820px) {
        .topbar { grid-template-columns: auto 1fr; gap: 8px; padding: 8px 12px; }
        .brand-name, .pill span, .uname { display: none; }
        .pill { justify-self: center; grid-column: 1 / -1; grid-row: 2; width: 100%; justify-content: space-around; }
        .user-menu { grid-column: 2; grid-row: 1; }
        .pill a { padding: 8px 14px; }
      }
    `,
  ],
})
export class AppComponent {
  auth = inject(AuthService);
  open = signal(false);

  toggle(e: Event): void {
    e.stopPropagation();
    this.open.update((v) => !v);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.open.set(false);
  }
}
