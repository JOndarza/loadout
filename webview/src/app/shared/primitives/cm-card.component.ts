import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'cm-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="cm-card"
      [class.is-active]="active()"
      [class.is-disabled]="disabled()"
      [class.is-selected]="selected()"
      [attr.data-variant]="variant()"
    >
      <ng-content />
    </div>
  `,
})
export class CmCardComponent {
  readonly active = input(false);
  readonly disabled = input(false);
  readonly selected = input(false);
  readonly variant = input<'default' | 'catalog' | 'profile'>('default');
}
