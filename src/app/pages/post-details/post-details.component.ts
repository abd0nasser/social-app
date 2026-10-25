import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/http-error';
import { Comment, Post, authorId, authorOf } from '../../core/models';
import { PostsService } from '../../core/posts.service';
import { timeAgo } from '../../core/time';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { PostCardComponent } from '../../shared/post-card/post-card.component';

@Component({
  selector: 'app-post-details',
  imports: [FormsModule, RouterLink, AvatarComponent, IconComponent, PostCardComponent],
  template: `
    <main class="page narrow">
      <a routerLink="/feed" class="back"><app-icon name="arrowLeft" [size]="16" /> Back to feed</a>

      @if (loading()) {
        <div class="card empty-card">Loading…</div>
      } @else if (error() && !post()) {
        <div class="alert error">{{ error() }}</div>
      } @else if (post(); as p) {
        <app-post-card [post]="p" (changed)="reload()" (deleted)="goFeed()" />

        <section class="card comments">
          <h3>Comments ({{ comments().length }})</h3>

          @if (error()) { <div class="alert error">{{ error() }}</div> }

          <form class="new" (ngSubmit)="addComment()">
            <app-avatar [user]="auth.user()" [size]="36" />
            <input name="newComment" [(ngModel)]="newComment" placeholder="Write a comment…" autocomplete="off" />
            <button class="btn-primary blue auto" [disabled]="busy() || !newComment.trim()">
              <app-icon name="send" [size]="15" />
            </button>
          </form>

          @for (c of comments(); track c._id) {
            <div class="comment">
              <app-avatar [user]="who(c)" [size]="36" />
              <div class="main">
                @if (editingId() === c._id) {
                  <input name="edit-{{ c._id }}" [(ngModel)]="editDraft" class="edit" autocomplete="off" />
                  <div class="row-actions">
                    <button class="btn-primary blue auto small" (click)="saveEdit(c)">Save</button>
                    <button class="btn-soft" (click)="editingId.set('')">Cancel</button>
                  </div>
                } @else {
                  <div class="bubble">
                    <strong>{{ who(c)?.name ?? 'Unknown user' }}</strong>
                    <p>{{ c.content }}</p>
                  </div>
                  <div class="row-actions">
                    <span class="time">{{ ago(c.createdAt) }}</span>
                    @if (isMine(c)) {
                      <button (click)="startEdit(c)">Edit</button>
                    }
                    @if (isMine(c) || isPostOwner()) {
                      <button class="del" (click)="remove(c)">Delete</button>
                    }
                  </div>
                }
              </div>
            </div>
          } @empty {
            <p class="none">No comments yet — start the conversation.</p>
          }
        </section>
      }
    </main>
  `,
  styles: [
    `
      .back { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; margin-bottom: 14px; color: var(--text); }
      .comments { padding: 16px; }
      h3 { color: var(--ink); margin-bottom: 14px; font-size: 18px; }
      .new { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
      .new input, .edit {
        flex: 1; width: 100%; font: inherit; padding: 11px 14px; border: 1.5px solid #dfe6f6;
        border-radius: 999px; background: var(--field); outline: none;
      }
      .edit { border-radius: 12px; }
      .new input:focus, .edit:focus { border-color: var(--blue); background: #fff; }
      .comment { display: flex; gap: 10px; padding: 8px 0; }
      .main { flex: 1; min-width: 0; }
      .bubble { display: inline-block; background: #f1f4fb; border-radius: 16px; padding: 8px 14px; max-width: 100%; }
      .bubble strong { font-size: 14px; color: var(--ink); }
      .bubble p { white-space: pre-wrap; font-size: 15px; word-break: break-word; }
      .row-actions { display: flex; gap: 14px; align-items: center; margin: 4px 0 0 8px; }
      .row-actions button { border: 0; background: none; padding: 0; font: inherit; font-weight: 600; font-size: 12.5px; color: var(--muted); cursor: pointer; }
      .row-actions button:hover { color: var(--blue); }
      .row-actions .del:hover { color: var(--danger); }
      .time { font-size: 12.5px; color: var(--muted); }
      .small { padding: 7px 16px; font-size: 14px; }
      .none { text-align: center; color: var(--muted); padding: 18px 0 6px; }
    `,
  ],
})
export class PostDetailsComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(PostsService);
  private router = inject(Router);

  /** Bound from the route param thanks to withComponentInputBinding(). */
  id = input.required<string>();

  post = signal<Post | null>(null);
  comments = signal<Comment[]>([]);
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  editingId = signal('');

  newComment = '';
  editDraft = '';

  who = (c: Comment) => authorOf(c);
  ago = (d?: string) => timeAgo(d);
  isMine = (c: Comment) => !!this.auth.user()?._id && this.auth.user()!._id === authorId(c);
  isPostOwner = () => {
    const p = this.post();
    return !!p && !!this.auth.user()?._id && this.auth.user()!._id === authorId(p);
  };

  ngOnInit(): void {
    if (!this.auth.user()) this.auth.loadProfile().subscribe({ error: () => {} });
    this.reload();
  }

  reload(): void {
    this.api.getPost(this.id()).subscribe({
      next: (p) => {
        this.post.set(p);
        this.loading.set(false);
        this.loadComments();
      },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }

  private loadComments(): void {
    this.api.getComments(this.id()).subscribe({
      next: (list) => this.comments.set(list),
      error: (e) => this.error.set(errorMessage(e)),
    });
  }

  addComment(): void {
    const content = this.newComment.trim();
    if (!content) return;
    this.busy.set(true);
    this.error.set('');
    this.api.createComment(this.id(), content).subscribe({
      next: () => { this.newComment = ''; this.busy.set(false); this.loadComments(); },
      error: (e) => { this.error.set(errorMessage(e)); this.busy.set(false); },
    });
  }

  startEdit(c: Comment): void {
    this.editDraft = c.content;
    this.editingId.set(c._id);
  }

  saveEdit(c: Comment): void {
    const content = this.editDraft.trim();
    if (!content) return;
    this.api.updateComment(this.id(), c._id, content).subscribe({
      next: () => { this.editingId.set(''); this.loadComments(); },
      error: (e) => this.error.set(errorMessage(e)),
    });
  }

  remove(c: Comment): void {
    if (!confirm('Delete this comment?')) return;
    this.api.deleteComment(this.id(), c._id).subscribe({
      next: () => this.comments.update((l) => l.filter((x) => x._id !== c._id)),
      error: (e) => this.error.set(errorMessage(e)),
    });
  }

  goFeed(): void {
    this.router.navigateByUrl('/feed');
  }
}
