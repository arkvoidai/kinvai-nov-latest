import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { getSiteAnnouncement, type SiteAnnouncement } from '../../lib/data/repository';

const DISMISS_KEY = 'kinvai.announcement.dismissed.v1';

/**
 * Site-wide announcement strip driven by `site_settings.announcement`.
 * Completely hidden when disabled, empty, or dismissed for the session.
 */
export function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<SiteAnnouncement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    getSiteAnnouncement()
      .then((data) => {
        if (!active || !data || !data.enabled || !data.message) return;
        try {
          const dismissedMsg = window.sessionStorage.getItem(DISMISS_KEY);
          if (dismissedMsg === data.message) {
            setDismissed(true);
            return;
          }
        } catch {
          // Ignore sessionStorage restrictions
        }
        setAnnouncement(data);
      })
      .catch(() => {
        // Silent — hidden when unavailable
      });

    return () => {
      active = false;
    };
  }, []);

  if (!announcement || !announcement.enabled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, announcement.message);
    } catch {
      // Ignore
    }
  };

  const isInternalHref =
    announcement.href && announcement.href.startsWith('/') && !announcement.href.startsWith('//');

  return (
    <div
      role="region"
      aria-label="Site announcement"
      className="bg-ink text-ink-on-dark text-xs sm:text-sm"
    >
      <div className="kv-container min-h-[40px] py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" aria-hidden="true" />
          <p className="truncate font-medium text-ink-on-dark">{announcement.message}</p>
          {announcement.href && (
            isInternalHref ? (
              <Link
                to={announcement.href}
                viewTransition
                className="inline-flex items-center gap-1 font-medium text-white underline underline-offset-4 shrink-0 hover:text-peach transition-colors"
              >
                <span>{announcement.label || 'Learn more'}</span>
                <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
              </Link>
            ) : (
              <a
                href={announcement.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-white underline underline-offset-4 shrink-0 hover:text-peach transition-colors"
              >
                <span>{announcement.label || 'Learn more'}</span>
                <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
              </a>
            )
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="w-7 h-7 rounded-full inline-flex items-center justify-center text-ink-on-dark-muted hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        >
          <X size={15} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
