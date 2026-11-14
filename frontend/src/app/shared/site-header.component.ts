import { Component, Input, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, NgClass],
  templateUrl: './site-header.component.html',
})
export class SiteHeaderComponent {
  @Input() services: readonly string[] = [];
  readonly menuOpen = signal(false);
  readonly servicesOpen = signal(false);
  readonly companyOpen = signal(false);
  private servicesTimer: ReturnType<typeof setTimeout> | null = null;
  private companyTimer: ReturnType<typeof setTimeout> | null = null;
  constructor(readonly auth: AuthService) {}
  goHome() {
    this.closeMenus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  signOut() {
    this.auth.logout();
    this.closeMenus();
  }
  closeMenus() {
    if (this.servicesTimer) clearTimeout(this.servicesTimer);
    if (this.companyTimer) clearTimeout(this.companyTimer);
    this.menuOpen.set(false);
    this.servicesOpen.set(false);
    this.companyOpen.set(false);
  }
  openServices() {
    if (window.matchMedia('(max-width: 767px)').matches) return;
    if (this.servicesTimer) clearTimeout(this.servicesTimer);
    if (this.companyTimer) clearTimeout(this.companyTimer);
    this.companyOpen.set(false);
    this.servicesOpen.set(true);
  }
  scheduleCloseServices() {
    if (this.servicesTimer) clearTimeout(this.servicesTimer);
    this.servicesTimer = setTimeout(() => this.servicesOpen.set(false), 160);
  }
  openCompany() {
    if (window.matchMedia('(max-width: 767px)').matches) return;
    if (this.companyTimer) clearTimeout(this.companyTimer);
    if (this.servicesTimer) clearTimeout(this.servicesTimer);
    this.servicesOpen.set(false);
    this.companyOpen.set(true);
  }
  scheduleCloseCompany() {
    if (this.companyTimer) clearTimeout(this.companyTimer);
    this.companyTimer = setTimeout(() => this.companyOpen.set(false), 160);
  }
  onCompanyClick() {
    if (window.matchMedia('(min-width: 768px)').matches) {
      this.openCompany();
      return;
    }
    this.companyOpen.update((open) => !open);
  }
}
