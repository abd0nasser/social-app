import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/http-error';
import { IconComponent } from '../../shared/icon/icon.component';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value;
  const r = group.get('rePassword')?.value;
  return p && r && p !== r ? { mismatch: true } : null;
}

const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <main class="auth">
      <section class="hero">
        <h1>Route Posts</h1>
        <p class="tag">Connect with friends and the world around you on Route Posts.</p>

        <div class="about card">
          <span class="eyebrow">About Route Academy</span>
          <h3>Egypt's Leading IT Training Center Since 2012</h3>
          <p>
            Route Academy is the premier IT training center in Egypt, established in 2012. We specialize in delivering
            high-quality training courses in programming, web development, and application development. We've
            identified the unique challenges people may face when learning new technology and made efforts to provide
            strategies to overcome them.
          </p>
          <div class="stats">
            <div><b>2012</b><span>Founded</span></div>
            <div><b>40K+</b><span>Graduates</span></div>
            <div><b>50+</b><span>Partner companies</span></div>
            <div><b>5</b><span>Branches</span></div>
            <div><b>20</b><span>Diplomas available</span></div>
          </div>
        </div>
      </section>

      <section class="panel card">
        <div class="tabs" role="tablist">
          <button role="tab" [class.on]="tab() === 'login'" (click)="switchTab('login')">Login</button>
          <button role="tab" [class.on]="tab() === 'register'" (click)="switchTab('register')">Register</button>
        </div>

        @if (notice()) { <div class="alert ok">{{ notice() }}</div> }
        @if (error()) { <div class="alert error">{{ error() }}</div> }

        @if (tab() === 'login') {
          <h2>Log in to Route Posts</h2>
          <p class="sub">Log in and continue your social journey.</p>

          <form [formGroup]="loginForm" (ngSubmit)="doLogin()">
            <div class="input-wrap" [class.invalid]="l.login.touched && l.login.invalid">
              <app-icon name="user" />
              <input formControlName="login" placeholder="Email or username" autocomplete="username" />
            </div>
            <div class="input-wrap" [class.invalid]="l.password.touched && l.password.invalid">
              <app-icon name="key" />
              <input type="password" formControlName="password" placeholder="Password" autocomplete="current-password" />
            </div>
            <button class="btn-primary" [disabled]="loading()">{{ loading() ? 'Please wait...' : 'Log In' }}</button>
          </form>
          <a class="forgot" href="javascript:void(0)">Forgot password?</a>
        } @else {
          <h2>Create a new account</h2>
          <p class="sub">It is quick and easy.</p>

          <form [formGroup]="regForm" (ngSubmit)="doRegister()">
            <div class="input-wrap" [class.invalid]="r.name.touched && r.name.invalid">
              <app-icon name="user" />
              <input formControlName="name" placeholder="Full name" autocomplete="name" />
            </div>
            @if (r.name.touched && r.name.invalid) { <div class="field-error">Full name is required (3+ characters).</div> }

            <div class="input-wrap">
              <app-icon name="at" />
              <input formControlName="username" placeholder="Username (optional)" autocomplete="username" />
            </div>

            <div class="input-wrap" [class.invalid]="r.email.touched && r.email.invalid">
              <app-icon name="at" />
              <input type="email" formControlName="email" placeholder="Email address" autocomplete="email" />
            </div>
            @if (r.email.touched && r.email.invalid) { <div class="field-error">Enter a valid email address.</div> }

            <div class="input-wrap" [class.invalid]="r.gender.touched && r.gender.invalid">
              <app-icon name="users" />
              <select formControlName="gender">
                <option value="" disabled>Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div class="input-wrap" [class.invalid]="r.dateOfBirth.touched && r.dateOfBirth.invalid">
              <app-icon name="calendar" />
              <input type="date" formControlName="dateOfBirth" />
            </div>

            <div class="input-wrap" [class.invalid]="r.password.touched && r.password.invalid">
              <app-icon name="key" />
              <input type="password" formControlName="password" placeholder="Password" autocomplete="new-password" />
            </div>
            @if (r.password.touched && r.password.invalid) {
              <div class="field-error">At least 8 characters with uppercase, lowercase, number, and special character.</div>
            }

            <div class="input-wrap" [class.invalid]="r.rePassword.touched && regForm.hasError('mismatch')">
              <app-icon name="key" />
              <input type="password" formControlName="rePassword" placeholder="Confirm password" autocomplete="new-password" />
            </div>
            @if (r.rePassword.touched && regForm.hasError('mismatch')) { <div class="field-error">Passwords don't match.</div> }

            <button class="btn-primary" [disabled]="loading()">{{ loading() ? 'Please wait...' : 'Create Account' }}</button>
          </form>
        }
      </section>
    </main>
  `,
  styles: [
    `
      .auth {
        max-width: 1120px; margin: 0 auto; padding: 56px 24px; min-height: 100vh;
        display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 56px; align-items: center;
      }
      h1 { font-size: 58px; line-height: 1; font-weight: 900; color: var(--navy); letter-spacing: -0.01em; }
      .tag { font-size: 26px; color: var(--ink); margin: 14px 0 26px; line-height: 1.3; max-width: 480px; }
      .about { padding: 22px 24px; max-width: 520px; background: linear-gradient(#fff, #f8faff); }
      .eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--navy); }
      .about h3 { font-size: 19px; color: var(--ink); margin: 8px 0; }
      .about p { font-size: 13.5px; color: var(--text); line-height: 1.6; }
      .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 16px; }
      .stats div {
        background: #f3f7ff; border: 1px solid #dbe5fb; border-radius: 12px; padding: 10px 12px;
        display: flex; flex-direction: column;
      }
      .stats b { font-size: 17px; color: var(--ink); }
      .stats span { font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }

      .panel { padding: 20px 20px 24px; }
      .tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: #eef1f8; padding: 4px; border-radius: 12px; margin-bottom: 22px; }
      .tabs button {
        border: 0; background: none; font: inherit; font-weight: 700; font-size: 14.5px; padding: 10px;
        border-radius: 9px; color: var(--text); cursor: pointer;
      }
      .tabs button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 4px rgba(20, 40, 100, 0.12); }
      h2 { font-size: 25px; font-weight: 700; color: var(--ink); }
      .sub { color: var(--muted); font-size: 14px; margin: 2px 0 18px; }
      form { display: block; }
      .btn-primary { margin-top: 6px; }
      .forgot { display: block; text-align: center; margin-top: 18px; font-size: 14.5px; font-weight: 600; }

      @media (max-width: 900px) {
        .auth { grid-template-columns: 1fr; gap: 28px; padding: 28px 16px; }
        h1 { font-size: 42px; }
        .tag { font-size: 20px; }
      }
    `,
  ],
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  tab = signal<'login' | 'register'>('login');
  loading = signal(false);
  error = signal('');
  notice = signal('');

  loginForm = this.fb.nonNullable.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  regForm = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      username: [''],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      password: ['', [Validators.required, Validators.pattern(STRONG)]],
      rePassword: ['', Validators.required],
    },
    { validators: matchPasswords },
  );

  get l() { return this.loginForm.controls; }
  get r() { return this.regForm.controls; }

  switchTab(t: 'login' | 'register'): void {
    this.tab.set(t);
    this.error.set('');
    this.notice.set('');
  }

  doLogin(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    this.notice.set('');
    const { login, password } = this.loginForm.getRawValue();
    this.auth.login(login, password).subscribe({
      next: () => this.router.navigateByUrl('/feed'),
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }

  doRegister(): void {
    if (this.regForm.invalid) { this.regForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const body: Record<string, unknown> = { ...this.regForm.getRawValue() };
    if (!body['username']) delete body['username']; // username is optional
    this.auth.signup(body).subscribe({
      next: () => {
        this.loading.set(false);
        this.regForm.reset({ gender: '' });
        this.switchTab('login');
        this.notice.set('Account created! You can log in now.');
      },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }
}
