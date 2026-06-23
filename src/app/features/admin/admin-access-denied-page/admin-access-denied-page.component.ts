import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'zy-admin-access-denied-page',
  imports: [PageHeaderComponent, RouterLink],
  templateUrl: './admin-access-denied-page.component.html',
  styleUrl: './admin-access-denied-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAccessDeniedPageComponent {}
