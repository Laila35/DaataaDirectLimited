import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteCursorComponent } from './shared/site-cursor.component';
import { WhatsAppChatComponent } from './shared/whatsapp-chat.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteCursorComponent, WhatsAppChatComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}


