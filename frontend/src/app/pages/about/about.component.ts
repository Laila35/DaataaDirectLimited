import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../../shared/site-header.component';
import { OFFERED_SERVICES } from '../../shared/offered-services';
import { ABOUT_DEFAULTS } from '../../shared/about-defaults';
import { ApiService } from '../../core/api.service';
import { AboutPage } from '../../core/models';

@Component({
  selector: 'app-about-page',
  imports: [RouterLink, SiteHeaderComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutPageComponent implements OnInit {
  readonly services = OFFERED_SERVICES;
  readonly about = signal<AboutPage>(ABOUT_DEFAULTS);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.about().subscribe({
      next: (page) => this.about.set(page),
    });
  }
}
