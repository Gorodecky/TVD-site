import { knowledgeArticles } from 'virtual:tvd-knowledge-index';
import type { KnowledgeArticle } from './types';

const articles = knowledgeArticles as KnowledgeArticle[];

export const knowledgeRepository = {
  list({ category, query }: { category?: string; query?: string } = {}) {
    const normalizedQuery = query?.trim().toLocaleLowerCase('uk-UA');
    return articles.filter((article) => {
      const categoryMatches = !category || article.category === category;
      const queryMatches = !normalizedQuery || [article.title, article.description, article.author, ...article.tags, article.html.replace(/<[^>]*>/g, ' ')].join(' ').toLocaleLowerCase('uk-UA').includes(normalizedQuery);
      return categoryMatches && queryMatches;
    });
  },
  getBySlug(slug: string) { return articles.find((article) => article.slug === slug); },
  recommended(limit = 3) { return articles.slice(0, limit); },
};
