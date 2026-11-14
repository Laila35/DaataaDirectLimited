import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  robots?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

@Injectable({ providedIn: 'root' })
export class PageMetaService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(page: PageSeo) {
    const origin = this.document.location?.origin ?? '';
    const url = origin ? `${origin}${page.path}` : page.path;
    this.title.setTitle(page.title);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ name: 'robots', content: page.robots ?? 'index, follow' });
    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.upsertLink('canonical', url);
    this.setJsonLd(page.jsonLd);
  }

  private upsertLink(rel: string, href: string) {
    let link = this.document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.rel = rel;
      this.document.head.appendChild(link);
    }
    link.href = href;
  }

  private setJsonLd(data?: PageSeo['jsonLd']) {
    const id = 'page-jsonld';
    const existing = this.document.getElementById(id);
    if (!data) {
      existing?.remove();
      return;
    }
    const script = existing ?? this.document.createElement('script');
    script.id = id;
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(data);
    if (!existing) this.document.head.appendChild(script);
  }
}
