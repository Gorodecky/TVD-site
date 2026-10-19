import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
if (basePath) {
  const rewriteElement = (element: Element) => {
    for (const attribute of ['src', 'href', 'poster']) {
      const value = element.getAttribute(attribute);
      if (value?.startsWith('/') && !value.startsWith('//') && !value.startsWith(`${basePath}/`)) {
        element.setAttribute(attribute, `${basePath}${value}`);
      }
    }
  };
  const rewriteTree = (root: ParentNode) => root.querySelectorAll('[src], [href], [poster]').forEach(rewriteElement);
  rewriteTree(document);
  new MutationObserver((records) => records.forEach((record) => {
    if (record.type === 'attributes' && record.target instanceof Element) rewriteElement(record.target);
    record.addedNodes.forEach((node) => {
      if (node instanceof Element) { rewriteElement(node); rewriteTree(node); }
    });
  })).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'href', 'poster'] });
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
