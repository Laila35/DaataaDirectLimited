import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { ApplicationRow, Job } from '../core/models';
@Component({
  selector: 'app-apply-form',
  imports: [ReactiveFormsModule],
  templateUrl: './apply-form.component.html',
  styleUrl: './apply-form.component.css',
})
export class ApplyFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  @Input() jobs: Job[] = [];
  @Input() position = '';
  @Output() sent = new EventEmitter<ApplicationRow>();
  readonly formError = signal('');
  readonly result = signal<ApplicationRow | null>(null);
  readonly cvName = signal('');
  readonly dragOver = signal(false);
  private cv: File | null = null;
  readonly experienceOptions = ['Less than 1 year', '1 to 3 years', '3 to 5 years', '5 to 10 years', 'More than 10 years'];
  readonly heardOptions = ['Website', 'LinkedIn', 'Referral', 'Job board', 'Social media', 'Other'];
  readonly form = this.fb.group({
    position: ['', Validators.required],
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    street: ['', Validators.required],
    city: ['', Validators.required],
    region: [''],
    postal_code: [''],
    country: ['', Validators.required],
    linkedin: [''],
    website: [''],
    github: [''],
    other_link: [''],
    experience: ['', Validators.required],
    employer: [''],
    salary: [''],
    available_from: [''],
    cover_letter: [''],
    heard_from: [''],
    confirm: [false, Validators.requiredTrue],
  });
  ngOnChanges() {
    if (this.position) this.form.patchValue({ position: this.position });
  }
  skillLabel(skill: string) {
    const upper = new Set(['sql', 'it', 'hr', 'qa', 'ai', 'bi', 'cv']);
    return skill.split(' ').map((word) => upper.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  onCv(event: Event) {
    const input = event.target as HTMLInputElement;
    this.takeFile(input.files?.[0] ?? null);
  }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(false);
    this.takeFile(event.dataTransfer?.files?.[0] ?? null);
  }
  private takeFile(file: File | null) {
    this.formError.set('');
    if (!file) {
      this.cv = null;
      this.cvName.set('');
      return;
    }
    if (!/\.(pdf|docx?)$/i.test(file.name)) {
      this.formError.set('CV must be a PDF, DOC or DOCX file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.formError.set('CV is larger than 5 MB.');
      return;
    }
    this.cv = file;
    this.cvName.set(file.name);
  }
  submit() {
    this.formError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Fill in the required fields.');
      return;
    }
    if (!this.cv) {
      this.formError.set('Upload a CV as PDF, DOC or DOCX.');
      return;
    }
    const data = new FormData();
    const value = this.form.getRawValue();
    Object.entries(value).forEach(([key, item]) => {
      if (key === 'confirm') return;
      data.append(key, item == null ? '' : String(item));
    });
    data.append('cv', this.cv);
    this.api.apply(data).subscribe({
      next: (row) => {
        this.form.reset({ position: this.position, confirm: false });
        this.cv = null;
        this.cvName.set('');
        this.result.set(row);
        this.sent.emit(row);
      },
      error: (err) => this.formError.set(typeof err.error?.detail === 'string' ? err.error.detail : 'The application could not be sent.'),
    });
  }
}
