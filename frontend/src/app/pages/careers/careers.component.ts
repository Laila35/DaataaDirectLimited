import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { SiteHeaderComponent } from '../../shared/site-header.component';
import { ApplyFormComponent } from '../../shared/apply-form.component';
import { OFFERED_SERVICES } from '../../shared/offered-services';
import { ApiService } from '../../core/api.service';
import { Job } from '../../core/models';

@Component({
  selector: 'app-careers-page',
  imports: [DatePipe, SiteHeaderComponent, ApplyFormComponent],
  templateUrl: './careers.component.html',
})
export class CareersPageComponent implements OnInit {
  readonly services = OFFERED_SERVICES;
  readonly jobs = signal<Job[]>([]);
  readonly selected = signal<Job | null>(null);
  readonly careerTab = signal<'roles' | 'apply'>('roles');
  readonly loadError = signal('');
  readonly benefits = ['Competitive salary', 'Paid annual leave', 'Learning budget', 'Hybrid working', 'A friendly, small team'];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.jobs().subscribe({
      next: (rows) => {
        this.jobs.set(rows);
        if (rows[0]) this.choose(rows[0]);
      },
      error: () => this.loadError.set('Open roles could not be loaded. Start the API, then refresh.'),
    });
  }

  choose(job: Job) {
    this.selected.set(job);
  }

  openApply(job: Job) {
    this.choose(job);
    this.careerTab.set('apply');
  }
}
