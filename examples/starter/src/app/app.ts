// Every component here is documented at https://inomjonismaylov.github.io/kometa-ui-kit/
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { KometaButton } from 'kometa-ui/button';
import { KometaPerson } from 'kometa-ui/person';
import { KometaSlot, KometaSlots } from 'kometa-ui/slots';
import { KometaSteps } from 'kometa-ui/steps';
import { ThemeService } from 'kometa-ui/theme';
import { KometaToggle } from 'kometa-ui/toggle';

@Component({
  selector: 'app-root',
  imports: [KometaButton, KometaPerson, KometaSlots, KometaSteps, KometaToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="card">
      <header>
        <k-person name="Dilnoza Karimova" meta="Hair stylist · 45 min" />
        <k-toggle [checked]="light()" (checkedChange)="setLight($event)" onLabel="Light" offLabel="Dark" ariaLabel="Light theme" />
      </header>

      <k-steps [steps]="steps" [current]="step()" ariaLabel="Booking progress" />

      <k-slots [slots]="slots" [(value)]="time" ariaLabel="Free times" />

      <k-toggle [(checked)]="remind" onLabel="Remind me" offLabel="No reminder" ariaLabel="Reminder" />

      <k-button fluid [label]="done() ? 'Booked for ' + time() : 'Book'" [disabled]="!time() || done()" (clicked)="done.set(true)" />
      @if (done()) {
        <k-button text label="Start over" (clicked)="reset()" />
      }
    </main>
  `,
  styles: `
    .card { max-width: 360px; margin: 48px auto; padding: 24px; display: grid; gap: 20px;
      background: var(--card); border: 1px solid var(--border); border-radius: var(--r-card); }
    header { display: flex; justify-content: space-between; align-items: center; }
  `,
})
export class App {
  private readonly theme = inject(ThemeService);
  protected readonly light = computed(() => this.theme.resolved() === 'light');
  protected setLight(on: boolean) { this.theme.set(on ? 'light' : 'dark'); }

  protected readonly steps = ['Pick a time', 'Confirm', 'Booked'];
  protected readonly slots: KometaSlot[] = [
    { value: '09:30', label: '09:30' },
    { value: '11:00', label: '11:00' },
    { value: '13:15', label: '13:15', disabled: true },
    { value: '15:45', label: '15:45' },
    { value: '17:00', label: '17:00', note: 'last' },
  ];

  protected readonly time = signal('');
  protected readonly remind = signal(true);
  protected readonly done = signal(false);
  protected readonly step = computed(() => (this.done() ? 3 : this.time() ? 2 : 1));

  protected reset() { this.done.set(false); this.time.set(''); }
}
