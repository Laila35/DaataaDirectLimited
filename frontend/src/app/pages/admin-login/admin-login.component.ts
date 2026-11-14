import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PageMetaService } from '../../core/page-meta.service';
import { ADMIN_LOGIN_SEO } from '../../core/site-seo';
import { DataGlobeComponent } from '../../shared/data-globe.component';

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule, RouterLink, DataGlobeComponent],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
})
export class AdminLoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(PageMetaService);
  readonly mode = signal<'in' | 'up'>('in');
  readonly error = signal('');
  readonly busy = signal(false);
  readonly departments = ['Data', 'Marketing', 'Technology', 'Support', 'Management', 'Other'];

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly signUp = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    employee_code: [''],
    department: ['Data', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(private auth: AuthService, private router: Router) {}

  setMode(next: 'in' | 'up') {
    if (this.mode() === next) return;
    this.mode.set(next);
    this.error.set('');
  }

  ngOnInit() {
    this.seo.apply(ADMIN_LOGIN_SEO);
    if (this.auth.user()?.role === 'admin') this.router.navigateByUrl('/admin');
  }

  submit() {
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    const value = this.form.getRawValue();
    this.auth.login(value.email ?? '', value.password ?? '', 'admin').subscribe({
      next: (res) => {
        if (res.user.role !== 'admin') {
          this.auth.logout();
          this.busy.set(false);
          this.error.set('This sign-in is for admin accounts.');
          return;
        }
        this.router.navigateByUrl('/admin');
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(typeof err.error?.detail === 'string' ? err.error.detail : 'Could not sign in.');
      },
    });
  }

  submitUp() {
    if (this.signUp.invalid) {
      this.signUp.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const value = this.signUp.getRawValue();
    this.auth.register({
      first_name: value.first_name ?? '',
      last_name: value.last_name ?? '',
      email: value.email ?? '',
      employee_code: value.employee_code ?? '',
      department: value.department ?? 'Other',
      password: value.password ?? '',
    }).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err) => {
        this.busy.set(false);
        this.error.set(typeof err.error?.detail === 'string' ? err.error.detail : 'Could not create the account.');
      },
    });
  }
}
