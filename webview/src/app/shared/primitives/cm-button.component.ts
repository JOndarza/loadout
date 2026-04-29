import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CmButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
export type CmButtonSize = 'sm' | 'md';

@Component({
  selector: 'cm-button, button[cm-button]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[class.cm-btn]': 'true',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-block]': 'block() || null',
    '[attr.type]': 'type()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled() || null',
  },
})
export class CmButtonComponent {
  readonly variant = input<CmButtonVariant>('secondary');
  readonly size = input<CmButtonSize>('md');
  readonly block = input(false);
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit'>('button');
}
