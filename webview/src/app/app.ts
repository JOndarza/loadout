import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ShellComponent } from './layout/shell.component';
import { DataSyncService } from './core/data-sync.service';
import { ThemeService } from './core/theme.service';
import { ToastComponent } from './shared/overlays/toast.component';
import { ContextMenuComponent } from './shared/overlays/context-menu.component';

@Component({
  selector: 'cm-app',
  standalone: true,
  imports: [ShellComponent, ToastComponent, ContextMenuComponent],
  template: `<cm-shell /><cm-toast /><cm-context-menu />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly sync = inject(DataSyncService);
  // Eager-instantiate ThemeService so the data-theme attribute syncs from boot.
  private readonly theme = inject(ThemeService);

  ngOnInit(): void {
    this.sync.init();
  }
}
