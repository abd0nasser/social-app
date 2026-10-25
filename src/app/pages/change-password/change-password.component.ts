import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/http-error';
import { IconComponent } from '../../shared/icon/icon.component';

const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function matchNew(group: AbstractControl): ValidationErrors | null {
  const a = group.get('newPassword')?.value;
  const b = group.get('confirm')?.value;
  return a && b && a !== b ? { mismatch: true } : null;
}

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <main class="page narrow">
      <form class="card box" [formGroup]="form" (ngSubmit)="submit()">
        <header>
          <span class="badge"><app-icon name="key" [size]="20" /></span>
          <div>
            <h1>Change Password</h1>
            <p>Keep your account secure by using a strong password.</p>
          </div>
        </header>

        @if (error()) { <div class="alert error">{{ error() }}</div> }
        @if (done()) { <div class="alert ok">Password updated successfully.</div> }

        <div class="plain-field">
          <label for="password">Current password</label>
          <input id="password" type="password" formControlName="password" placeholder="Enter current password" autocomplete="current-password" />
          @if (c.password.touched && c.password.invalid) { <div class="field-error" style="margin:5px 0 0">Current password is required.</div> }
        </div>

        <div class="plain-field">
          <label for="newPassword">New password</label>
          <input id="newPassword" type="password" formControlName="newPassword" placeholder="Enter new password" autocomplete="new-password" />
          <div class="hint" [class.bad]="c.newPassword.touched && c.newPassword.invalid">
            At least 8 characters with uppercase, lowercase, number, and special character.
          </div>
        </div>

        <div class="plain-field">
          <label for="confirm">Confirm new password</label>
          <input id="confirm" type="password" formControlName="confirm" placeholder="Re-enter new password" autocomplete="new-password" />
          @if (c.confirm.touched && form.hasError('mismatch')) { <div class="field-error" style="margin:5px 0 0">Passwords don't match.</div> }
        </div>

        <button class="btn-primary blue" [disabled]="loading() || form.invalid">
          {{ loading() ? 'Updating…' : 'Update password' }}
        </button>
      </form>
    </main>
  `,
  styles: [
    `
      .box { padding: 24px 22px 26px; margin-top: 8px; }
      header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
      .badge { width: 44px; height: 44px; border-radius: 50%; background: #e6f0ff; color: var(--blue); display: grid; place-items: center; flex: none; }
      h1 { font-size: 26px; font-weight: 700; color: var(--ink); line-height: 1.1; }
      header p { color: var(--muted); font-size: 14px; }
      .hint.bad { color: var(--danger); }
    `,
  ],
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = signal(false);
  error = signal('');
  done = signal(false);

  form = this.fb.nonNullable.group(
    {
      password: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.pattern(STRONG)]],
      confirm: ['', Validators.required],
    },
    { validators: matchNew },
  );
  get c() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    this.done.set(false);
    const { password, newPassword } = this.form.getRawValue();
    this.auth.changePassword(password, newPassword).subscribe({
      next: () => { this.loading.set(false); this.done.set(true); this.form.reset(); },
      error: (e) => { this.loading.set(false); this.error.set(errorMessage(e)); },
    });
  }
}
