import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center"
    >
      <p className="font-heading text-7xl font-bold text-gradient md:text-9xl">404</p>
      <h1 className="mt-4 font-heading text-2xl font-bold text-foreground md:text-3xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-muted">
        The page you are looking for may have been moved, renamed, or never existed. Let us get you
        back on track.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong dark:text-slate-900"
        >
          Back to home
        </Link>
        <Link
          to="/contact"
          className="rounded-lg border border-border bg-surface px-6 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
        >
          Contact me
        </Link>
      </div>
    </main>
  );
}
