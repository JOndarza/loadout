import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'cm-empty',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cm-empty">
      @if (icon()) {
        <div class="cm-empty-icon" aria-hidden="true">{{ icon() }}</div>
      }
      <h3 class="cm-empty-title">{{ title() }}</h3>
      @if (description()) {
        <p class="cm-empty-desc">{{ description() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class CmEmptyComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly icon = input<string>('');
}
