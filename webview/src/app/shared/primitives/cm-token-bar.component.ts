import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'cm-token-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cm-tb" [class.is-high]="level() === 'high'">
      <div class="cm-tb-row">
        <span class="cm-tb-num" [attr.data-level]="level()">{{ formattedTokens() }}</span>
        <span class="cm-tb-unit">tok</span>
      </div>
      <div class="cm-tb-track">
        <div
          class="cm-tb-fill"
          [attr.data-level]="level()"
          [style.width.%]="percentage()"
        ></div>
      </div>
    </div>
  `,
})
export class CmTokenBarComponent {
  readonly tokens = input.required<number>();
  readonly maxTokens = input(3000);

  readonly level = computed<'low' | 'mid' | 'high'>(() => {
    const t = this.tokens();
    if (t > 2000) return 'high';
    if (t > 800) return 'mid';
    return 'low';
  });

  readonly percentage = computed(() => Math.min(100, Math.round((this.tokens() / this.maxTokens()) * 100)));

  readonly formattedTokens = computed(() => {
    const n = this.tokens();
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString();
  });
}
