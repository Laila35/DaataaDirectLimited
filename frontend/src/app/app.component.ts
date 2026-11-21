import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SiteCursorComponent } from './shared/site-cursor.component';
import { WhatsAppChatComponent } from './shared/whatsapp-chat.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteCursorComponent, WhatsAppChatComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly router = inject(Router);
  readonly showWhatsApp = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.chatOnThisPage()),
    ),
    { initialValue: this.chatOnThisPage() },
  );

  private chatOnThisPage() {
    const path = this.router.url.split(/[?#]/)[0];
    return path !== '/sign-in' && path !== '/admin/login';
  }
}


