import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { CONTACT, SOCIALS } from '../../core/contact';
import { PageMetaService } from '../../core/page-meta.service';
import { HOME_SEO } from '../../core/site-seo';
import { AboutPage, FaqItem, Job, ReviewItem } from '../../core/models';
import { ABOUT_DEFAULTS } from '../../shared/about-defaults';
import { COMPANY_CHANNELS } from '../../shared/company-channels';
import { OFFERED_SERVICES } from '../../shared/offered-services';
import { ServiceCatalogueComponent } from '../../shared/service-catalogue.component';
import { SiteHeaderComponent } from '../../shared/site-header.component';
import { ApplyFormComponent } from '../../shared/apply-form.component';
import { DataGlobeComponent } from '../../shared/data-globe.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ReactiveFormsModule, NgClass, DatePipe, DataGlobeComponent, SiteHeaderComponent, ApplyFormComponent, ServiceCatalogueComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(PageMetaService);
  readonly contact = CONTACT;
  readonly socials = SOCIALS;
  readonly jobs = signal<Job[]>([]);
  readonly selected = signal<Job | null>(null);
  readonly careerTab = signal<'roles' | 'apply'>('roles');
  readonly contactSent = signal(false);
  readonly loadError = signal('');

  readonly heroTiles = [
    { src: '/assets/design.jpg', label: 'Design', place: 'tile-design', tone: 'tone-2', pos: 'center' },
    { src: '/assets/Digital%20Marketing.png', label: 'Digital marketing', place: 'tile-market', tone: 'tone-2', pos: 'center', fit: 'contain' },
    { src: '/assets/SE.jpg', label: 'Web development', place: 'tile-web', tone: 'tone-5', pos: 'center' },
    { src: '/assets/Graphic-Design.jpg', label: 'Graphic design', place: 'tile-graphic', tone: 'tone-1', pos: 'center' },
    { src: '/assets/code.avif', label: 'Software', place: 'tile-code', tone: 'tone-4', pos: 'center' },
    { src: '/assets/AI.jpg', label: 'Artificial intelligence', place: 'tile-ai', tone: 'tone-3', pos: 'center' },
    { src: '/assets/data-desk.jpg', label: 'Data intelligence', place: 'tile-data', tone: 'tone-2', pos: 'center' },
    { src: '/assets/direct-reach%20(2).jpg', label: 'Direct marketing', place: 'tile-reach', tone: 'tone-4', pos: 'center' },
    { src: '/assets/sale.png', label: 'Sales', place: 'tile-sale', tone: 'tone-6', pos: 'center', fit: 'contain' },
    { src: '/assets/warehouse.png', label: 'Warehouse', place: 'tile-warehouse', tone: 'tone-5', pos: 'center', fit: 'contain' },
    { src: '/assets/platform-screen.png', label: 'Digital platforms', place: 'tile-platform', tone: 'tone-1', pos: 'center', fit: 'contain' },
  ];
  readonly broken = signal<ReadonlySet<string>>(new Set());

  readonly benefits = ['Competitive salary', 'Paid annual leave', 'Learning budget', 'Hybrid working', 'A friendly, small team'];
  readonly services = OFFERED_SERVICES;
  readonly channels = COMPANY_CHANNELS;
  readonly about = signal<AboutPage>(ABOUT_DEFAULTS);
  readonly reviews = signal<ReviewItem[]>([]);
  readonly faqs = signal<FaqItem[]>([]);
  readonly faqOpen = signal(0);

  readonly contactForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    company: [''],
    message: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.seo.apply(HOME_SEO);
    this.api.about().subscribe({
      next: (page) => this.about.set(page),
    });
    this.api.reviews().subscribe({ next: (rows) => this.reviews.set(rows) });
    this.api.faqs().subscribe({ next: (rows) => this.faqs.set(rows) });
    this.api.jobs().subscribe({
      next: (rows) => {
        this.jobs.set(rows);
        if (rows[0]) this.choose(rows[0]);
      },
      error: () => this.loadError.set('Open roles could not be loaded. Start the API, then refresh.'),
    });
  }

  toggleFaq(index: number) {
    this.faqOpen.set(this.faqOpen() === index ? -1 : index);
  }

  starLine(count: number) {
    const stars = Math.max(0, Math.min(5, count || 0));
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }

  markBroken(file: string) {
    this.broken.update((prev) => {
      if (prev.has(file)) return prev;
      const next = new Set(prev);
      next.add(file);
      return next;
    });
  }

  choose(job: Job) {
    this.selected.set(job);
  }

  openApply(job: Job) {
    this.choose(job);
    this.careerTab.set('apply');
  }

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
