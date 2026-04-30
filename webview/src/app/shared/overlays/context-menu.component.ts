import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  inject,
} from '@angular/core';
import { ContextMenuService } from './context-menu.service';

@Component({
  selector: 'cm-context-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (svc.config(); as cfg) {
      <div
        class="cm-ctx-menu"
        role="menu"
        [style.left.px]="cfg.x"
        [style.top.px]="cfg.y"
        (keydown.escape)="svc.close()"
      >
        @for (item of cfg.items; track item.label) {
          <button
            type="button"
            class="cm-ctx-item"
            role="menuitem"
            [attr.data-variant]="item.variant ?? 'default'"
            (click)="run(item.action)"
          >{{ item.label }}</button>
        }
      </div>
    }
  `,
})
export class ContextMenuComponent {
  protected readonly svc = inject(ContextMenuService);

  @HostListener('document:click')
  @HostListener('document:contextmenu')
  protected closeOnOutside(): void {
    this.svc.close();
  }

  protected run(action: () => void): void {
    action();
    this.svc.close();
  }
}
