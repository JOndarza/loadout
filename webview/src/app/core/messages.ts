// ─── Messages exchanged between extension host and webview ───────────────────

export type ItemType = 'agents' | 'skills' | 'commands';

export interface WorkspaceItem {
  name: string;
  file: string;
  active: boolean;
  tokens: number;
  description: string;
  memoryScope?: string | null;
}

export interface ClaudeSettings {
  model?: string | null;
  effortLevel?: string | null;
  autoMemoryEnabled?: boolean | null;
  env?: Record<string, string>;
}

export interface MemoryFile {
  path: string;
  scope: 'user' | 'project' | 'local' | 'rules';
  pathsGlob?: string | null;
}

export interface CatalogItem {
  name: string;
  file: string;
  tokens: number;
  description: string;
  inProject: boolean;
  syncStatus: 'synced' | 'localModified' | 'sharedUpdated' | 'diverged' | null;
}

export interface PendingItems {
  agents: string[];
  skills: string[];
  commands: string[];
}

export interface Profile {
  agents: string[];
  skills: string[];
  commands?: string[];
  createdAt: string;
  order?: number;
  description?: string;
  pendingItems?: PendingItems;
  lastAppliedAt?: string;
  appliedCount?: number;
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
  commands: WorkspaceItem[];
  profiles: Record<string, Profile>;
  catalogAgents: CatalogItem[];
  catalogSkills: CatalogItem[];
  catalogCommands: CatalogItem[];
  globalRoot: string;
  settings: Settings;
  vscodeThemeKind: 'dark' | 'light';
  extensionVersion: string;
  lastApplied?: string;
  claudeSettings: ClaudeSettings;
  memoryFiles: MemoryFile[];
}

export interface RegistryItem {
  name: string;
  file: string;
  itemType: ItemType;
  status: 'updatable' | 'custom';
}

// ─── Outbound (webview → extension) ──────────────────────────────────────────
export type WebviewMessage =
  | { command: 'ready' }
  | { command: 'setTab'; tab: string }
  | { command: 'toggle'; type: ItemType; file: string; wasActive: boolean }
  | { command: 'addFromGlobal'; itemType: ItemType; file: string }
  | { command: 'pushToGlobal'; itemType: ItemType; file: string }
  | { command: 'saveProfile'; name: string }
  | { command: 'applyProfile'; name: string; silent?: boolean; skipRestorePoint?: boolean }
  | { command: 'deleteProfile'; name: string }
  | { command: 'renameProfile'; from: string; to: string }
  | { command: 'reorderProfiles'; order: string[] }
  | { command: 'updateProfileItems'; name: string; agents: string[]; skills: string[]; commands: string[] }
  | { command: 'duplicateProfile'; from: string; to: string }
  | { command: 'updateSettings'; settings: Partial<Settings> }
  | { command: 'revealCatalog' }
  | { command: 'testRegistry'; url: string }
  | { command: 'checkRegistry' }
  | { command: 'runUpdate' }
  | { command: 'refresh' }
  | { command: 'openExternal'; url: string }
  | { command: 'bulkToggle'; items: Array<{ type: ItemType; file: string; wasActive: boolean }> }
  | { command: 'updateProfileDescription'; name: string; description: string }
  | { command: 'previewApplyProfile'; name: string }
  | { command: 'exportProfile'; name: string }
  | { command: 'importProfileRequest' }
  | { command: 'importProfileConfirm'; name: string; profile: { agents: string[]; skills: string[]; commands: string[]; description: string }; missing: PendingItems }
  | { command: 'bulkAddFromGlobal'; items: Array<{ itemType: ItemType; file: string }> }
  | { command: 'clearRestorePoint' }
  | { command: 'updateClaudeSetting'; key: string; value: string | boolean | null }
  | { command: 'openMemoryFile'; path: string }
  | { command: 'addEnvVar'; key: string; value: string }
  | { command: 'removeEnvVar'; key: string };

// ─── Inbound (extension → webview) ───────────────────────────────────────────
export type ExtensionMessage =
  | { command: 'initialData'; data: InitialData }
  | { command: 'dataUpdate'; data: InitialData }
  | { command: 'vscodeThemeChanged'; kind: 'dark' | 'light' }
  | { command: 'registryStatus'; items: RegistryItem[]; error?: string }
  | { command: 'updateStarted' }
  | { command: 'updateDone'; result: { updated: string[]; skipped: string[]; failed: string[] } }
  | { command: 'testRegistryResult'; ok: boolean; status?: number; error?: string }
  | { command: 'notify'; level: 'info' | 'warn' | 'error'; text: string }
  | { command: 'applyProfilePreview'; name: string; willActivate: PendingItems; willDeactivate: PendingItems }
  | { command: 'profileImportPreview'; originalName: string; profile: { agents: string[]; skills: string[]; commands: string[]; description: string }; found: PendingItems; missing: PendingItems };
