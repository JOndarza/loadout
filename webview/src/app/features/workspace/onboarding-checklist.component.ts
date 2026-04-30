import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { WorkspaceState } from '@state/workspace.state';
import { ProfilesState } from '@state/profiles.state';

interface Step {
  label: string;
  hint: string;
  done: boolean;
}

@Component({
  selector: 'cm-onboarding-checklist',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cm-onboarding">
      <div class="cm-onboarding-header">
        <span class="cm-onboarding-title">Getting started</span>
        <button type="button" class="cm-onboarding-dismiss" (click)="dismissed.emit()" aria-label="Dismiss">✕</button>
      </div>
      <ol class="cm-onboarding-steps">
        @for (step of steps(); track step.label) {
          <li class="cm-onboarding-step" [class.is-done]="step.done">
            <span class="cm-onboarding-check">{{ step.done ? '✓' : '○' }}</span>
            <span class="cm-onboarding-step-text">
              <strong>{{ step.label }}</strong>
              <span class="cm-onboarding-hint">{{ step.hint }}</span>
            </span>
          </li>
        }
      </ol>
    </div>
  `,
})
export class OnboardingChecklistComponent {
  private readonly workspace = inject(WorkspaceState);
  private readonly profiles = inject(ProfilesState);

  readonly dismissed = output<void>();

  protected readonly steps = computed<Step[]>(() => [
    {
      label: 'Enable an agent or skill',
      hint: 'Toggle any item in the list to activate it.',
      done: this.workspace.activeAgents().length > 0 || this.workspace.activeSkills().length > 0,
    },
    {
      label: 'Save a loadout profile',
      hint: 'Type a name above and click Save loadout.',
      done: this.profiles.entries().length > 0,
    },
    {
      label: 'Switch profiles with Cmd+K',
      hint: 'Open the command palette and type a profile name to apply it instantly.',
      done: false,
    },
  ]);
}
