import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface SegmentedOption<T = string> {
  value: T;
  label: string;
  count?: number;
}

@Component({
  selector: 'cm-segmented',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cm-seg" role="tablist" [attr.aria-label]="ariaLabel()">
      @for (opt of options(); track opt.value) {
        <button
          type="button"
          role="tab"
          class="cm-seg-btn"
          [class.is-active]="opt.value === value()"
          [attr.aria-selected]="opt.value === value()"
          (click)="select(opt.value)"
        >
          <span class="cm-seg-label">{{ opt.label }}</span>
          @if (opt.count !== undefined) {
            <span class="cm-seg-count">{{ opt.count }}</span>
          }
        </button>
      }
    </div>
  `,
})
export class CmSegmentedComponent<T = string> {
  readonly options = input.required<SegmentedOption<T>[]>();
  readonly value = input.required<T>();
  readonly ariaLabel = input<string>('');

  readonly valueChange = output<T>();

  protected select(v: T): void {
    if (v !== this.value()) this.valueChange.emit(v);
  }
}
