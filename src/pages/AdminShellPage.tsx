import { Lock } from 'lucide-react';
import { Breadcrumb, Button, Skeleton, TagPill, Tile } from '../components/primitives';
import { useAuth } from '../lib/auth/AuthProvider';
import { usePageMeta } from '../lib/seo/usePageMeta';

export function AdminShellPage() {
  usePageMeta({
    title: 'Owner Dashboard — Kinvai',
    description: 'Private owner administration for Kinvai.',
    noindex: true,
  });

  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="kv-container py-10 max-w-4xl flex flex-col gap-4">
        <Skeleton className="h-10 w-60" rounded="md" />
        <Skeleton className="h-56 w-full" rounded="lg" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="kv-container py-14 max-w-xl">
        <Tile variant="white" radius="xl" padding="lg" className="flex flex-col items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-stone inline-flex items-center justify-center text-ink">
            <Lock size={20} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <TagPill>Restricted</TagPill>
          <h1 className="type-h2 font-semibold text-ink">Owner access required.</h1>
          <p className="text-sm text-ink-2">
            This private administration workspace is protected by server-side authorization and
            database row-level security.
          </p>
          <div className="mt-2 flex gap-3">
            <Button variant="primary" to="/account">
              Sign in
            </Button>
            <Button variant="secondary" to="/">
              Back home
            </Button>
          </div>
        </Tile>
      </div>
    );
  }

  return (
    <div className="kv-container py-8 md:py-12 flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Owner dashboard' }]} />
      <Tile variant="white" radius="xl" padding="lg">
        <TagPill tone="brand">Owner authenticated</TagPill>
        <h1 className="type-h1 font-semibold text-ink mt-3">Owner dashboard</h1>
        <p className="type-body text-ink-2 mt-2 prose-measure">
          Catalogue management, media generation, file uploads, orders and settings modules connect
          here in the administration phase.
        </p>
      </Tile>
    </div>
  );
}
