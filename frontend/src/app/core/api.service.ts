import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AboutPage, ApplicationRow, Employee, FaqItem, GalleryVideo, Job, ReviewItem, Settings, Stats } from './models';

export interface WaChatMessage {
  id: number;
  message: string;
  created_at: string;
  edited: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  jobs(all = false) {
    return this.http.get<Job[]>('/api/jobs', { params: all ? { scope: 'all' } : {} });
  }

  apply(form: FormData) {
    return this.http.post<ApplicationRow>('/api/applications', form);
  }

  contact(body: { name: string; email: string; message: string }) {
    return this.http.post<{ ok: boolean }>('/api/contact', body);
  }

  whatsappMessages(visitor: string) {
    return this.http.get<WaChatMessage[]>('/api/whatsapp', { params: { visitor } });
  }

  whatsapp(body: { message: string; name: string; email: string; page: string; visitor: string; phone: string }) {
    return this.http.post<WaChatMessage>('/api/whatsapp', body);
  }

  editWhatsapp(id: number, body: { message: string; visitor: string }) {
    return this.http.put<WaChatMessage>(`/api/whatsapp/${id}`, body);
  }

  deleteWhatsapp(id: number, visitor: string) {
    return this.http.delete<{ ok: boolean }>(`/api/whatsapp/${id}`, { params: { visitor } });
  }

  settings() {
    return this.http.get<Settings>('/api/settings');
  }

  saveSettings(body: Settings) {
    return this.http.put<Settings>('/api/settings', body);
  }

  stats() {
    return this.http.get<Stats>('/api/stats');
  }

  applications() {
    return this.http.get<ApplicationRow[]>('/api/applications');
  }

  updateApplication(id: number, status: string) {
    return this.http.put<ApplicationRow>(`/api/applications/${id}`, { status });
  }

  deleteApplication(id: number) {
    return this.http.delete(`/api/applications/${id}`);
  }

  downloadCv(id: number) {
    return this.http.get(`/api/applications/${id}/cv`, { responseType: 'blob' });
  }

  employees() {
    return this.http.get<Employee[]>('/api/employees');
  }

  createEmployee(body: Omit<Employee, 'id'>) {
    return this.http.post<Employee>('/api/employees', body);
  }

  deleteEmployee(id: number) {
    return this.http.delete(`/api/employees/${id}`);
  }

  createJob(body: Partial<Job> & { title: string; department: string; summary: string }) {
    return this.http.post<Job>('/api/jobs', body);
  }

  updateJob(id: number, body: Partial<Job> & { title: string; department: string; summary: string }) {
    return this.http.put<Job>(`/api/jobs/${id}`, body);
  }

  closeJob(id: number) {
    return this.http.delete(`/api/jobs/${id}`);
  }

  about() {
    return this.http.get<AboutPage>('/api/about');
  }

  saveAbout(body: AboutPage) {
    return this.http.put<AboutPage>('/api/about', body);
  }

  faqs() {
    return this.http.get<FaqItem[]>('/api/faqs');
  }

  createFaq(body: { question: string; answer: string }) {
    return this.http.post<FaqItem>('/api/faqs', body);
  }

  updateFaq(id: number, body: { question: string; answer: string }) {
    return this.http.put<FaqItem>(`/api/faqs/${id}`, body);
  }

  deleteFaq(id: number) {
    return this.http.delete(`/api/faqs/${id}`);
  }

  reviews() {
    return this.http.get<ReviewItem[]>('/api/reviews');
  }

  createReview(body: { quote: string; role: string; place: string; stars: number }) {
    return this.http.post<ReviewItem>('/api/reviews', body);
  }

  updateReview(id: number, body: { quote: string; role: string; place: string; stars: number }) {
    return this.http.put<ReviewItem>(`/api/reviews/${id}`, body);
  }

  deleteReview(id: number) {
    return this.http.delete(`/api/reviews/${id}`);
  }

  gallery() {
    return this.http.get<GalleryVideo[]>('/api/gallery');
  }

  createGallery(body: FormData) {
    return this.http.post<GalleryVideo>('/api/gallery', body);
  }

  deleteGallery(id: number) {
    return this.http.delete(`/api/gallery/${id}`);
  }

  gallerySrc(id: number) {
    const token = localStorage.getItem('dd_token') ?? '';
    return `/api/gallery/${id}/video?token=${encodeURIComponent(token)}`;
  }
}
