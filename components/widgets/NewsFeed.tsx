interface Article {
  title: string
  url: string
  source: string
  publishedAt: string
}

function fmtDate(raw: string): string {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate();
    const mon = d.toLocaleString('en', { month: 'short' });
    const yr = d.getFullYear();
    return `${day} ${mon} ${yr}`;
  } catch {
    return '';
  }
}

export default function NewsFeed({ articles }: { articles: Article[] }) {
  return (
    <div className="card h-full">
      <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">📰 Energy News</h2>
      <div className="space-y-2 overflow-y-auto max-h-96">
        {articles.map((article, i) => (
          <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
            className="block p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
            <p className="text-sm font-medium text-gray-200 leading-snug line-clamp-2">{article.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-blue-400 font-medium">{article.source}</span>
              {fmtDate(article.publishedAt) && (
                <span className="text-xs text-gray-500">{fmtDate(article.publishedAt)}</span>
              )}
            </div>
          </a>
        ))}
        {articles.length === 0 && (
          <p className="text-sm text-gray-500 italic">No news available</p>
        )}
      </div>
    </div>
  )
}
