import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SiteHeaderComponent } from '../../shared/site-header.component';
import { DataGlobeComponent } from '../../shared/data-globe.component';
import { OFFERED_SERVICES } from '../../shared/offered-services';
import { ApiService } from '../../core/api.service';
import { CONTACT } from '../../core/contact';

@Component({
  selector: 'app-contact-page',
  imports: [ReactiveFormsModule, SiteHeaderComponent, DataGlobeComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactPageComponent {
  private readonly fb = inject(FormBuilder);
  readonly services = OFFERED_SERVICES;
  readonly contact = CONTACT;
  readonly contactSent = signal(false);

  readonly contactForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    company: [''],
    message: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(private api: ApiService) {}

  bookCall() {
    const message = this.contactForm.controls.message;
    if (!message.value?.trim()) message.setValue('I would like to book a call.');
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('contact-name')?.focus();
  }

  submitContact() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    const value = this.contactForm.getRawValue();
    const details = [
      value.phone ? `Phone: ${value.phone}` : '',
      value.company ? `Company: ${value.company}` : '',
      value.message ?? '',
    ].filter(Boolean).join('\n');
    this.api.contact({ name: value.name ?? '', email: value.email ?? '', message: details }).subscribe({
      next: () => {
        this.contactSent.set(true);
        this.contactForm.reset();
      },
    });
  }
}
