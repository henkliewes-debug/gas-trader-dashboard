interface Article {
  title: string
  url: string
  source: string
  publishedAt: Date | string
}

export default function NewsFeed({ articles }: { articles: Article[] }) {
  return (
    <div className="card h-full">
      <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">📰 Energy News</h2>
      <div className="space-y-2 overflow-y-auto max-h-80">
        {articles.map((article, i) => (
          <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
            className="block p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
            <p className="text-sm font-medium text-gray-200 leading-snug line-clamp-2">{article.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-blue-400 font-medium">{article.source}</span>
              <span className="text-xs text-gray-500">{new Date(article.publishedAt).toLocaleDateString('nl-NL')}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
