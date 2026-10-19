export const knowledgeCategories = [
  { slug: 'heat-pumps', title: 'Теплові насоси' },
  { slug: 'gas-boilers', title: 'Газові котли' },
  { slug: 'alternative-heating', title: 'Альтернативне опалення' },
  { slug: 'wastewater-treatment', title: 'Очищення стічних вод' },
] as const;

export type KnowledgeCategory = (typeof knowledgeCategories)[number]['slug'];
export type KnowledgeArticle = {
  title: string;
  slug: string;
  description: string;
  category: KnowledgeCategory;
  cover: string;
  author: string;
  status: 'draft' | 'published';
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  relatedCategories: string[];
  relatedBrands: string[];
  relatedProductIds: string[];
  html: string;
};

export type KnowledgeArticleMeta = Omit<KnowledgeArticle, 'html'>;
