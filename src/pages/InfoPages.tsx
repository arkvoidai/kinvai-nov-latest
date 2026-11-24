import { Breadcrumb, Button, TagPill, Tile } from '../components/primitives';
import { usePageMeta } from '../lib/seo/usePageMeta';

interface StaticInfoShellProps {
  crumb: string;
  eyebrow: string;
  title: string;
  lead: string;
  sections: Array<{ heading: string; body: string }>;
  metaTitle: string;
}

function StaticInfoShell({
  crumb,
  eyebrow,
  title,
  lead,
  sections,
  metaTitle,
}: StaticInfoShellProps) {
  usePageMeta({ title: metaTitle, description: lead });

  return (
    <div className="kv-container py-8 md:py-12 max-w-4xl flex flex-col gap-8">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: crumb }]} />
      <div className="flex flex-col gap-3">
        <TagPill>{eyebrow}</TagPill>
        <h1 className="type-h1 font-semibold text-ink mt-1">{title}</h1>
        <p className="type-body text-ink-2 prose-measure">{lead}</p>
      </div>

      <div className="flex flex-col gap-4">
        {sections.map((sec) => (
          <Tile key={sec.heading} variant="white" radius="lg" padding="md">
            <h2 className="type-h3 font-semibold text-ink">{sec.heading}</h2>
            <p className="text-[15px] text-ink-2 mt-2 leading-relaxed prose-measure">{sec.body}</p>
          </Tile>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" to="/shop">
          Explore the shop
        </Button>
        <Button variant="secondary" to="/support">
          Contact support
        </Button>
      </div>
    </div>
  );
}

export function AboutPage() {
  return (
    <StaticInfoShell
      crumb="About"
      eyebrow="Arkvoid Inc."
      title="Built properly once."
      lead="Kinvai is an owner-operated storefront by Arkvoid Inc. for downloadable spreadsheets, playbooks, templates, creative packs, worldbuilding collections and interface kits."
      metaTitle="About — Kinvai"
      sections={[
        {
          heading: 'Why Kinvai exists',
          body: 'Every serious operator, writer, maker or product builder ends up recreating the same foundational files from scratch. Kinvai publishes finished, editable systems so you skip the blank page and start at step two.',
        },
        {
          heading: 'Direct from the author',
          body: 'Kinvai is not a third-party marketplace. Every file in the catalogue is authored, maintained and supported directly by Manish Talukdar at Arkvoid Inc.',
        },
      ]}
    />
  );
}

export function HowItWorksPage() {
  return (
    <StaticInfoShell
      crumb="How it works"
      eyebrow="Digital delivery"
      title="From checkout to working file in under a minute."
      lead="No subscriptions, no shipping delays, no account hoops. Pay once in USD and download directly from your private Kinvai library."
      metaTitle="How it works — Kinvai"
      sections={[
        {
          heading: '1. Pick your system',
          body: 'Every product page lists exact file formats, included deliverables, software requirements and your first-hour checklist before you buy.',
        },
        {
          heading: '2. Verified checkout',
          body: 'Checkout completes securely through Razorpay or PayPal with server-verified pricing. 1 licence per product. Yours for life.',
        },
        {
          heading: '3. Instant private download',
          body: 'Your account library immediately unlocks time-limited signed download links for the latest release and every future version update.',
        },
      ]}
    />
  );
}

export function SupportPage() {
  return (
    <StaticInfoShell
      crumb="Support"
      eyebrow="Help"
      title="Direct human support."
      lead="Need help with a download, receipt, licence question or file format? Write directly to heyarkvoid@gmail.com."
      metaTitle="Support — Kinvai"
      sections={[
        {
          heading: 'Email',
          body: 'Send your order number or question to heyarkvoid@gmail.com. Every message is answered by the team at Arkvoid Inc.',
        },
        {
          heading: 'Updates & announcements',
          body: 'Follow @ArkvoidAI on X for new product releases and version updates.',
        },
      ]}
    />
  );
}

export function LicencePage() {
  return (
    <StaticInfoShell
      crumb="Licence"
      eyebrow="Usage rights"
      title="1 licence per product. Yours for life."
      lead="Simple, plain-language digital licensing designed for real work."
      metaTitle="Licence — Kinvai"
      sections={[
        {
          heading: 'What you can do',
          body: 'Use, duplicate, customize and deploy any Kinvai file across unlimited personal and commercial projects for yourself or your direct business operations.',
        },
        {
          heading: 'What you cannot do',
          body: 'Do not resell, redistribute, bundle into another template marketplace, or publish the raw Kinvai source files as a standalone downloadable product.',
        },
      ]}
    />
  );
}

export function PrivacyPage() {
  return (
    <StaticInfoShell
      crumb="Privacy"
      eyebrow="Legal"
      title="Privacy policy"
      lead="Kinvai collects only the account, order and support information required to deliver your digital purchases and maintain your download library."
      metaTitle="Privacy Policy — Kinvai"
      sections={[
        {
          heading: 'Data we store',
          body: 'When you sign in with Google or complete a purchase, Arkvoid Inc. stores your account identifier, email address, order history, entitlements and download logs solely to provide secure file access.',
        },
        {
          heading: 'Payments & third parties',
          body: 'Card and wallet details are processed directly by Razorpay or PayPal and never touch Kinvai servers. For deletion requests, write to heyarkvoid@gmail.com.',
        },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <StaticInfoShell
      crumb="Terms"
      eyebrow="Legal"
      title="Terms of service"
      lead="Terms governing access to kinvai.arkvoid.com and downloadable digital products sold by Arkvoid Inc."
      metaTitle="Terms of Service — Kinvai"
      sections={[
        {
          heading: 'Digital goods',
          body: 'All products sold on Kinvai are downloadable digital files priced in USD. Access is granted immediately after verified payment confirmation.',
        },
        {
          heading: 'Account responsibility',
          body: 'Keep your sign-in credentials secure. Sharing private download links or redistributing licenced source files violates these terms.',
        },
      ]}
    />
  );
}

export function RefundsPage() {
  return (
    <StaticInfoShell
      crumb="Refunds"
      eyebrow="Legal"
      title="Refund policy"
      lead="Clear, fair handling for digital downloads."
      metaTitle="Refund Policy — Kinvai"
      sections={[
        {
          heading: 'Before you download',
          body: 'Because digital files are delivered instantaneously, refunds are evaluated on a case-by-case basis if a file has not been downloaded or if a technical defect cannot be resolved.',
        },
        {
          heading: 'How to request help',
          body: 'Write to heyarkvoid@gmail.com within 14 days of purchase with your order number and issue description.',
        },
      ]}
    />
  );
}
