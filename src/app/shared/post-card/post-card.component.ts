import { Component, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/http-error';
import { Post, authorId, authorOf } from '../../core/models';
import { PostsService } from '../../core/posts.service';
import { timeAgo } from '../../core/time';
import { AvatarComponent } from '../avatar/avatar.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-post-card',
  imports: [FormsModule, RouterLink, AvatarComponent, IconComponent],
  template: `
    <article class="card post">
      <header>
        <app-avatar [user]="author()" [size]="40" />
        <div class="who">
          <strong>{{ author()?.name ?? 'Unknown user' }}</strong>
          <span class="meta">
            @if (author()?.username) { <span>&#64;{{ author()?.username }}</span> · }
            <a class="time" [routerLink]="['/posts', post()._id]">{{ ago() }}</a> ·
            <app-icon name="globe" [size]="11" /> {{ privacyLabel() }}
          </span>
        </div>
        @if (isOwner()) {
          <div class="more">
            <button class="icon-btn" (click)="toggleMenu($event)" aria-label="Post options"><app-icon name="more" /></button>
            @if (menu()) {
              <div class="menu">
                <button (click)="startEdit()"><app-icon name="edit" [size]="15" /> Edit post</button>
                <button class="del" (click)="remove()"><app-icon name="trash" [size]="15" /> Delete post</button>
              </div>
            }
          </div>
        }
      </header>

      @if (error()) { <div class="alert error">{{ error() }}</div> }

      @if (editing()) {
        <textarea [(ngModel)]="draft" aria-label="Edit post"></textarea>
        <input type="file" accept="image/*" (change)="onFile($event)" class="file" />
        <div class="edit-actions">
          <button class="btn-primary blue auto" [disabled]="saving()" (click)="save()">{{ saving() ? 'Saving…' : 'Save' }}</button>
          <button class="btn-soft" (click)="editing.set(false)">Cancel</button>
        </div>
      } @else {
        @if (post().body) { <p class="body">{{ post().body }}</p> }
      }
      @if (post().image) { <img class="media" [src]="post().image" alt="Post image" /> }

      <div class="counts">
        <span>{{ likes() }} likes</span>
        <span>{{ post().commentsCount ?? post().comments?.length ?? 0 }} comments</span>
      </div>

      <footer>
        <button [class.on]="liked()" (click)="like()"><app-icon name="heart" /> Like</button>
        <a [routerLink]="['/posts', post()._id]"><app-icon name="comment" /> Comment</a>
        <button [class.on]="saved()" (click)="save2()"><app-icon name="bookmark" /> {{ saved() ? 'Saved' : 'Save' }}</button>
      </footer>
    </article>
  `,
  styles: [
    `
      .post { padding: 14px 16px 6px; margin-bottom: 16px; }
      header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
      .who { display: flex; flex-direction: column; flex: 1; min-width: 0; line-height: 1.25; }
      .who strong { color: var(--ink); font-size: 15px; }
      .meta { font-size: 12.5px; color: var(--muted); display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; }
      .time { color: var(--blue); font-weight: 600; }
      .more { position: relative; }
      .icon-btn { border: 0; background: none; color: var(--muted); padding: 6px; border-radius: 8px; cursor: pointer; }
      .icon-btn:hover { background: #f1f4fb; }
      .menu {
        position: absolute; right: 0; top: 100%; z-index: 5; min-width: 160px; background: #fff; padding: 6px;
        border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 10px 28px rgba(15, 30, 80, 0.14);
      }
      .menu button {
        display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 10px; border: 0; background: none;
        font: inherit; font-size: 14px; color: var(--text); border-radius: 8px; cursor: pointer;
      }
      .menu button:hover { background: #f1f5fd; }
      .menu .del { color: var(--danger); }
      .body { white-space: pre-wrap; margin: 2px 0 10px; font-size: 16px; color: var(--ink); }
      .media { width: calc(100% + 32px); margin: 0 -16px 8px; max-height: 520px; object-fit: cover; display: block; }
      textarea {
        width: 100%; min-height: 90px; font: inherit; padding: 12px; border: 1.5px solid #dfe6f6;
        border-radius: 12px; background: var(--field); outline: none; resize: vertical;
      }
      .file { margin-top: 8px; font-size: 13px; }
      .edit-actions { display: flex; gap: 8px; margin: 10px 0 8px; }
      .counts { display: flex; justify-content: space-between; font-size: 13px; color: var(--muted); padding: 6px 2px 10px; }
      footer { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--line); padding: 4px 0; }
      footer button, footer a {
        display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 9px; border: 0;
        background: none; font: inherit; font-weight: 600; font-size: 14.5px; color: var(--muted); cursor: pointer; border-radius: 10px;
      }
      footer button:hover, footer a:hover { background: #f3f6fc; }
      footer .on { color: var(--blue); }
    `,
  ],
})
export class PostCardComponent {
  private auth = inject(AuthService);
  private posts = inject(PostsService);

  post = input.required<Post>();
  /** Emitted after the post was edited, so the parent can reload. */
  changed = output<void>();
  /** Emitted after the post was deleted. */
  deleted = output<string>();

  menu = signal(false);
  editing = signal(false);
  saving = signal(false);
  error = signal('');
  draft = '';
  private file: File | null = null;

  // Local state so the UI reacts instantly to like / save.
  private likeOverride = signal<{ liked: boolean; count: number } | null>(null);
  private savedOverride = signal<boolean | null>(null);
  liked = computed(() => this.likeOverride()?.liked ?? !!this.post().isLiked);
  likes = computed(() => this.likeOverride()?.count ?? this.post().likesCount ?? 0);
  saved = computed(() => this.savedOverride() ?? !!(this.post().isBookmarked ?? this.post().bookmarked));

  author = computed(() => authorOf(this.post()));
  ago = computed(() => timeAgo(this.post().createdAt));
  privacyLabel = computed(() => {
    const p = this.post().privacy ?? 'public';
    return p.charAt(0).toUpperCase() + p.slice(1);
  });
  isOwner = computed(() => {
    const me = this.auth.user()?._id;
    return !!me && me === authorId(this.post());
  });

  toggleMenu(e: Event): void {
    e.stopPropagation();
    this.menu.update((v) => !v);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.menu.set(false);
  }

  like(): void {
    const wasLiked = this.liked();
    const count = this.likes();
    this.likeOverride.set({ liked: !wasLiked, count: Math.max(0, count + (wasLiked ? -1 : 1)) });
    this.posts.toggleLike(this.post()._id).subscribe({
      error: () => this.likeOverride.set({ liked: wasLiked, count }),
    });
  }

  save2(): void {
    const was = this.saved();
    this.savedOverride.set(!was);
    this.posts.toggleBookmark(this.post()._id).subscribe({
      error: () => this.savedOverride.set(was),
    });
  }

  startEdit(): void {
    this.draft = this.post().body ?? '';
    this.file = null;
    this.menu.set(false);
    this.editing.set(true);
  }

  onFile(e: Event): void {
    this.file = (e.target as HTMLInputElement).files?.[0] ?? null;
  }

  save(): void {
    if (!this.draft.trim() && !this.file && !this.post().image) return;
    this.saving.set(true);
    this.error.set('');
    this.posts.updatePost(this.post()._id, this.draft.trim(), this.file).subscribe({
      next: () => { this.saving.set(false); this.editing.set(false); this.changed.emit(); },
      error: (e) => { this.saving.set(false); this.error.set(errorMessage(e)); },
    });
  }

  remove(): void {
    this.menu.set(false);
    if (!confirm('Delete this post? This cannot be undone.')) return;
    this.posts.deletePost(this.post()._id).subscribe({
      next: () => this.deleted.emit(this.post()._id),
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
}
