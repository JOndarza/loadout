import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'cm-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="cm-toggle"
      [class.is-on]="checked()"
      [attr.aria-pressed]="checked()"
      [attr.aria-label]="ariaLabel() || 'Toggle'"
      [disabled]="disabled()"
      (click)="onClick($event)"
    >
      <span class="cm-toggle-track">
        <span class="cm-toggle-knob"></span>
      </span>
    </button>
  `,
})
export class CmToggleComponent {
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly ariaLabel = input<string>('');

  readonly toggled = output<boolean>();

  protected onClick(e: MouseEvent): void {
    e.stopPropagation();
    this.toggled.emit(!this.checked());
  }
}
