import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'zy-page-header',
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
