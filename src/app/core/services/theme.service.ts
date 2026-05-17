import { Injectable } from '@angular/core';

export interface AppTheme {
  id:    string;
  label: string;
  color: string;
}

export const THEMES: AppTheme[] = [
  { id: 'navy',    label: 'Naval',    color: '#1a3c5e' },
  { id: 'indigo',  label: 'Índigo',   color: '#303F9F' },
  { id: 'black',   label: 'Preto',    color: '#1a1a1a' },
  { id: 'teal',    label: 'Teal',     color: '#00695C' },
  { id: 'green',   label: 'Verde',    color: '#2E7D32' },
  { id: 'red',     label: 'Vermelho', color: '#C62828' },
  { id: 'purple',  label: 'Violeta',  color: '#6A1B9A' },
  { id: 'brown',   label: 'Castanho', color: '#4E342E' },
];

const STORAGE_KEY = 'app-theme';
const CSS_VAR     = '--primary';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _active: AppTheme = THEMES[0];

  get active(): AppTheme { return this._active; }
  get themes(): AppTheme[] { return THEMES; }

  init(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    const theme = THEMES.find((t) => t.id === saved) ?? THEMES[0];
    this.apply(theme);
  }

  apply(theme: AppTheme): void {
    this._active = theme;
    document.documentElement.style.setProperty(CSS_VAR, theme.color);
    localStorage.setItem(STORAGE_KEY, theme.id);
  }
}
