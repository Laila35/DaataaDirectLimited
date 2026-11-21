import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../../shared/site-header.component';
import { OFFERED_SERVICES } from '../../shared/offered-services';
import { CONTACT } from '../../core/contact';
import { PageMetaService } from '../../core/page-meta.service';
import { ABOUT_SEO } from '../../core/site-seo';

interface OrbitNode {
  label: string;
  x: number;
  y: number;
  delay: string;
}

interface OrbitLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const MENTIONS = [
  'Software systems',
  'Legal',
  'Logistics',
  'Graphic design',
  'Operations',
  'Marketing',
  'E-commerce',
  'Sales',
  'Accounts & tax',
  'Human resources',
  'Procurement',
  'Quality assurance',
];

function orbit(): { nodes: OrbitNode[]; lines: OrbitLine[] } {
  const count = MENTIONS.length;
  const radius = 36;
  const nodes = MENTIONS.map((label, index) => {
    const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / count;
    return {
      label,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
      delay: `${index * 0.08}s`,
    };
  });
  const lines: OrbitLine[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    for (const step of [5, 6]) {
      const j = (i + step) % count;
      const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push({
        id: key,
        x1: nodes[i].x,
        y1: nodes[i].y,
        x2: nodes[j].x,
        y2: nodes[j].y,
      });
    }
  }
  return { nodes, lines };
}

@Component({
  selector: 'app-about-page',
  imports: [RouterLink, SiteHeaderComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutPageComponent implements OnInit {
  private readonly seo = inject(PageMetaService);
  readonly services = OFFERED_SERVICES;
  readonly contact = CONTACT;
  readonly nodes: OrbitNode[];
  readonly lines: OrbitLine[];
  readonly steps = [
    { n: '1', title: 'Scope', text: 'Tell us the field: software, legal, logistics, graphics, or another part of the business.' },
    { n: '2', title: 'Plan', text: 'We set the work, the people and how it will be delivered remotely.' },
    { n: '3', title: 'Deliver', text: 'The team builds, runs or supports that field.' },
    { n: '4', title: 'Review', text: 'We check the result with you and adjust what should change.' },
  ];

  constructor() {
    const placed = orbit();
    this.nodes = placed.nodes;
    this.lines = placed.lines;
  }

  ngOnInit() {
    this.seo.apply(ABOUT_SEO);
  }
}
