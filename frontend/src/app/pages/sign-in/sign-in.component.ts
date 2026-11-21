import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PageMetaService } from '../../core/page-meta.service';
import { ADMIN_LOGIN_SEO, RESET_SEO, SIGN_IN_SEO } from '../../core/site-seo';
import { DataGlobeComponent } from '../../shared/data-globe.component';


@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, RouterLink, DataGlobeComponent],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
})
export class SignInComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(PageMetaService);
  readonly portal = signal<'employee' | 'admin'>('employee');
  readonly mode = signal<'in' | 'up' | 'forgot' | 'reset'>('in');
  readonly error = signal('');
  readonly notice = signal('');
  readonly busy = signal(false);
  private resetToken = '';

  readonly signIn = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly adminIn = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly signUp = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  });

  readonly adminUp = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  });

  readonly forgot = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly resetForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  });

  constructor(private auth: AuthService, private router: Router) {}

  private staffDestination() {
    return this.route.snapshot.queryParamMap.get('next') === '/gallery' ? '/gallery' : '/';
  }

  ngOnInit() {
    if (this.route.snapshot.data['view'] === 'reset') {
      this.mode.set('reset');
      this.resetToken = this.route.snapshot.queryParamMap.get('token') ?? '';
      this.seo.apply(RESET_SEO);
      if (!this.resetToken) this.error.set('This reset link is missing. Ask for a new one from the sign-in page.');
      return;
    }
    const initial = this.route.snapshot.data['portal'] === 'admin' ? 'admin' : 'employee';
    this.portal.set(initial);
    this.seo.apply(initial === 'admin' ? ADMIN_LOGIN_SEO : SIGN_IN_SEO);
    if (initial === 'admin' && this.auth.user()?.role === 'admin') this.router.navigateByUrl('/admin');
  }

  setMode(next: 'in' | 'up' | 'forgot') {
    if (this.mode() === next) return;
    this.mode.set(next);
    this.error.set('');
    this.notice.set('');
  }

  private mismatch(left: string, right: string) {
    if (left === right) return false;
    this.busy.set(false);
    this.error.set('The two passwords do not match.');
    return true;
  }

  private fail(err: { error?: { detail?: unknown } }, fallback: string) {
    this.busy.set(false);
    this.error.set(typeof err.error?.detail === 'string' ? err.error.detail : fallback);
  }

  submitIn() {
    if (this.signIn.invalid) {
      this.signIn.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const value = this.signIn.getRawValue();
    this.auth.login(value.email ?? '', value.password ?? '', 'staff').subscribe({
      next: (res) => {
        if (res.user.role !== 'employee') {
          this.auth.logout();
          this.busy.set(false);
          this.error.set('This form is for active staff only. Use Admin login for an admin account.');
          return;
        }
        this.router.navigateByUrl(this.staffDestination());
      },
      error: (err) => this.fail(err, 'Could not sign in.'),
    });
  }

  submitAdmin() {
    this.error.set('');
    if (this.adminIn.invalid) {
      this.adminIn.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    const value = this.adminIn.getRawValue();
    this.auth.login(value.email ?? '', value.password ?? '', 'admin').subscribe({
      next: (res) => {
        if (res.user.role !== 'admin') {
          this.auth.logout();
          this.busy.set(false);
          this.error.set('This sign-in is for admin accounts. Use Employee login for a staff account.');
          return;
        }
        this.router.navigateByUrl('/admin');
      },
      error: (err) => this.fail(err, 'Could not sign in.'),
    });
  }

  submitUp() {
    if (this.signUp.invalid) {
      this.signUp.markAllAsTouched();
      return;
    }
    const value = this.signUp.getRawValue();
    this.busy.set(true);
    this.error.set('');
    if (this.mismatch(value.password ?? '', value.confirm ?? '')) return;
    this.auth.register({
      first_name: value.first_name ?? '',
      last_name: value.last_name ?? '',
      email: value.email ?? '',
      employee_code: '',
      department: '',
      password: value.password ?? '',
      role: 'employee',
    }).subscribe({
      next: () => this.router.navigateByUrl(this.staffDestination()),
      error: (err) => this.fail(err, 'Could not create the account.'),
    });
  }

  submitAdminUp() {
    if (this.adminUp.invalid) {
      this.adminUp.markAllAsTouched();
      return;
    }
    const value = this.adminUp.getRawValue();
    this.busy.set(true);
    this.error.set('');
    if (this.mismatch(value.password ?? '', value.confirm ?? '')) return;
    this.auth.register({
      first_name: value.first_name ?? '',
      last_name: value.last_name ?? '',
      email: value.email ?? '',
      employee_code: '',
      department: 'Management',
      password: value.password ?? '',
      role: 'admin',
    }).subscribe({
      next: () => this.router.navigateByUrl('/admin'),
      error: (err) => this.fail(err, 'Could not create the account.'),
    });
  }

  submitForgot() {
    if (this.forgot.invalid) {
      this.forgot.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    this.auth.forgot(this.forgot.getRawValue().email ?? '').subscribe({
      next: (res) => {
        this.busy.set(false);
        this.notice.set(res.message);
      },
      error: (err) => this.fail(err, 'Could not send the reset email.'),
    });
  }

  submitReset() {
    if (!this.resetToken) {
      this.error.set('This reset link is missing. Ask for a new one from the sign-in page.');
      return;
    }
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    const value = this.resetForm.getRawValue();
    this.busy.set(true);
    this.error.set('');
    if (this.mismatch(value.password ?? '', value.confirm ?? '')) return;
    this.auth.reset(this.resetToken, value.password ?? '').subscribe({
      next: (res) => this.router.navigateByUrl(res.user.role === 'admin' ? '/admin' : this.staffDestination()),
      error: (err) => this.fail(err, 'Could not update the password.'),
    });
  }
}
