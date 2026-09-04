import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/cn';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}

export const Reveal = ({ children, delay = 0, className }: RevealProps) => {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.65, 0.35, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const SectionHeading = ({
  title,
  subtitle,
  align = 'center',
}: {
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}) => (
  <Reveal
    className={cn(
      'mb-10 flex flex-col gap-2',
      align === 'center' ? 'items-center text-center' : 'items-start text-left'
    )}
  >
    {subtitle ? (
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
        {subtitle}
      </span>
    ) : null}
    <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
      {title}
    </h2>
    <span
      aria-hidden="true"
      className="mt-1 h-[3px] w-16 rounded-full bg-gradient-to-r from-primary to-accent"
    />
  </Reveal>
);

export const Section = ({
  id,
  children,
  className,
  ariaLabel,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) => (
  <section
    id={id}
    aria-label={ariaLabel}
    className={cn('scroll-mt-20 py-16 md:py-24', className)}
  >
    <div className="container-site">{children}</div>
  </section>
);

export const Badge = ({
  children,
  tone = 'primary',
}: {
  children: React.ReactNode;
  tone?: 'primary' | 'accent' | 'neutral' | 'success' | 'warning';
}) => {
  const tones: Record<string, string> = {
    primary: 'bg-primary/10 text-primary border-primary/25',
    accent: 'bg-accent/10 text-accent border-accent/25',
    neutral: 'bg-elevated text-muted border-border',
    success: 'bg-success/10 text-success border-success/25',
    warning: 'bg-warning/10 text-warning border-warning/25',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone]
      )}
    >
      {children}
    </span>
  );
};

export const CardSkeleton = () => (
  <div className="panel p-5">
    <Skeleton className="mb-3 h-5 w-3/4" />
    <Skeleton className="mb-2 h-3 w-full" />
    <Skeleton className="mb-2 h-3 w-5/6" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

export const EmptyState = ({ message, hint }: { message: string; hint?: string }) => (
  <div className="panel flex flex-col items-center gap-1.5 px-6 py-12 text-center">
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mb-2 h-9 w-9 text-faint"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 7h18M3 12h18M3 17h10" strokeLinecap="round" />
    </svg>
    <p className="font-medium text-muted">{message}</p>
    {hint ? <p className="text-sm text-faint">{hint}</p> : null}
  </div>
);

export const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <div
    role="alert"
    className="panel flex flex-col items-center gap-3 border-danger/30 px-6 py-10 text-center"
  >
    <p className="text-danger">{message}</p>
    {onRetry ? (
      <button
        onClick={onRetry}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong dark:text-slate-900"
      >
        Try again
      </button>
    ) : null}
  </div>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-elevated', className)} />
);
