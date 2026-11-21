import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { GalleryVideo } from '../../core/models';
import { SiteHeaderComponent } from '../../shared/site-header.component';

@Component({
  selector: 'app-gallery',
  imports: [SiteHeaderComponent],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css',
})
export class GalleryComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly videos = signal<GalleryVideo[]>([]);
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

  ngOnInit() {
    this.api.gallery().subscribe({ next: (rows) => this.videos.set(rows) });
  }

  src(id: number) {
    return this.api.gallerySrc(id);
  }
}
