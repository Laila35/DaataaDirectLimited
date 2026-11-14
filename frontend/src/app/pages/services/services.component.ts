import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaService } from '../../core/page-meta.service';
import { CONTACT_EMAIL } from '../../core/contact';
import { SERVICES_SEO } from '../../core/site-seo';
import { SiteHeaderComponent } from '../../shared/site-header.component';
import { ServiceCatalogueComponent } from '../../shared/service-catalogue.component';
import { OFFERED_SERVICES } from '../../shared/offered-services';

@Component({
  selector: 'app-services-page',
  imports: [RouterLink, SiteHeaderComponent, ServiceCatalogueComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
})
export class ServicesPageComponent implements OnInit {
  private readonly seo = inject(PageMetaService);
  readonly services = OFFERED_SERVICES;
  readonly contactEmail = CONTACT_EMAIL;

  ngOnInit() {
    this.seo.apply(SERVICES_SEO);
  }
}
