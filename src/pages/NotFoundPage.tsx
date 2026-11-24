import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, SearchPill, TagPill, Tile } from '../components/primitives';
import { usePageMeta } from '../lib/seo/usePageMeta';

export function NotFoundPage() {
  usePageMeta({
    title: 'Page not found — Kinvai',
    description: 'The requested Kinvai page could not be found.',
    noindex: true,
  });

  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) {
      navigate('/search');
      return;
    }
    navigate(`/search?q=${encodeURIComponent(clean)}`);
  };

  return (
    <div className="kv-container py-14 md:py-24 max-w-2xl">
      <Tile variant="white" radius="xl" padding="lg" className="flex flex-col items-start gap-5">
        <TagPill>404</TagPill>
        <h1 className="type-h1 font-semibold text-ink">
          That page left no <span className="font-accent-serif font-normal">files</span> behind.
        </h1>
        <p className="type-body text-ink-2 prose-measure">
          The link may have moved or never existed. Search the catalogue directly or jump into a
          collection below.
        </p>

        <div className="w-full pt-1">
          <SearchPill
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
            placeholder="Search spreadsheets, kits, worlds..."
          />
        </div>

        <div className="flex flex-wrap gap-2.5 pt-2">
          <Button variant="primary" to="/shop">
            Explore the shop
          </Button>
          <Button variant="secondary" to="/collections">
            Collections
          </Button>
          <Button variant="secondary" to="/support">
            Support
          </Button>
          <Button variant="secondary" to="/">
            Go home
          </Button>
        </div>
      </Tile>
    </div>
  );
}
