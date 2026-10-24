import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { SeoTitleStrategy } from './seo-title-strategy';
import { DEFAULT_DESCRIPTION, SITE_URL } from './site';

@Component({ template: '' })
class Blank {}

describe('SeoTitleStrategy', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'login',
            title: 'Giriş yap',
            data: { indexable: true, description: 'Giriş açıklaması' },
            component: Blank,
          },
          { path: 'dashboard', title: 'Panel', component: Blank },
        ]),
        { provide: TitleStrategy, useClass: SeoTitleStrategy },
      ],
    });
  });

  const meta = (selector: string) =>
    document.head.querySelector<HTMLMetaElement>(`meta[${selector}]`)?.content;

  it('sets title, description, canonical and index for public pages', async () => {
    await TestBed.inject(Router).navigateByUrl('/login?email=a');
    expect(document.title).toBe('Giriş yap | OdivonPro Beauty');
    expect(meta('name="description"')).toBe('Giriş açıklaması');
    expect(meta('name="robots"')).toBe('index, follow');
    expect(meta('property="og:url"')).toBe(`${SITE_URL}/login`);
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe(
      `${SITE_URL}/login`,
    );
  });

  it('keeps private pages out of search results', async () => {
    await TestBed.inject(Router).navigateByUrl('/dashboard');
    expect(document.title).toBe('Panel | OdivonPro Beauty');
    expect(meta('name="description"')).toBe(DEFAULT_DESCRIPTION);
    expect(meta('name="robots"')).toBe('noindex, nofollow');
  });
});
