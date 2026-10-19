import { useEffect } from 'react';
import { buildOrganizationSchema, buildWebSiteSchema, safeJsonLd, SITE_ORIGIN } from '../seo';

export type SeoProps = { title: string; description: string; path: string; image?: string; type?: 'website' | 'article'; noIndex?: boolean; noCanonical?: boolean; schemas?: unknown[] };

function meta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) { element = document.createElement('meta'); if (property) element.setAttribute('property', name); else element.name = name; document.head.append(element); }
  element.content = content;
}

export default function Seo({ title, description, path, image = '/logo_tvd_new2.png', type = 'website', noIndex = false, noCanonical = false, schemas = [] }: SeoProps) {
  useEffect(() => {
    const origin = SITE_ORIGIN.startsWith('https://tvd.vn.ua') && !import.meta.env.VITE_SITE_URL ? window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '') : SITE_ORIGIN;
    const canonicalUrl = `${origin}${path}`;
    document.title = title;
    meta('description', description);
    meta('robots', noIndex ? 'noindex,follow' : 'index,follow');
    meta('og:type', type, true); meta('og:locale', 'uk_UA', true); meta('og:site_name', 'TVD', true);
    meta('og:title', title, true); meta('og:description', description, true); meta('og:url', canonicalUrl, true);
    meta('og:image', image.startsWith('http') ? image : `${origin}${image.startsWith('/') ? '' : '/'}${image}`, true);
    meta('twitter:card', 'summary_large_image'); meta('twitter:title', title); meta('twitter:description', description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (noCanonical) canonical?.remove();
    else { if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); } canonical.href = canonicalUrl; }
    let script = document.head.querySelector<HTMLScriptElement>('#tvd-jsonld');
    if (!script) { script = document.createElement('script'); script.id = 'tvd-jsonld'; script.type = 'application/ld+json'; document.head.append(script); }
    const siteSchemas = [buildOrganizationSchema(origin), buildWebSiteSchema(origin)];
    script.textContent = safeJsonLd([...siteSchemas, ...schemas]);
  }, [title, description, path, image, type, noIndex, noCanonical, schemas]);
  return null;
}
