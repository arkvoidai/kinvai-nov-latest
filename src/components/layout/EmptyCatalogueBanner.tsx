import { useState, type FormEvent } from 'react';
import { Button, Input, TagPill, Tile, useToast } from '../primitives';

/**
 * Charter rule 7(d): rendered when Supabase is empty and flags.allowSeedFallback is false.
 * Submits real email signups to POST /api/newsletter with honeypot validation.
 */
export function EmptyCatalogueBanner() {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, website: honeypot }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(body.error || "That didn't work. Try again, or write to heyarkvoid@gmail.com.");
        return;
      }

      setSubmitted(true);
      toast({
        title: 'You are on the list',
        description: body.message || 'We will write once the catalogue opens.',
        tone: 'success',
      });
    } catch {
      setError("That didn't work. Try again, or write to heyarkvoid@gmail.com.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Tile variant="tint-peach" radius="xl" padding="lg" className="max-w-2xl mx-auto">
      <TagPill>Catalogue opening soon</TagPill>
      <h3 className="type-h2 font-semibold text-ink mt-4">
        The shelf is being stocked.
      </h3>
      <p className="type-body text-ink-2 mt-3 prose-measure">
        Ready-made spreadsheets, playbooks, templates and worldbuilding systems are preparing for
        release. Leave your email for one quiet note when the doors open.
      </p>

      {submitted ? (
        <p className="mt-6 text-sm font-medium text-ink">
          You are on the list. Questions in the meantime? Write to{' '}
          <a href="mailto:heyarkvoid@gmail.com" className="text-brand-deep underline">
            heyarkvoid@gmail.com
          </a>
          .
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 items-start">
          {/* Hidden honeypot for spam bots */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
          />
          <div className="w-full sm:flex-1">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              aria-label="Email address for launch notification"
              error={error}
              disabled={submitting}
            />
          </div>
          <Button type="submit" size="md" loading={submitting} className="w-full sm:w-auto">
            Notify me
          </Button>
        </form>
      )}
    </Tile>
  );
}
