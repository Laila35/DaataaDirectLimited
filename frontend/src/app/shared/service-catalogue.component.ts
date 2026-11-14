import { Component } from '@angular/core';
import { SERVICE_GROUPS } from './offered-services';

@Component({
  selector: 'app-service-catalogue',
  templateUrl: './service-catalogue.component.html',
  styleUrl: './service-catalogue.component.css',
})
export class ServiceCatalogueComponent {
  readonly groups = SERVICE_GROUPS;
}
