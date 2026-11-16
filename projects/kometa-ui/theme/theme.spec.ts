import { TestBed } from '@angular/core/testing';
import { THEME_KEY, ThemeService } from './theme';

describe('ThemeService', () => {
  afterEach(() => {
    localStorage.removeItem(THEME_KEY);
    document.documentElement.removeAttribute('data-theme');
    TestBed.resetTestingModule();
  });

  it('applies a saved choice when created', () => {
    localStorage.setItem(THEME_KEY, 'light');
    expect(TestBed.inject(ThemeService).resolved()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('leaves the page to the system when nothing is saved', () => {
    TestBed.inject(ThemeService);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
