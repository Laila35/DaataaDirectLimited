import { Routes } from '@angular/router';

import { adminGuard } from './core/admin.guard'
import { staffGuard } from './core/staff.guard'
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent) },
  { path: 'services', loadComponent: () => import('./pages/services/services.component').then((m) => m.ServicesPageComponent) },
  { path: 'about-us', loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutPageComponent) },
  { path: 'about', redirectTo: 'about-us', pathMatch: 'full' },
  { path: 'careers', loadComponent: () => import('./pages/careers/careers.component').then((m) => m.CareersPageComponent) },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactPageComponent) },
  { path: 'faqs', loadComponent: () => import('./pages/faqs/faqs.component').then((m) => m.FaqsComponent) },
  { path: 'reviews', loadComponent: () => import('./pages/reviews/reviews.component').then((m) => m.ReviewsComponent) },
  { path: 'gallery', canActivate: [staffGuard], loadComponent: () => import('./pages/gallery/gallery.component').then((m) => m.GalleryComponent) },
  { path: 'sign-in', data: { portal: 'employee' }, loadComponent: () => import('./pages/sign-in/sign-in.component').then((m) => m.SignInComponent) },
  { path: 'admin/login', data: { portal: 'admin' }, loadComponent: () => import('./pages/sign-in/sign-in.component').then((m) => m.SignInComponent) },
  { path: 'reset-password', data: { view: 'reset' }, loadComponent: () => import('./pages/sign-in/sign-in.component').then((m) => m.SignInComponent) },
  { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent) },
  { path: '**', redirectTo: '' },
];
