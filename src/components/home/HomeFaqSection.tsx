import { Link } from 'react-router-dom';
import { getPublicConfig } from '../../lib/config';
import { buildPaymentAssuranceCopy } from '../../lib/home/homeHelpers';
import { SplitHeadline } from '../../lib/motion';
import { Accordion, type AccordionItemData, Button } from '../primitives';

/**
 * Section 12 — FAQ:
 * Six exact questions in an accessible Accordion, accurate to Kinvai's real checkout & delivery flow.
 * Unconfirmed policy lines are explicitly marked // OWNER_CONFIRM and tracked in /docs/CLAIMS_TO_CONFIRM.md.
 */
export function HomeFaqSection() {
  const { flags } = getPublicConfig();
  const paymentLine = buildPaymentAssuranceCopy(flags);

  const faqItems: AccordionItemData[] = [
    {
      id: 'receive',
      title: 'What do I receive?',
      content: (
        <p>
          You receive the exact downloadable digital files listed on the product page (such as
          spreadsheets, playbooks, Notion/Markdown templates, creative kits or UI packages) along
          with a personal lifetime licence. Nothing physical is shipped. Read full usage rights in
          our{' '}
          <Link to="/licence" viewTransition className="text-brand-deep underline underline-offset-2 font-medium">
            Licence
          </Link>
          .
        </p>
      ),
    },
    {
      id: 'download',
      title: 'How do I download it?',
      content: (
        <p>
          As soon as your payment is verified on the server, the product is added to your Kinvai
          account library. You can generate a secure, expiring download link immediately after
          checkout and re-download any time from your account. See the full flow on{' '}
          <Link to="/how-it-works" viewTransition className="text-brand-deep underline underline-offset-2 font-medium">
            How it works
          </Link>
          .
        </p>
      ),
    },
    {
      id: 'refunds',
      title: 'What is the refund policy?',
      content: (
        // OWNER_CONFIRM — refund eligibility window & digital-goods terms listed in /docs/CLAIMS_TO_CONFIRM.md
        <p>
          Because Kinvai sells downloadable digital files that unlock immediately on purchase,
          refunds are handled on a clear, fair policy for defective, mismatched or undownloaded
          files. Read the exact terms before buying on the{' '}
          <Link to="/legal/refunds" viewTransition className="text-brand-deep underline underline-offset-2 font-medium">
            Refund Policy
          </Link>{' '}
          page, or write to{' '}
          <a href="mailto:heyarkvoid@gmail.com" className="text-brand-deep underline underline-offset-2 font-medium">
            heyarkvoid@gmail.com
          </a>
          .
        </p>
      ),
    },
    {
      id: 'apps',
      title: 'Which apps do I need?',
      content: (
        <p>
          Every product page lists its exact file formats (for example XLSX, Google Sheets, PDF,
          Markdown, Figma or ZIP) and system requirements before you add it to your cart, so there
          are no surprises after purchase.
        </p>
      ),
    },
    {
      id: 'updates',
      title: 'Do I get updates?',
      content: (
        // OWNER_CONFIRM — lifetime minor/version update scope listed in /docs/CLAIMS_TO_CONFIRM.md
        <p>
          Yes — updates released for the version of a system you purchased are uploaded directly to
          the same product record and become available in your account library at no extra charge.
          See details in our{' '}
          <Link to="/licence" viewTransition className="text-brand-deep underline underline-offset-2 font-medium">
            Licence
          </Link>
          .
        </p>
      ),
    },
    {
      id: 'security',
      title: 'Is checkout secure?',
      content: (
        <p>
          Yes. {paymentLine} Prices are calculated and verified on Kinvai&apos;s server, payment
          credentials are never stored on our servers, and every download link is privately signed
          only for verified purchasers. Learn more on{' '}
          <Link to="/how-it-works" viewTransition className="text-brand-deep underline underline-offset-2 font-medium">
            How it works
          </Link>
          .
        </p>
      ),
    },
  ];

  return (
    <section
      aria-labelledby="home-faq-heading"
      className="rounded-[28px] lg:rounded-[36px] bg-surface border border-line p-6 sm:p-10 lg:p-14"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <span className="type-label text-ink-2">Common questions</span>
          <SplitHeadline
            id="home-faq-heading"
            as="h2"
            immediate={false}
            text="Questions, *answered.*"
            className="type-h2 font-semibold text-ink"
          />
          <p className="type-body text-ink-2 max-w-[38ch]">
            Straight answers on files, licences, downloads and checkout. Need something specific?
            Write straight to Arkvoid Inc.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button variant="secondary" to="/support">
              Visit support
            </Button>
            <Button variant="quiet" to="/contact">
              Contact us
            </Button>
          </div>
        </div>

        <div className="lg:col-span-7">
          <Accordion items={faqItems} defaultOpenIds={['receive']} />
        </div>
      </div>
    </section>
  );
}
