// ─── Messages exchanged between extension host and webview ───────────────────

export interface WorkspaceItem {
  name: string;
  file: string;
  active: boolean;
  tokens: number;
  description: string;
}

export interface CatalogItem {
  name: string;
  file: string;
  tokens: number;
  description: string;
  inProject: boolean;
  syncStatus: 'synced' | 'localModified' | 'sharedUpdated' | 'diverged' | null;
}

export interface Profile {
  agents: string[];
  skills: string[];
  createdAt: string;
  order?: number;
}

export interface Settings {
  density: 'compact' | 'comfortable';
  theme: 'dark' | 'light' | 'auto';
  defaultTab: 'workspace' | 'profiles' | 'catalog' | 'last';
  registryUrl: string;
}

export interface InitialData {
  root: string;
  agents: WorkspaceItem[];
  skills: WorkspaceItem[];
  profiles: Record<string, Profile>;
  catalogAgents: CatalogItem[];
  catalogSkills: CatalogItem[];
  globalRoot: string;
  settings: Settings;
  vscodeThemeKind: 'dark' | 'light';
  extensionVersion: string;
}

export interface RegistryItem {
  name: string;
  file: string;
  itemType: 'agents' | 'skills' | 'commands';
  status: 'updatable' | 'custom';
}

// ─── Outbound (webview → extension) ──────────────────────────────────────────
export type WebviewMessage =
  | { command: 'ready' }
  | { command: 'setTab'; tab: string }
  | { command: 'toggle'; type: 'agents' | 'skills'; file: string; wasActive: boolean }
  | { command: 'enableAll'; type: 'agents' | 'skills' }
  | { command: 'disableAll'; type: 'agents' | 'skills' }
  | { command: 'addFromGlobal'; itemType: 'agents' | 'skills'; file: string }
  | { command: 'pushToGlobal'; itemType: 'agents' | 'skills'; file: string }
  | { command: 'saveProfile'; name: string }
  | { command: 'applyProfile'; name: string; silent?: boolean }
  | { command: 'deleteProfile'; name: string }
  | { command: 'renameProfile'; from: string; to: string }
  | { command: 'reorderProfiles'; order: string[] }
  | { command: 'updateProfileItems'; name: string; agents: string[]; skills: string[] }
  | { command: 'duplicateProfile'; from: string; to: string }
  | { command: 'updateSettings'; settings: Partial<Settings> }
  | { command: 'revealCatalog' }
  | { command: 'testRegistry'; url: string }
  | { command: 'checkRegistry' }
  | { command: 'runUpdate' }
  | { command: 'refresh' }
  | { command: 'openExternal'; url: string }
  | { command: 'bulkToggle'; items: Array<{ type: 'agents' | 'skills'; file: string; wasActive: boolean }> };

// ─── Inbound (extension → webview) ───────────────────────────────────────────
export type ExtensionMessage =
  | { command: 'initialData'; data: InitialData }
  | { command: 'dataUpdate'; data: InitialData }
  | { command: 'vscodeThemeChanged'; kind: 'dark' | 'light' }
  | { command: 'registryStatus'; items: RegistryItem[]; error?: string }
  | { command: 'updateStarted' }
  | { command: 'updateDone'; result: { updated: string[]; skipped: string[]; failed: string[] } }
  | { command: 'testRegistryResult'; ok: boolean; status?: number; error?: string }
  | { command: 'notify'; level: 'info' | 'warn' | 'error'; text: string };
