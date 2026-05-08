"use client";

// ─── ErrorBoundary ──────────────────────────────────────────────────────────
// Generic React error boundary — wraps a subtree, reports the crash to
// Sentry, and renders a recoverable fallback. For top-level Next.js
// segment errors, prefer the framework's `error.tsx` / `global-error.tsx`
// (which we wire to Sentry separately). Use this component for islands
// where you want a localised fallback without bringing down the whole
// page (e.g. a chart that depends on a flaky third-party renderer).

import * as Sentry from "@sentry/nextjs";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional render function for the fallback UI. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Optional context tag attached to the Sentry event. */
  tag?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    Sentry.withScope((scope) => {
      if (this.props.tag) scope.setTag("boundary", this.props.tag);
      scope.setContext("react", { componentStack: info.componentStack ?? "" });
      Sentry.captureException(error);
    });
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return (
      <div role="alert" style={{ padding: "1rem", color: "#b00020" }}>
        <h2>Something went wrong.</h2>
        <p>{error.message}</p>
        <button type="button" onClick={this.reset}>
          Try again
        </button>
      </div>
    );
  }
}
