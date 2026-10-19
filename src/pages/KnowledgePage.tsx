import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ArticleCard from '../components/knowledge/ArticleCard';
import { knowledgeRepository } from '../knowledge/content';
import { knowledgeCategories } from '../knowledge/types';

export default function KnowledgePage({ onArticle, initialCategory = '' }: { onArticle: (slug: string) => void; initialCategory?: string }) {
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState('');
  const articles = useMemo(() => knowledgeRepository.list({ category: category || undefined, query }), [category, query]);
  return <div className="wrap knowledge-page"><div className="knowledge-heading"><p className="eyebrow">TVD · ЕКСПЕРТНІ МАТЕРІАЛИ</p><h1>База знань</h1><p>Матеріали про обладнання та інженерні системи від команди TVD.</p></div><div className="knowledge-controls"><label className="knowledge-search"><Search/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Пошук статей" aria-label="Пошук у базі знань"/></label><div className="knowledge-filters" aria-label="Фільтр категорій"><button className={!category?'active':''} onClick={()=>setCategory('')}>Усі теми</button>{knowledgeCategories.map((item)=><a className={category===item.slug?'active':''} href={`/knowledge/category/${item.slug}`} key={item.slug} onClick={event=>{event.preventDefault();setCategory(item.slug);}}>{item.title}</a>)}</div></div>{articles.length?<div className="knowledge-grid">{articles.map(article=><ArticleCard key={article.slug} article={article} onOpen={onArticle}/>)}</div>:<div className="knowledge-empty"><span>Поки що немає опублікованих матеріалів за цим запитом.</span>{query||category?<button className="text-link" onClick={()=>{setQuery('');setCategory('');}}>Очистити фільтри</button>:null}</div>}</div>;
}
