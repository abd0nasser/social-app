import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/http-error';
import { Post, User } from '../../core/models';
import { FeedMode, PostsService } from '../../core/posts.service';
import { UsersService } from '../../core/users.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { PostCardComponent } from '../../shared/post-card/post-card.component';

@Component({
  selector: 'app-feed',
  imports: [FormsModule, AvatarComponent, IconComponent, PostCardComponent],
  template: `
    <main class="layout">
      <!-- left sidebar -->
      <aside class="side card">
        @for (t of tabs; track t.mode) {
          <button [class.on]="mode() === t.mode" (click)="setMode(t.mode)">
            <app-icon [name]="t.icon" [size]="19" /> {{ t.label }}
          </button>
        }
      </aside>

      <!-- center -->
      <section class="center">
        <div class="card composer">
          <div class="who">
            <app-avatar [user]="auth.user()" [size]="42" />
            <div>
              <strong>{{ auth.user()?.name }}</strong>
              <label class="privacy">
                <app-icon name="globe" [size]="13" />
                <select [(ngModel)]="privacy" aria-label="Post visibility">
                  <option value="public">Public</option>
                  <option value="followers">Followers</option>
                  <option value="private">Only me</option>
                </select>
              </label>
            </div>
          </div>

          @if (formError()) { <div class="alert error">{{ formError() }}</div> }

          <textarea [(ngModel)]="body" [placeholder]="'What\\'s on your mind, ' + firstName() + '?'"></textarea>
          @if (previewUrl()) {
            <div class="preview">
              <img [src]="previewUrl()" alt="Selected image" />
              <button (click)="clearFile()" aria-label="Remove image">✕</button>
            </div>
          }

          <div class="bar">
            <div class="tools">
              <label class="tool"><app-icon name="image" [size]="19" /> Photo/video
                <input type="file" accept="image/*" hidden (change)="onFile($event)" />
              </label>
              <button class="tool" type="button" (click)="addFeeling()"><app-icon name="smile" [size]="19" /> Feeling/activity</button>
            </div>
            <button class="post-btn" [disabled]="posting() || (!body.trim() && !file)" (click)="publish()">
              {{ posting() ? 'Posting…' : 'Post' }} <app-icon name="send" [size]="15" />
            </button>
          </div>
        </div>

        @if (loading()) {
          <div class="card empty-card">Loading posts…</div>
        } @else if (loadError()) {
          <div class="alert error">{{ loadError() }} <button class="btn-soft" (click)="load()">Retry</button></div>
        } @else {
          @for (p of posts(); track p._id) {
            <app-post-card [post]="p" (changed)="load()" (deleted)="onDeleted($event)" />
          } @empty {
            <div class="card empty-card">No posts yet. Be the first one to publish.</div>
          }
        }
      </section>

      <!-- right: suggested friends -->
      <aside class="right card">
        <div class="r-head">
          <h3><app-icon name="users" [size]="19" /> Suggested Friends</h3>
          <span class="count">{{ filtered().length }}</span>
        </div>
        <div class="search">
          <app-icon name="search" [size]="16" />
          <input [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Search friends..." />
        </div>

        @for (u of filtered(); track u._id) {
          <div class="friend">
            <app-avatar [user]="u" [size]="40" />
            <div class="f-info">
              <strong>{{ u.name }}</strong>
              @if (u.username) { <span>&#64;{{ u.username }}</span> }
            </div>
            <button class="follow" [class.done]="followed().has(u._id)" (click)="follow(u)">
              <app-icon [name]="followed().has(u._id) ? 'check' : 'userPlus'" [size]="14" />
              {{ followed().has(u._id) ? 'Following' : 'Follow' }}
            </button>
            <div class="chips">
              @if (followersOf(u) !== null) { <span>{{ followersOf(u) }} followers</span> }
              @if (u.mutualFollowersCount) { <span class="mutual">{{ u.mutualFollowersCount }} mutual</span> }
            </div>
          </div>
        } @empty {
          <p class="none">No users matched your search.</p>
        }
        @if (moreAvailable()) {
          <button class="more" (click)="loadMore()">View more</button>
        }
      </aside>
    </main>
  `,
  styles: [
    `
      .layout { max-width: 1100px; margin: 0 auto; padding: 18px 16px 60px; display: grid; grid-template-columns: 220px minmax(0, 1fr) 260px; gap: 18px; align-items: start; }
      .side { position: sticky; top: 76px; padding: 10px; display: flex; flex-direction: column; gap: 4px; }
      .side button {
        display: flex; align-items: center; gap: 12px; padding: 11px 12px; border: 0; background: none; border-radius: 12px;
        font: inherit; font-weight: 600; font-size: 15.5px; color: var(--text); cursor: pointer; text-align: left;
      }
      .side button:hover { background: #f3f6fc; }
      .side button.on { background: #e3eefc; color: var(--navy); }

      .composer { padding: 16px; margin-bottom: 16px; }
      .who { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .who strong { color: var(--ink); font-size: 16px; display: block; }
      .privacy { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #f1f4fa; border: 1px solid var(--line); border-radius: 8px; color: var(--muted); }
      .privacy select { border: 0; background: none; font: inherit; font-size: 12.5px; color: var(--text); outline: none; cursor: pointer; }
      textarea {
        width: 100%; min-height: 108px; font: inherit; font-size: 16px; padding: 12px; color: var(--ink);
        border: 1px solid #dfe5f2; border-radius: 12px; background: #f6f8fd; outline: none; resize: vertical;
      }
      textarea:focus { border-color: var(--blue); background: #fff; }
      .preview { position: relative; margin-top: 10px; }
      .preview img { width: 100%; max-height: 260px; object-fit: cover; border-radius: 12px; display: block; }
      .preview button { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border-radius: 50%; border: 0; background: rgba(0,0,0,.6); color: #fff; cursor: pointer; }
      .bar { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 2px solid #1b2547; }
      .tools { display: flex; gap: 6px; flex-wrap: wrap; }
      .tool {
        display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border: 0; background: none; border-radius: 10px;
        font: inherit; font-weight: 600; font-size: 14.5px; color: var(--text); cursor: pointer;
      }
      .tool:hover { background: #f3f6fc; }
      .tool app-icon { color: #2a9d6f; }
      .tool:nth-child(2) app-icon { color: #f2a30f; }
      .post-btn {
        display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; border: 0; border-radius: 12px;
        background: var(--blue); color: #fff; font: inherit; font-weight: 700; font-size: 15px; cursor: pointer;
      }
      .post-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .right { position: sticky; top: 76px; padding: 16px 14px; max-height: calc(100vh - 92px); overflow-y: auto; }
      .r-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
      .r-head h3 { display: inline-flex; align-items: center; gap: 8px; font-size: 17px; color: var(--ink); }
      .r-head h3 app-icon { color: var(--blue); }
      .count { background: #eef1f8; border-radius: 999px; padding: 2px 9px; font-size: 12.5px; font-weight: 700; color: var(--text); }
      .search { position: relative; margin-bottom: 12px; }
      .search app-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); }
      .search input {
        width: 100%; font: inherit; font-size: 14.5px; padding: 10px 12px 10px 36px; border: 1px solid #dfe5f2;
        border-radius: 12px; background: #f6f8fd; outline: none;
      }
      .search input:focus { border-color: var(--blue); background: #fff; }
      .friend {
        display: grid; grid-template-columns: auto 1fr auto; gap: 4px 10px; align-items: center;
        padding: 12px; border: 1px solid var(--line); border-radius: 14px; margin-bottom: 10px;
      }
      .f-info { display: flex; flex-direction: column; min-width: 0; line-height: 1.2; }
      .f-info strong { color: var(--ink); font-size: 14.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .f-info span { font-size: 12.5px; color: var(--muted); }
      .follow {
        display: inline-flex; align-items: center; gap: 5px; padding: 6px 11px; border: 0; border-radius: 10px;
        background: var(--blue-soft); color: var(--blue); font: inherit; font-weight: 600; font-size: 13.5px; cursor: pointer;
      }
      .follow.done { background: #e4f7ef; color: var(--ok); }
      .chips { grid-column: 1 / -1; display: flex; gap: 6px; flex-wrap: wrap; }
      .chips span { font-size: 11.5px; font-weight: 600; color: var(--text); background: #eef1f8; border-radius: 999px; padding: 2px 9px; }
      .chips .mutual { background: #e3eefc; color: var(--blue); }
      .none { text-align: center; color: var(--muted); font-size: 14px; padding: 8px 0 14px; }
      .more {
        width: 100%; padding: 11px; border: 1px solid var(--line); background: #f6f8fd; border-radius: 12px;
        font: inherit; font-weight: 600; color: var(--ink); cursor: pointer;
      }

      @media (max-width: 1000px) {
        .layout { grid-template-columns: 200px minmax(0, 1fr); }
        .right { display: none; }
      }
      @media (max-width: 700px) {
        .layout { grid-template-columns: 1fr; }
        .side { position: static; flex-direction: row; overflow-x: auto; }
        .side button { white-space: nowrap; }
      }
    `,
  ],
})
export class FeedComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(PostsService);
  private users = inject(UsersService);

  tabs: { mode: FeedMode; label: string; icon: string }[] = [
    { mode: 'feed', label: 'Feed', icon: 'news' },
    { mode: 'mine', label: 'My Posts', icon: 'sparkles' },
    { mode: 'community', label: 'Community', icon: 'globe' },
    { mode: 'saved', label: 'Saved', icon: 'bookmark' },
  ];

  mode = signal<FeedMode>('feed');
  posts = signal<Post[]>([]);
  loading = signal(true);
  loadError = signal('');

  // composer
  body = '';
  privacy = 'public';
  file: File | null = null;
  previewUrl = signal('');
  posting = signal(false);
  formError = signal('');

  // suggestions
  suggestions = signal<User[]>([]);
  query = signal('');
  followed = signal<Set<string>>(new Set());
  private sugPage = 1;
  moreAvailable = signal(false);
  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q
      ? this.suggestions().filter((u) => `${u.name} ${u.username ?? ''}`.toLowerCase().includes(q))
      : this.suggestions();
  });

  firstName = () => this.auth.user()?.name?.split(' ')[0] ?? '';
  followersOf = (u: User): number | null =>
    typeof u.followersCount === 'number' ? u.followersCount : Array.isArray(u.followers) ? u.followers.length : null;

  ngOnInit(): void {
    if (!this.auth.user()) this.auth.loadProfile().subscribe({ error: () => {} });
    this.load();
    this.loadSuggestions();
  }

  setMode(m: FeedMode): void {
    if (this.mode() === m) return;
    this.mode.set(m);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.api.getPosts(this.mode()).subscribe({
      next: (list) => { this.posts.set(list); this.loading.set(false); },
      error: (e) => { this.loadError.set(errorMessage(e)); this.loading.set(false); },
    });
  }

  onFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
    this.previewUrl.set(this.file ? URL.createObjectURL(this.file) : '');
    input.value = '';
  }

  clearFile(): void {
    this.file = null;
    this.previewUrl.set('');
  }

  addFeeling(): void {
    this.body = (this.body + ' 😊').trimStart();
  }

  publish(): void {
    if (!this.body.trim() && !this.file) return;
    this.posting.set(true);
    this.formError.set('');
    this.api.createPost(this.body.trim(), this.file, this.privacy).subscribe({
      next: () => {
        this.body = '';
        this.clearFile();
        this.posting.set(false);
        this.load();
      },
      error: (e) => { this.formError.set(errorMessage(e)); this.posting.set(false); },
    });
  }

  onDeleted(id: string): void {
    this.posts.update((l) => l.filter((p) => p._id !== id));
  }

  // ---- suggested friends ----
  private loadSuggestions(): void {
    this.users.suggestions(this.sugPage, 10).subscribe({
      next: (list) => {
        this.suggestions.update((cur) => [...cur, ...list.filter((u) => !cur.some((c) => c._id === u._id))]);
        this.moreAvailable.set(list.length >= 10);
      },
      error: () => this.moreAvailable.set(false),
    });
  }

  loadMore(): void {
    this.sugPage += 1;
    this.loadSuggestions();
  }

  follow(u: User): void {
    const was = this.followed().has(u._id);
    this.toggleFollowed(u._id, !was);
    this.users.follow(u._id).subscribe({ error: () => this.toggleFollowed(u._id, was) });
  }

  private toggleFollowed(id: string, on: boolean): void {
    this.followed.update((s) => {
      const n = new Set(s);
      if (on) n.add(id); else n.delete(id);
      return n;
    });
  }
}
