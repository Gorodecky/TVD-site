import { useEffect } from 'react';

export default function KnowledgeSeo({ title, description, path }: { title: string; description: string; path: string }) {
  useEffect(() => {
    document.title = title;
    let metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDescription) { metaDescription = document.createElement('meta'); metaDescription.name = 'description'; document.head.append(metaDescription); }
    metaDescription.content = description;
    const siteUrl = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
    canonical.href = `${siteUrl}${path}`;
    return () => { document.title = 'TVD — інженерне обладнання'; metaDescription!.content = 'TVD — інженерне обладнання для професіоналів.'; canonical!.href = `${siteUrl}/`; };
  }, [title, description, path]);
  return null;
}
