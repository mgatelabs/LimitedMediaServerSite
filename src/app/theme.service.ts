import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark: boolean;

  constructor() {
    // Default is dark — light mode requires the .light-theme class
    const saved = localStorage.getItem('theme') ?? 'dark';
    this.isDark = saved === 'dark';
    this.apply();
  }

  toggle() {
    this.isDark = !this.isDark;
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    this.apply();
  }

  private apply() {
    document.documentElement.classList.toggle('light-theme', !this.isDark);
  }
}
