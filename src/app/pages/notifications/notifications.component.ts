import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { errorMessage } from '../../core/http-error';
import { AppNotification, User } from '../../core/models';
import { timeAgo } from '../../core/time';
import { NotificationsService } from '../../core/users.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-notifications',
  imports: [AvatarComponent, IconComponent],
  template: `
    <main class="page wide">
      <section class="card box">
        <header>
          <div>
            <h1>Notifications</h1>
            <p>Realtime updates for likes, comments, shares, and follows.</p>
          </div>
          <button class="mark" (click)="markAll()" [disabled]="!unreadCount()">
            <app-icon name="check" [size]="15" /> Mark all as read
          </button>
        </header>

        <div class="chips">
          <button [class.on]="!onlyUnread()" (click)="setFilter(false)">All</button>
          <button [class.on]="onlyUnread()" (click)="setFilter(true)">Unread</button>
        </div>

        <div class="list">
          @if (error()) { <div class="alert error">{{ error() }}</div> }
          @if (loading()) {
            <div class="empty">Loading…</div>
          } @else {
            @for (n of shown(); track n._id) {
              <button class="item" [class.unread]="!isRead(n)" (click)="open(n)">
                <app-avatar [user]="actor(n)" [size]="40" />
                <span class="txt">
                  <b>{{ actor(n)?.name ?? 'Someone' }}</b> {{ text(n) }}
                  <small>{{ ago(n.createdAt) }}</small>
                </span>
                @if (!isRead(n)) { <i class="dot"></i> }
              </button>
            } @empty {
              <div class="empty">No notifications yet.</div>
            }
          }
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .box { padding: 0; overflow: hidden; }
      header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 22px 24px 14px; flex-wrap: wrap; }
      h1 { font-size: 30px; font-weight: 700; color: var(--ink); line-height: 1.1; }
      header p { color: var(--muted); font-size: 14.5px; margin-top: 4px; }
      .mark {
        display: inline-flex; align-items: center; gap: 7px; padding: 10px 16px; border: 1px solid var(--line);
        background: #fff; border-radius: 12px; font: inherit; font-weight: 600; font-size: 14px; color: var(--muted); cursor: pointer;
      }
      .mark:not(:disabled):hover { color: var(--blue); border-color: #bcd3f7; }
      .mark:disabled { opacity: 0.6; cursor: default; }
      .chips { display: flex; gap: 8px; padding: 0 24px 16px; border-bottom: 1px solid var(--line); }
      .chips button {
        border: 0; padding: 8px 18px; border-radius: 999px; background: #eef1f8; color: var(--text);
        font: inherit; font-weight: 700; font-size: 14px; cursor: pointer;
      }
      .chips button.on { background: var(--blue); color: #fff; }
      .list { padding: 14px 16px 20px; }
      .empty {
        text-align: center; color: var(--muted); padding: 26px; border: 1px solid var(--line); border-radius: 14px; background: #fafbff;
      }
      .item {
        display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; margin-bottom: 8px; text-align: left;
        border: 1px solid var(--line); border-radius: 14px; background: #fff; font: inherit; color: var(--text); cursor: pointer;
      }
      .item.unread { background: #eef5ff; border-color: #cfe0fb; }
      .txt { flex: 1; display: flex; flex-direction: column; line-height: 1.3; }
      .txt b { color: var(--ink); }
      small { color: var(--blue); font-weight: 600; font-size: 12.5px; }
      .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--blue); }
    `,
  ],
})
export class NotificationsComponent implements OnInit {
  private api = inject(NotificationsService);

  all = signal<AppNotification[]>([]);
  loading = signal(true);
  error = signal('');
  onlyUnread = signal(false);

  shown = computed(() => (this.onlyUnread() ? this.all().filter((n) => !this.isRead(n)) : this.all()));
  unreadCount = computed(() => this.all().filter((n) => !this.isRead(n)).length);

  isRead = (n: AppNotification) => !!(n.isRead ?? n.read);
  ago = (d?: string) => timeAgo(d);
  actor = (n: AppNotification): User | null => {
    const a = n.actor ?? n.sender ?? n.from;
    return a && typeof a === 'object' ? a : null;
  };
  text = (n: AppNotification): string => {
    if (n.message) return n.message;
    switch (n.type) {
      case 'like': return 'liked your post.';
      case 'comment': return 'commented on your post.';
      case 'share': return 'shared your post.';
      case 'follow': return 'started following you.';
      default: return 'sent you a notification.';
    }
  };

  ngOnInit(): void {
    this.api.list().subscribe({
      next: (l) => { this.all.set(l); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }

  setFilter(unread: boolean): void {
    this.onlyUnread.set(unread);
  }

  open(n: AppNotification): void {
    if (this.isRead(n)) return;
    this.patch(n._id, true);
    this.api.markRead(n._id).subscribe({ error: () => this.patch(n._id, false) });
  }

  markAll(): void {
    const before = this.all();
    this.all.update((l) => l.map((n) => ({ ...n, isRead: true, read: true })));
    this.api.markAllRead().subscribe({ error: () => this.all.set(before) });
  }

  private patch(id: string, read: boolean): void {
    this.all.update((l) => l.map((n) => (n._id === id ? { ...n, isRead: read, read } : n)));
  }
}
