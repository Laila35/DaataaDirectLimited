import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { FaqItem } from '../../core/models';
import { SiteHeaderComponent } from '../../shared/site-header.component';

@Component({
  selector: 'app-faqs',
  imports: [RouterLink, SiteHeaderComponent],
  templateUrl: './faqs.component.html',
})
export class FaqsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly services = [
    'Operations & Production',
    'Administration',
    'Accounts & Taxation',
    'Human Resources (HR)',
    'Research and Development (R&D)',
    'Marketing',
    'Information Technology (IT)',
    'IT Backup & Troubleshooting',
    'Procurement',
    'Sales',
    'Customer Service CSR',
    'Shipping & Logistics',
    'Legal & Trademark',
    'E-Commerce',
    'E-Commerce - Amazon Offers',
    'E-Commerce - Listing',
    'E-Commerce - New Product',
    'Graphic Designing',
    'Quality Assurance (QA)',
  ];

  readonly faqs = signal<FaqItem[]>([]);

  readonly open = signal(0);

  ngOnInit() {
    this.api.faqs().subscribe({ next: (rows) => this.faqs.set(rows) });
  }

  toggle(index: number) {
    this.open.set(this.open() === index ? -1 : index);
  }
}
