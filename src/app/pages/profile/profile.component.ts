import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/http-error';
import { Post, countOf } from '../../core/models';
import { PostsService } from '../../core/posts.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { PostCardComponent } from '../../shared/post-card/post-card.component';

@Component({
  selector: 'app-profile',
  imports: [AvatarComponent, IconComponent, PostCardComponent],
  template: `
    <main class="page wide">
      <section class="cover"></section>

      <section class="card head">
        <div class="avatar-wrap">
          <app-avatar [user]="auth.user()" [size]="88" />
          <label class="cam" title="Change photo">
            <app-icon name="camera" [size]="15" />
            <input type="file" accept="image/*" hidden (change)="onPhoto($event)" />
          </label>
        </div>
        <div class="id">
          <h1>{{ auth.user()?.name ?? 'Your profile' }}</h1>
          @if (auth.user()?.username) { <p class="handle">&#64;{{ auth.user()?.username }}</p> }
          <span class="member"><app-icon name="users" [size]="14" /> Route Posts member</span>
        </div>
        <div class="stats">
          <div><span>Followers</span><b>{{ followers() }}</b></div>
          <div><span>Following</span><b>{{ following() }}</b></div>
          <div><span>Bookmarks</span><b>{{ bookmarks() }}</b></div>
        </div>
      </section>

      @if (msg()) { <div class="alert" [class.error]="isError()" [class.ok]="!isError()">{{ msg() }}</div> }
      @if (uploading()) { <div class="alert ok">Uploading photo…</div> }

      <section class="grid">
        <div class="card about">
          <h3>About</h3>
          @if (auth.user()?.email) { <p><app-icon name="mail" [size]="16" /> {{ auth.user()?.email }}</p> }
          <p><app-icon name="users" [size]="16" /> Active on Route Posts</p>
        </div>
        <div class="mini">
          <div class="card"><span>My posts</span><b>{{ posts().length }}</b></div>
          <div class="card"><span>Saved posts</span><b>{{ bookmarks() }}</b></div>
        </div>
      </section>

      <h2 class="title">My posts</h2>
      <div class="posts">
        @if (loading()) {
          <div class="card empty-card">Loading…</div>
        } @else {
          @for (p of posts(); track p._id) {
            <app-post-card [post]="p" (changed)="load()" (deleted)="onDeleted($event)" />
          } @empty {
            <div class="card empty-card">You haven't posted anything yet.</div>
          }
        }
      </div>
    </main>
  `,
  styles: [
    `
      .page { padding-top: 18px; }
      .cover {
        height: 230px; border-radius: 26px 26px 0 0;
        background: linear-gradient(110deg, #1c2b4f 0%, #2f4b78 45%, #6c93bd 100%);
      }
      .head {
        position: relative; margin: -56px 24px 16px; padding: 22px 26px; border-radius: 26px;
        display: flex; align-items: center; gap: 22px; flex-wrap: wrap;
      }
      .avatar-wrap { position: relative; padding: 4px; background: #fff; border-radius: 50%; box-shadow: 0 0 0 2px #cfe1f7; }
      .cam {
        position: absolute; right: 0; bottom: 0; width: 28px; height: 28px; border-radius: 50%; display: grid;
        place-items: center; background: var(--navy); color: #fff; cursor: pointer; border: 2px solid #fff;
      }
      .id { flex: 1; min-width: 180px; }
      h1 { font-size: 34px; font-weight: 900; color: var(--ink); line-height: 1.1; }
      .handle { color: var(--muted); font-size: 18px; margin: 2px 0 8px; }
      .member {
        display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px;
        background: #e8f0ff; color: var(--navy); font-weight: 600; font-size: 13px;
      }
      .stats { display: flex; gap: 12px; }
      .stats div {
        min-width: 130px; text-align: center; padding: 14px 10px; border: 1px solid var(--line); border-radius: 14px; background: #fff;
      }
      .stats span, .mini span { display: block; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
      .stats b { font-size: 30px; color: var(--ink); line-height: 1.2; }
      .grid { display: grid; grid-template-columns: 1fr 300px; gap: 14px; margin: 0 24px 20px; }
      .about { padding: 18px 20px; min-height: 130px; }
      .about h3 { color: var(--ink); margin-bottom: 10px; }
      .about p { display: flex; align-items: center; gap: 10px; color: var(--text); margin: 6px 0; }
      .mini { display: flex; flex-direction: column; gap: 12px; }
      .mini .card { padding: 14px 18px; background: #f5f8ff; }
      .mini b { font-size: 26px; color: var(--ink); }
      .title { margin: 0 24px 12px; font-size: 22px; color: var(--ink); }
      .posts { max-width: 640px; margin: 0 auto; }
      @media (max-width: 800px) {
        .head { margin: -40px 8px 14px; }
        .grid { grid-template-columns: 1fr; margin: 0 8px 16px; }
        .stats { width: 100%; } .stats div { flex: 1; min-width: 0; }
        .title { margin-left: 8px; }
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(PostsService);

  posts = signal<Post[]>([]);
  loading = signal(true);
  uploading = signal(false);
  msg = signal('');
  isError = signal(false);

  followers = () => countOf(this.auth.user(), 'followers');
  following = () => countOf(this.auth.user(), 'following');
  bookmarks = () => countOf(this.auth.user(), 'bookmarks');

  ngOnInit(): void {
    this.auth.loadProfile().subscribe({ error: () => {} });
    this.load();
  }

  load(): void {
    this.api.getPosts('mine').subscribe({
      next: (l) => { this.posts.set(l); this.loading.set(false); },
      error: (e) => { this.flash(errorMessage(e), true); this.loading.set(false); },
    });
  }

  onPhoto(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.msg.set('');
    this.auth.uploadPhoto(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.flash('Profile photo updated.', false);
        this.auth.loadProfile().subscribe({ error: () => {} });
      },
      error: (err) => { this.uploading.set(false); this.flash(errorMessage(err), true); },
    });
    input.value = '';
  }

  onDeleted(id: string): void {
    this.posts.update((l) => l.filter((p) => p._id !== id));
  }

  private flash(text: string, error: boolean): void {
    this.msg.set(text);
    this.isError.set(error);
  }
}
