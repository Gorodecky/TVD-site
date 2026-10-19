/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_B2B_URL?: string;
  readonly VITE_SITE_URL?: string;
}

declare module 'virtual:tvd-knowledge-index' {
  import type { KnowledgeArticle } from './knowledge/types';
  export const knowledgeArticles: KnowledgeArticle[];
}
