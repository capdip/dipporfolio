import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ContactSubmissionInput } from '../../../../shared/types';
import { api } from '../../lib/api';
import { useSettings } from '../../hooks/useContent';
import { Reveal, Section, SectionHeading } from '../ui/primitives';

const DEFAULT_PURPOSES = ['Collaboration', 'Opportunity', 'Question', 'Other'];

interface FormFields {
  name: string;
  email: string;
  organization: string;
  subject: string;
  purpose: string;
  message: string;
  honeypot: string;
}

const EMPTY_FORM: FormFields = {
  name: '',
  email: '',
  organization: '',
  subject: '',
  purpose: '',
  message: '',
  honeypot: '',
};

const inputClasses =
  'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25';

export default function ContactSection() {
  const settingsQuery = useSettings();
  const [fields, setFields] = useState<FormFields>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const purposes = settingsQuery.data?.contactPurposes?.length
    ? settingsQuery.data.contactPurposes
    : DEFAULT_PURPOSES;

  const mutation = useMutation({
    mutationFn: (input: ContactSubmissionInput) => api.submitContact(input),
    onSuccess: () => {
      setSubmitted(true);
      setFields(EMPTY_FORM);
      setErrors({});
    },
  });

  const update = (key: keyof FormFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormFields, string>> = {};
    if (!fields.name.trim()) next.name = 'Please enter your name.';
    if (!fields.email.trim()) next.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
      next.email = 'Please enter a valid email address.';
    if (!fields.subject.trim()) next.subject = 'Please enter a subject.';
    if (!fields.purpose) next.purpose = 'Please choose a purpose.';
    if (!fields.message.trim()) next.message = 'Please enter a message.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      name: fields.name.trim(),
      email: fields.email.trim(),
      organization: fields.organization.trim() || undefined,
      subject: fields.subject.trim(),
      purpose: fields.purpose,
      message: fields.message.trim(),
      honeypot: fields.honeypot,
    });
  };

  return (
    <Section id="contact" ariaLabel="Contact">
      <SectionHeading title="Get in Touch" subtitle="Contact" />
      <Reveal>
        {submitted ? (
          <div className="panel mx-auto flex max-w-2xl flex-col items-center gap-4 p-10 text-center" role="status">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-7 w-7">
                <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="font-heading text-xl font-semibold text-foreground">Message sent!</h2>
            <p className="max-w-md text-sm text-muted">
              Thank you for reaching out. I will get back to you as soon as possible.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              Send another message
            </button>
          </div>
        ) : mutation.isError ? (
          <div className="panel mx-auto max-w-2xl p-6 text-center">
            <p className="text-danger mb-3">
              {mutation.error instanceof Error
                ? `Could not send your message: ${mutation.error.message}`
                : 'Could not send your message. Please try again.'}
            </p>
            <button
              type="button"
              onClick={() => mutation.reset()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong dark:text-slate-900"
            >
              Try again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="panel mx-auto max-w-2xl space-y-5 p-6 md:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="home-contact-name" className="mb-1.5 block text-sm font-medium text-foreground">
                  Name <span aria-hidden="true" className="text-danger">*</span>
                </label>
                <input
                  id="home-contact-name"
                  type="text"
                  value={fields.name}
                  onChange={(event) => update('name', event.target.value)}
                  className={inputClasses}
                  aria-invalid={Boolean(errors.name)}
                  required
                />
                {errors.name ? (
                  <p role="alert" className="mt-1 text-xs text-danger">{errors.name}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="home-contact-email" className="mb-1.5 block text-sm font-medium text-foreground">
                  Email <span aria-hidden="true" className="text-danger">*</span>
                </label>
                <input
                  id="home-contact-email"
                  type="email"
                  value={fields.email}
                  onChange={(event) => update('email', event.target.value)}
                  className={inputClasses}
                  aria-invalid={Boolean(errors.email)}
                  required
                />
                {errors.email ? (
                  <p role="alert" className="mt-1 text-xs text-danger">{errors.email}</p>
                ) : null}
              </div>
            </div>
            <div>
              <label htmlFor="home-contact-organization" className="mb-1.5 block text-sm font-medium text-foreground">
                Organization <span className="text-xs text-faint">(optional)</span>
              </label>
              <input
                id="home-contact-organization"
                type="text"
                value={fields.organization}
                onChange={(event) => update('organization', event.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="home-contact-subject" className="mb-1.5 block text-sm font-medium text-foreground">
                Subject <span aria-hidden="true" className="text-danger">*</span>
              </label>
              <input
                id="home-contact-subject"
                type="text"
                value={fields.subject}
                onChange={(event) => update('subject', event.target.value)}
                className={inputClasses}
                aria-invalid={Boolean(errors.subject)}
                required
              />
              {errors.subject ? (
                <p role="alert" className="mt-1 text-xs text-danger">{errors.subject}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="home-contact-purpose" className="mb-1.5 block text-sm font-medium text-foreground">
                Purpose <span aria-hidden="true" className="text-danger">*</span>
              </label>
              <select
                id="home-contact-purpose"
                value={fields.purpose}
                onChange={(event) => update('purpose', event.target.value)}
                className={inputClasses}
                aria-invalid={Boolean(errors.purpose)}
                required
              >
                <option value="" disabled>Select a purpose...</option>
                {purposes.map((purpose) => (
                  <option key={purpose} value={purpose}>{purpose}</option>
                ))}
              </select>
              {errors.purpose ? (
                <p role="alert" className="mt-1 text-xs text-danger">{errors.purpose}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="home-contact-message" className="mb-1.5 block text-sm font-medium text-foreground">
                Message <span aria-hidden="true" className="text-danger">*</span>
              </label>
              <textarea
                id="home-contact-message"
                rows={5}
                value={fields.message}
                onChange={(event) => update('message', event.target.value)}
                className={inputClasses}
                aria-invalid={Boolean(errors.message)}
                required
              />
              {errors.message ? (
                <p role="alert" className="mt-1 text-xs text-danger">{errors.message}</p>
              ) : null}
            </div>
            <div hidden aria-hidden="true">
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={fields.honeypot}
                onChange={(event) => update('honeypot', event.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-900 sm:w-auto"
            >
              {mutation.isPending ? 'Sending...' : 'Send message'}
            </button>
          </form>
        )}
      </Reveal>
    </Section>
  );
}
