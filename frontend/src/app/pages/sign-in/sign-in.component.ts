import { Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PageMetaService } from '../../core/page-meta.service';
import { ADMIN_LOGIN_SEO, SIGN_IN_SEO } from '../../core/site-seo';
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
  private readonly location = inject(Location);
  private readonly seo = inject(PageMetaService);
  readonly portal = signal<'employee' | 'admin'>('employee');
  readonly mode = signal<'in' | 'up'>('in');
  readonly error = signal('');
  readonly busy = signal(false);
  readonly departments = ['Data', 'Marketing', 'Technology', 'Support', 'Management', 'Other'];

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
    employee_code: [''],
    department: ['Data', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const initial = this.route.snapshot.data['portal'] === 'admin' ? 'admin' : 'employee';
    this.portal.set(initial);
    this.seo.apply(initial === 'admin' ? ADMIN_LOGIN_SEO : SIGN_IN_SEO);
    if (initial === 'admin' && this.auth.user()?.role === 'admin') this.router.navigateByUrl('/admin');
  }

  setPortal(next: 'employee' | 'admin') {
    if (this.portal() === next) return;
    this.portal.set(next);
    this.mode.set('in');
    this.error.set('');
    this.busy.set(false);
    this.location.replaceState(next === 'admin' ? '/admin/login' : '/sign-in');
    this.seo.apply(next === 'admin' ? ADMIN_LOGIN_SEO : SIGN_IN_SEO);
  }

  setMode(next: 'in' | 'up') {
    if (this.mode() === next) return;
    this.mode.set(next);
    this.error.set('');
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
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(typeof err.error?.detail === 'string' ? err.error.detail : 'Could not sign in.');
      },
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
