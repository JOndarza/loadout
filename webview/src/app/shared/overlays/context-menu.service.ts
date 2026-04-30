import { Injectable, signal } from '@angular/core';

export interface ContextMenuItem {
  label: string;
  action: () => void;
  variant?: 'default' | 'danger';
}

export interface ContextMenuConfig {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

@Injectable({ providedIn: 'root' })
export class ContextMenuService {
  readonly config = signal<ContextMenuConfig | null>(null);

  open(cfg: ContextMenuConfig): void {
    this.config.set(cfg);
  }

  close(): void {
    this.config.set(null);
  }
}
