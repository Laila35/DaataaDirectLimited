import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ReviewItem } from '../../core/models';
import { SiteHeaderComponent } from '../../shared/site-header.component';

@Component({
  selector: 'app-reviews',
  imports: [RouterLink, SiteHeaderComponent],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.css',
})
export class ReviewsComponent implements OnInit {
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

  readonly reviews = signal<ReviewItem[]>([]);

  ngOnInit() {
    this.api.reviews().subscribe({ next: (rows) => this.reviews.set(rows) });
  }

  starLine(count: number) {
    const stars = Math.max(0, Math.min(5, count || 0));
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }
}
