import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { AboutPage, ApplicationRow, Employee, FaqItem, Job, ReviewItem, Stats } from '../../core/models';
import { ABOUT_DEFAULTS } from '../../shared/about-defaults';
type Panel = 'overview' | 'applications' | 'employees' | 'jobs' | 'about' | 'faqs' | 'reviews' | 'settings';
@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly panel = signal<Panel>('overview');
  readonly stats = signal<Stats | null>(null);
  readonly applications = signal<ApplicationRow[]>([]);
  readonly selectedId = signal<number | null>(null);
  readonly selected = computed(() => this.applications().find((row) => row.id === this.selectedId()) ?? null);
  readonly recentApps = computed(() => this.applications().slice(0, 5));
  readonly openRoles = computed(() => this.jobs().filter((job) => !job.closed).slice(0, 5));
  readonly team = computed(() => this.employees().slice(0, 6));
  readonly statCards = computed(() => {
    const stats = this.stats();
    return [
      { label: 'Open roles', value: stats?.open_roles ?? 0, panel: 'jobs' as Panel },
      { label: 'New applications', value: stats?.new_applications ?? 0, panel: 'applications' as Panel },
      { label: 'Applications', value: stats?.applications ?? 0, panel: 'applications' as Panel },
      { label: 'Employees', value: stats?.employees ?? 0, panel: 'employees' as Panel },
    ];
  });
  readonly pipeline = computed(() => {
    const rows = this.applications();
    const total = Math.max(rows.length, 1);
    return this.statuses.map((status) => {
      const count = rows.filter((row) => row.status === status).length;
      return { status, count, share: Math.round((count / total) * 100) };
    });
  });
  readonly employees = signal<Employee[]>([]);
  readonly jobs = signal<Job[]>([]);
  readonly faqs = signal<FaqItem[]>([]);
  readonly reviews = signal<ReviewItem[]>([]);
  readonly editingJob = signal<number | null>(null);
  readonly editingFaq = signal<number | null>(null);
  readonly editingReview = signal<number | null>(null);
  readonly notice = signal('');
  readonly statuses = ['New', 'Review', 'Interview', 'Hired', 'Rejected'];
  readonly levels = ['Entry level', 'Mid level', 'Senior'];
  readonly types = ['Full-time', 'Part-time', 'Contract'];
  readonly workplaces = ['Remote', 'Hybrid', 'On site'];
  readonly labels: Record<Panel, string> = {
    overview: 'Overview',
    applications: 'Applications',
    employees: 'Employees',
    jobs: 'Job posts',
    about: 'About us',
    faqs: 'FAQs',
    reviews: 'Reviews',
    settings: 'Settings',
  };
  readonly employeeForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    department: ['Data', Validators.required],
    role_title: ['', Validators.required],
    status: ['Active'],
  });
  readonly jobForm = this.fb.group({
    title: ['', Validators.required],
    department: ['Technology', Validators.required],
    employment_type: ['Full-time', Validators.required],
    level: ['Mid level', Validators.required],
    workplace: ['Hybrid', Validators.required],
    opens_at: ['', Validators.required],
    closes_at: ['', Validators.required],
    summary: ['', Validators.required],
    responsibilities: [''],
    requirements: [''],
  });
  readonly aboutForm = this.fb.group({
    kicker: [ABOUT_DEFAULTS.kicker, Validators.required],
    title: [ABOUT_DEFAULTS.title, Validators.required],
    intro: [ABOUT_DEFAULTS.intro, Validators.required],
    detail: [ABOUT_DEFAULTS.detail],
    work_title: [ABOUT_DEFAULTS.work_title, Validators.required],
    steps: this.fb.array(ABOUT_DEFAULTS.steps.map((step) => this.stepGroup(step.title, step.text))),
  });
  readonly faqForm = this.fb.group({
    question: ['', Validators.required],
    answer: ['', Validators.required],
  });
  readonly reviewForm = this.fb.group({
    quote: ['', Validators.required],
    role: ['', Validators.required],
    place: [''],
    stars: [5, Validators.required],
  });
  readonly starChoices = [5, 4, 3, 2, 1];
  readonly settingsForm = this.fb.group({
    company_name: ['', Validators.required],
    accent: ['#a384f5', Validators.required],
    contact_email: ['', [Validators.required, Validators.email]],
    careers_open: [true],
  });
  constructor(private api: ApiService, readonly auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.refresh();
  }
  refresh() {
    this.api.stats().subscribe((row) => this.stats.set(row));
    this.api.applications().subscribe((rows) => {
      this.applications.set(rows);
      const current = this.selectedId();
      if (!rows.some((row) => row.id === current)) this.selectedId.set(rows[0]?.id ?? null);
    });
    this.api.employees().subscribe((rows) => this.employees.set(rows));
    this.api.jobs(true).subscribe((rows) => this.jobs.set(rows));
    this.api.about().subscribe((page) => this.fillAbout(page));
    this.api.faqs().subscribe((rows) => this.faqs.set(rows));
    this.api.reviews().subscribe((rows) => this.reviews.set(rows));
    this.api.settings().subscribe((row) => this.settingsForm.patchValue(row));
  }
  get aboutSteps(): FormArray {
    return this.aboutForm.controls.steps;
  }
  private stepGroup(title = '', text = '') {
    return this.fb.group({
      title: [title, Validators.required],
      text: [text, Validators.required],
    });
  }
  private fillAbout(page: AboutPage) {
    this.aboutForm.patchValue({
      kicker: page.kicker,
      title: page.title,
      intro: page.intro,
      detail: page.detail,
      work_title: page.work_title,
    });
    this.aboutSteps.clear();
    page.steps.forEach((step) => this.aboutSteps.push(this.stepGroup(step.title, step.text)));
  }
  addAboutStep() {
    this.aboutSteps.push(this.stepGroup());
  }
  removeAboutStep(index: number) {
    this.aboutSteps.removeAt(index);
  }
  setStatus(row: ApplicationRow, status: string) {
    this.api.updateApplication(row.id, status).subscribe(() => this.refresh());
  }
  removeApplication(row: ApplicationRow) {
    this.api.deleteApplication(row.id).subscribe(() => this.refresh());
  }
  initials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
  }
  openApplication(row: ApplicationRow) {
    this.selectedId.set(row.id);
    this.panel.set('applications');
  }
  show(value: string) {
    return value?.trim() ? value : '—';
  }
  linkHref(value: string) {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }
  cvLabel(name: string) {
    return name.replace(/^\d+_/, '') || 'CV';
  }
  downloadCv(row: ApplicationRow) {
    this.notice.set('');
    this.api.downloadCv(row.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.cvLabel(row.cv_filename);
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.notice.set('The CV file could not be downloaded.'),
    });
  }
  addEmployee() {
    if (this.employeeForm.invalid) return;
    const value = this.employeeForm.getRawValue();
    this.api.createEmployee({
      name: value.name ?? '',
      email: value.email ?? '',
      department: value.department ?? '',
      role_title: value.role_title ?? '',
      status: value.status ?? 'Active',
    }).subscribe(() => {
      this.employeeForm.reset({ department: 'Data', status: 'Active' });
      this.refresh();
    });
  }
  removeEmployee(row: Employee) {
    this.api.deleteEmployee(row.id).subscribe(() => this.refresh());
  }
  editJob(job: Job) {
    this.editingJob.set(job.id);
    this.panel.set('jobs');
    this.jobForm.patchValue({
      title: job.title,
      department: job.department,
      employment_type: job.employment_type,
      level: job.level,
      workplace: job.workplace,
      opens_at: job.opens_at,
      closes_at: job.closes_at,
      summary: job.summary,
      responsibilities: job.responsibilities.join('\n'),
      requirements: job.requirements.join('\n'),
    });
  }
  clearJob() {
    this.editingJob.set(null);
    this.jobForm.reset({
      department: 'Technology',
      employment_type: 'Full-time',
      level: 'Mid level',
      workplace: 'Hybrid',
      opens_at: '',
      closes_at: '',
      responsibilities: '',
      requirements: '',
    });
  }
  saveJob() {
    this.notice.set('');
    if (this.jobForm.invalid) {
      this.jobForm.markAllAsTouched();
      this.notice.set('Add a title, the opening time, the closing time, and a summary before posting.');
      return;
    }
    const value = this.jobForm.getRawValue();
    const lines = (text: string | null) => (text ?? '').split('\n').map((line) => line.trim()).filter(Boolean);
    const id = this.editingJob();
    const body = {
      title: value.title ?? '',
      department: value.department ?? '',
      employment_type: value.employment_type ?? 'Full-time',
      level: value.level ?? 'Mid level',
      workplace: value.workplace ?? 'Hybrid',
      opens_at: value.opens_at ?? '',
      closes_at: value.closes_at ?? '',
      summary: value.summary ?? '',
      responsibilities: lines(value.responsibilities),
      requirements: lines(value.requirements),
      active: true,
    };
    const request = id ? this.api.updateJob(id, body) : this.api.createJob(body);
    request.subscribe({
      next: () => {
        this.notice.set('Job post saved. It stays open only until the closing time, then it remains closed.');
        this.clearJob();
        this.refresh();
      },
      error: (err) => this.notice.set(typeof err.error?.detail === 'string' ? err.error.detail : 'The job could not be posted.'),
    });
  }
  editFaq(item: FaqItem) {
    this.editingFaq.set(item.id);
    this.panel.set('faqs');
    this.faqForm.patchValue({ question: item.question, answer: item.answer });
  }
  clearFaq() {
    this.editingFaq.set(null);
    this.faqForm.reset();
  }
  saveFaq() {
    this.notice.set('');
    if (this.faqForm.invalid) {
      this.faqForm.markAllAsTouched();
      this.notice.set('Add a question and an answer.');
      return;
    }
    const value = this.faqForm.getRawValue();
    const body = { question: value.question ?? '', answer: value.answer ?? '' };
    const id = this.editingFaq();
    const request = id ? this.api.updateFaq(id, body) : this.api.createFaq(body);
    request.subscribe({
      next: () => {
        this.notice.set(id ? 'FAQ updated.' : 'FAQ added.');
        this.clearFaq();
        this.refresh();
      },
      error: (err) => this.notice.set(typeof err.error?.detail === 'string' ? err.error.detail : 'The FAQ could not be saved.'),
    });
  }
  removeFaq(item: FaqItem) {
    this.api.deleteFaq(item.id).subscribe(() => {
      if (this.editingFaq() === item.id) this.clearFaq();
      this.notice.set('FAQ removed.');
      this.refresh();
    });
  }
  editReview(item: ReviewItem) {
    this.editingReview.set(item.id);
    this.panel.set('reviews');
    this.reviewForm.patchValue({ quote: item.quote, role: item.role, place: item.place, stars: item.stars });
  }
  clearReview() {
    this.editingReview.set(null);
    this.reviewForm.reset({ stars: 5, place: '' });
  }
  saveReview() {
    this.notice.set('');
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      this.notice.set('Add the review and the person’s role.');
      return;
    }
    const value = this.reviewForm.getRawValue();
    const body = {
      quote: value.quote ?? '',
      role: value.role ?? '',
      place: value.place ?? '',
      stars: Number(value.stars ?? 5),
    };
    const id = this.editingReview();
    const request = id ? this.api.updateReview(id, body) : this.api.createReview(body);
    request.subscribe({
      next: () => {
        this.notice.set(id ? 'Review updated.' : 'Review added.');
        this.clearReview();
        this.refresh();
      },
      error: (err) => this.notice.set(typeof err.error?.detail === 'string' ? err.error.detail : 'The review could not be saved.'),
    });
  }
  removeReview(item: ReviewItem) {
    this.api.deleteReview(item.id).subscribe(() => {
      if (this.editingReview() === item.id) this.clearReview();
      this.notice.set('Review removed.');
      this.refresh();
    });
  }
  starLine(count: number) {
    const stars = Math.max(0, Math.min(5, count || 0));
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }
  saveAbout() {
    if (this.aboutForm.invalid) {
      this.aboutForm.markAllAsTouched();
      this.notice.set('Fill in the About us fields.');
      return;
    }
    const value = this.aboutForm.getRawValue();
    const steps = (value.steps ?? []).map((step, index) => ({
      n: String(index + 1),
      title: step.title ?? '',
      text: step.text ?? '',
    }));
    this.api.saveAbout({
      kicker: value.kicker ?? '',
      title: value.title ?? '',
      intro: value.intro ?? '',
      detail: value.detail ?? '',
      work_title: value.work_title ?? '',
      steps,
    }).subscribe({
      next: () => this.notice.set('About us saved. The public page is updated.'),
      error: (err) => this.notice.set(typeof err.error?.detail === 'string' ? err.error.detail : 'About us could not be saved.'),
    });
  }
  closeJob(job: Job) {
    this.api.closeJob(job.id).subscribe(() => this.refresh());
  }
  saveSettings() {
    if (this.settingsForm.invalid) return;
    const value = this.settingsForm.getRawValue();
    this.api.saveSettings({
      company_name: value.company_name ?? '',
      accent: value.accent ?? '#a384f5',
      contact_email: value.contact_email ?? '',
      careers_open: !!value.careers_open,
    }).subscribe({
      next: () => this.notice.set('Settings saved.'),
      error: (err) => this.notice.set(typeof err.error?.detail === 'string' ? err.error.detail : 'Could not save settings.'),
    });
  }
  signOut() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
