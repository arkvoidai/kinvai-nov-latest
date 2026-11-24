import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, Logo, TagPill, Tile } from '../primitives';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Error captured cleanly by UI boundary; avoid leaking stack traces to visitors
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-dvh bg-page text-ink flex items-center justify-center p-6">
        <Tile
          variant="white"
          radius="xl"
          padding="lg"
          className="w-full max-w-lg flex flex-col items-start gap-5 shadow-[var(--shadow-float)]"
        >
          <Logo height={22} />
          <TagPill tone="warning">Unexpected error</TagPill>
          <h1 className="type-h2 font-semibold text-ink">
            Something interrupted this <span className="font-accent-serif font-normal">page.</span>
          </h1>
          <p className="type-body text-ink-2 prose-measure">
            That didn&apos;t work. Try again, or write to{' '}
            <a
              href="mailto:heyarkvoid@gmail.com"
              className="text-brand-deep underline underline-offset-4 hover:text-ink transition-colors"
            >
              heyarkvoid@gmail.com
            </a>
            .
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              variant="primary"
              onClick={this.handleRetry}
              icon={<RefreshCw size={18} strokeWidth={1.75} aria-hidden="true" />}
            >
              Try again
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                this.setState({ hasError: false });
                if (typeof window !== 'undefined') {
                  window.location.assign('/');
                }
              }}
            >
              Go home
            </Button>
          </div>
        </Tile>
      </div>
    );
  }
}
