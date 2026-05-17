import { Component } from '@angular/core';
import { ThemeService, AppTheme } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  template: `
    <div class="switcher-wrap">
      <span class="switcher-label">Tema</span>
      <div class="palette">
        <button
          *ngFor="let t of theme.themes"
          class="swatch"
          [class.active]="theme.active.id === t.id"
          [style.background]="t.color"
          [matTooltip]="t.label"
          matTooltipPosition="above"
          (click)="theme.apply(t)"
          [attr.aria-label]="t.label"
        ></button>
      </div>
    </div>
  `,
  styles: [`
    .switcher-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
    }

    .switcher-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #9e9e9e;
    }

    .palette {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .swatch {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.15s, border-color 0.15s;
      padding: 0;
      outline: none;
    }

    .swatch:hover {
      transform: scale(1.2);
    }

    .swatch.active {
      border-color: #fff;
      box-shadow: 0 0 0 2px rgba(0,0,0,0.25);
      transform: scale(1.15);
    }
  `],
})
export class ThemeSwitcherComponent {
  constructor(public theme: ThemeService) {}
}
