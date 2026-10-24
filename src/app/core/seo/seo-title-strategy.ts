import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL } from './site';

/** Route data keys read by the strategy. */
export interface SeoRouteData {
  description?: string;
  /** Public, indexable page. Every other route gets `noindex, nofollow`. */
  indexable?: boolean;
}

/**
 * Sets the document title, meta description, robots, canonical and Open Graph
 * tags on every navigation from the route's `title` and `data`.
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    const data = this.deepestData(snapshot.root);
    const title = routeTitle ? `${routeTitle} | ${SITE_NAME}` : DEFAULT_TITLE;
    const description = data.description ?? DEFAULT_DESCRIPTION;
    const path = snapshot.url.split(/[?#]/)[0] || '/';
    const url = `${SITE_URL}${path === '/' ? '/' : path}`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({
      name: 'robots',
      content: data.indexable ? 'index, follow' : 'noindex, nofollow',
    });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.setCanonical(url);
  }

  private deepestData(route: ActivatedRouteSnapshot): SeoRouteData {
    let current = route;
    let data: SeoRouteData = { ...(current.data as SeoRouteData) };
    while (current.firstChild) {
      current = current.firstChild;
      data = { ...data, ...(current.data as SeoRouteData) };
    }
    return data;
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }
}
