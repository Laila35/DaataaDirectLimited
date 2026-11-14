import { DatePipe } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, WaChatMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { CONTACT } from '../core/contact';
const VISITOR_KEY = 'dd_wa_visitor';
@Component({
  selector: 'app-whatsapp-chat',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './whatsapp-chat.component.html',
  styleUrl: './whatsapp-chat.component.css',
})
export class WhatsAppChatComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly box = viewChild<ElementRef<HTMLElement>>('thread');
  private readonly composer = viewChild<ElementRef<HTMLInputElement>>('composer');
  readonly open = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly sent = signal<WaChatMessage[]>([]);
  readonly menu = signal<number | null>(null);
  readonly editing = signal<WaChatMessage | null>(null);
  readonly pendingDelete = signal<WaChatMessage | null>(null);
  readonly form = this.fb.group({
    message: ['', [Validators.required, Validators.maxLength(1000)]],
  });
  constructor() {
    this.load();
  }
  toggle() {
    this.open.update((value) => !value);
    this.error.set('');
    this.menu.set(null);
  }
  close() {
    this.open.set(false);
    this.menu.set(null);
  }
  closeMenu() {
    this.menu.set(null);
  }
  toggleMenu(id: number, event: Event) {
    event.stopPropagation();
    this.menu.update((current) => (current === id ? null : id));
  }
  startEdit(line: WaChatMessage, event: Event) {
    event.stopPropagation();
    this.menu.set(null);
    this.pendingDelete.set(null);
    this.editing.set(line);
    this.form.controls.message.setValue(line.message);
    this.error.set('');
    queueMicrotask(() => this.composer()?.nativeElement.focus());
  }
  cancelEdit() {
    this.editing.set(null);
    this.form.reset();
  }
  askDelete(line: WaChatMessage, event: Event) {
    event.stopPropagation();
    this.menu.set(null);
    this.pendingDelete.set(line);
  }
  cancelDelete() {
    this.pendingDelete.set(null);
  }
  confirmDelete() {
    const line = this.pendingDelete();
    if (!line || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.api.deleteWhatsapp(line.id, this.visitor()).subscribe({
      next: () => {
        this.sent.update((rows) => rows.filter((row) => row.id !== line.id));
        if (this.editing()?.id === line.id) this.cancelEdit();
        this.pendingDelete.set(null);
        this.busy.set(false);
      },
      error: () => {
        this.busy.set(false);
        this.error.set('The message could not be deleted. Try again.');
      },
    });
  }
  copyMessage(line: WaChatMessage, event: Event) {
    event.stopPropagation();
    this.menu.set(null);
    navigator.clipboard.writeText(line.message).catch(() => {
      this.error.set('The message could not be copied.');
    });
  }
  send() {
    if (this.form.invalid || this.busy()) {
      this.form.markAllAsTouched();
      return;
    }
    const message = this.form.controls.message.value?.trim() ?? '';
    if (!message) return;
    const current = this.editing();
    if (current && current.message === message) {
      this.cancelEdit();
      return;
    }
    const user = this.auth.user();
    if (!current) this.openWhatsApp(message);
    this.busy.set(true);
    this.error.set('');
    const request = current
      ? this.api.editWhatsapp(current.id, { message, visitor: this.visitor() })
      : this.api.whatsapp({
          message,
          name: user ? `${user.first_name} ${user.last_name}`.trim() : 'Website visitor',
          email: user?.email ?? '',
          page: location.pathname,
          visitor: this.visitor(),
          phone: CONTACT.whatsapp,
        });
    request.subscribe({
      next: (saved) => {
        this.sent.update((rows) =>
          current ? rows.map((row) => (row.id === saved.id ? saved : row)) : [...rows, saved],
        );
        this.editing.set(null);
        this.form.reset();
        this.busy.set(false);
        this.scrollThread();
      },
      error: () => {
        this.busy.set(false);
        this.error.set(current ? 'The message could not be edited. Try again.' : 'The message could not be saved. Try again.');
      },
    });
  }
  private openWhatsApp(message: string) {
    const url = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) this.error.set('Allow pop-ups so the message can open in WhatsApp.');
  }
  private load() {
    this.api.whatsappMessages(this.visitor()).subscribe({
      next: (rows) => this.sent.set(rows),
      error: () => {},
    });
  }
  private visitor() {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  }
  private scrollThread() {
    queueMicrotask(() => {
      const thread = this.box()?.nativeElement;
      if (thread) thread.scrollTop = thread.scrollHeight;
    });
  }
}
