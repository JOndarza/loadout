import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { CatalogItem } from '@core/messages';

@Component({
  selector: 'cm-sync-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <span class="cm-pill" [attr.data-status]="status()">
        <span class="cm-pill-icon" aria-hidden="true">{{ icon() }}</span>
        <span class="cm-pill-text">{{ label() }}</span>
      </span>
    }
  `,
})
export class CmSyncPillComponent {
  readonly status = input<CatalogItem['syncStatus']>(null);

  protected readonly label = computed(() => {
    switch (this.status()) {
      case 'synced':         return 'synced';
      case 'localModified':  return 'local edits';
      case 'sharedUpdated':  return 'update available';
      case 'diverged':       return 'diverged';
      default:               return null;
    }
  });

  protected readonly icon = computed(() => {
    switch (this.status()) {
      case 'synced':         return '✓';
      case 'localModified':  return '↑';
      case 'sharedUpdated':  return '↓';
      case 'diverged':       return '⚠';
      default:               return '';
    }
  });
}
