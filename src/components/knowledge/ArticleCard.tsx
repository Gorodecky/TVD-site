import { ArrowUpRight } from 'lucide-react';
import { knowledgeCategories, type KnowledgeArticle } from '../../knowledge/types';

export default function ArticleCard({ article, onOpen }: { article: KnowledgeArticle; onOpen: (slug: string) => void }) {
  const category = knowledgeCategories.find((item) => item.slug === article.category);
  return <article className="knowledge-card"><button className="knowledge-card-cover" onClick={() => onOpen(article.slug)} aria-label={`Відкрити статтю: ${article.title}`}><img src={article.cover} alt="" loading="lazy"/></button><div className="knowledge-card-body"><span className="knowledge-category-label">{category?.title}</span><h2><a href={`/knowledge/${encodeURIComponent(article.slug)}`} onClick={event=>{event.preventDefault();onOpen(article.slug);}}>{article.title}</a></h2><p>{article.description}</p><div className="knowledge-card-meta"><time dateTime={article.publishedAt}>{new Intl.DateTimeFormat('uk-UA',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${article.publishedAt}T00:00:00`))}</time><button onClick={() => onOpen(article.slug)} aria-label="Читати статтю"><ArrowUpRight/></button></div></div></article>;
}
