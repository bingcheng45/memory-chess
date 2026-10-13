'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from "@/i18n/navigation";
import { z } from 'zod';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { CONTACT_MAX_LENGTH, CONTACT_TYPES, isContactFailure } from '@/lib/contact';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Built from the translator rather than declared at module scope: the
// validation messages are user-facing copy and have to follow the locale.
function buildFormSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(2, { message: t('validation.nameTooShort') }),
    email: z.string().email({ message: t('validation.emailInvalid') }),
    type: z.string({ required_error: t('validation.typeRequired') }),
    message: z.string().min(10, { message: t('validation.messageTooShort') }),
  });
}

type FormValues = z.infer<ReturnType<typeof buildFormSchema>>;

export default function ContactUs() {
  const t = useTranslations('contact');
  const formSchema = useMemo(() => buildFormSchema(t), [t]);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const sentHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (submitSuccess) sentHeadingRef.current?.focus();
  }, [submitSuccess]);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      type: '',
      message: '',
    },
  });

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setFormError(null);
    // What the status line says if the send fails: the generic words unless a step below knows better.
    let failure = t('errors.generic');
    try {
      // Explicitly check that inquiry type is selected
      if (!data.type || data.type.trim() === '') {
        form.setError('type', {
          type: 'manual',
          message: t('validation.typeRequired')
        });
        failure = t('validation.typeRequired');
        throw new Error('Inquiry type is required');
      }

      // Send data to our API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (isContactFailure(result.reason)) failure = t(`errors.reasons.${result.reason}`);

        // Log additional debug info if available
        if (result.debug) {
          console.error('Debug information:', result.debug);
        }

        throw new Error(result.error || 'Failed to submit form');
      }

      console.log('Form submission result:', result);

      setSubmitSuccess(true);
      form.reset();

      // Redirect to home page after success
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormError(failure);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="lab-read-head lab-contact-head">
        <h1>{t("title")}</h1>
      </header>

      {/* The sent note takes the form's place in the same grid cell, so the page below does not move. */}
      <div className="lab-contact-card">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="lab-contact-form"
            noValidate
            inert={submitSuccess}
            data-sent={submitSuccess || undefined}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: ControllerRenderProps<FormValues, "name"> }) => (
                <FormItem className="lab-field">
                  <FormLabel>{t("name")}</FormLabel>
                  <FormDescription className="lab-hint">{t("hints.name")}</FormDescription>
                  <FormControl>
                    <input className="lab-input" autoComplete="name" maxLength={CONTACT_MAX_LENGTH.name} placeholder={t("namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage className="lab-field-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }: { field: ControllerRenderProps<FormValues, "email"> }) => (
                <FormItem className="lab-field">
                  <FormLabel>{t("email")}</FormLabel>
                  <FormDescription className="lab-hint">{t("hints.email")}</FormDescription>
                  <FormControl>
                    <input
                      className="lab-input"
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      maxLength={CONTACT_MAX_LENGTH.email}
                      placeholder={t("emailPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="lab-field-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }: { field: ControllerRenderProps<FormValues, "type"> }) => (
                <FormItem className="lab-field">
                  <FormLabel>{t("inquiryType")}</FormLabel>
                  <FormDescription className="lab-hint">{t("hints.type")}</FormDescription>
                  <FormControl>
                    <select className="lab-input lab-select" {...field}>
                      <option value="" disabled>{t("inquiryPlaceholder")}</option>
                      {Object.entries(CONTACT_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>{t(`types.${label}`)}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage className="lab-field-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }: { field: ControllerRenderProps<FormValues, "message"> }) => (
                <FormItem className="lab-field">
                  <FormLabel>{t("message")}</FormLabel>
                  <FormDescription className="lab-hint">{t("hints.message")}</FormDescription>
                  <FormControl>
                    <textarea className="lab-input lab-textarea" rows={6} maxLength={CONTACT_MAX_LENGTH.message} placeholder={t("messagePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage className="lab-field-error" />
                </FormItem>
              )}
            />

            <div className="lab-contact-actions">
              <button
                type="submit"
                className="lab-btn lab-btn-primary lab-contact-submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting && <span className="lab-spinner" aria-hidden="true" />}
                {isSubmitting ? t('sending') : t('send')}
              </button>
              <div className="lab-contact-status" role="status">
                {isSubmitting && <span className="lab-sr">{t('sending')}</span>}
                {formError && (
                  <p className="lab-contact-error">
                    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 4.5v4.5M8 11.2v.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    {formError}
                  </p>
                )}
              </div>
            </div>
          </form>
        </Form>

        {submitSuccess && (
          <div className="lab-contact-sent">
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="m7.5 12.5 3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 ref={sentHeadingRef} tabIndex={-1}>{t("sentTitle")}</h2>
            <p>{t("sentBody")}</p>
            <p className="lab-contact-redirect">{t("redirecting")}</p>
          </div>
        )}
      </div>
    </>
  );
}
