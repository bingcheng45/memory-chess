'use client';

import { useState, useMemo } from 'react';
import { useRouter } from "@/i18n/navigation";
import { z } from 'zod';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    try {
      // Explicitly check that inquiry type is selected
      if (!data.type || data.type.trim() === '') {
        form.setError('type', {
          type: 'manual',
          message: t('validation.typeRequired')
        });
        setFormError(t('validation.typeRequired'));
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
        // Get detailed error information from response if available
        const errorDetails = result.details ? `: ${result.details}` : '';
        setFormError(t('errors.submitFailed', { details: errorDetails }));
        
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
      // If no specific error was set, set a generic one
      if (!formError) {
        setFormError(t('errors.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary">
      <div className="container mx-auto px-1 sm:px-4 py-8">
        <div className="flex justify-center mb-8">
          <PageHeader showSoundSettings={false} />
        </div>
        
        <div className="max-w-2xl mx-auto mb-16 px-2 sm:px-4">
          <h1 className="text-3xl font-bold text-center mb-8">{t("title")}</h1>
          
          {submitSuccess ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-green-400 mb-2">{t("sentTitle")}</h2>
              <p className="text-text-secondary">{t("sentBody")}</p>
              <p className="text-text-secondary mt-4">{t("redirecting")}</p>
            </div>
          ) : (
            <Form {...form}>
              {formError && (
                <div className="p-4 mb-4 text-sm rounded-lg bg-red-500/10 text-red-400 border border-red-500/30">
                  <p>{formError}</p>
                </div>
              )}

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-2 sm:px-0">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "name"> }) => (
                    <FormItem>
                      <FormLabel>{t("name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("namePlaceholder")} {...field} className="bg-bg-card border-bg-light" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "email"> }) => (
                    <FormItem>
                      <FormLabel>{t("email")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("emailPlaceholder")} {...field} className="bg-bg-card border-bg-light" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "type"> }) => (
                    <FormItem>
                      <FormLabel>{t("inquiryType")}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                        required
                      >
                        <FormControl>
                          <SelectTrigger className="bg-bg-card border-bg-light text-white focus:border-white focus:ring-white focus:ring-opacity-50">
                            <SelectValue placeholder={t("inquiryPlaceholder")} className="text-white" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-bg-card border-bg-light text-white">
                          <SelectItem value="feedback" className="text-white">{t("types.feedback")}</SelectItem>
                          <SelectItem value="feature" className="text-white">{t("types.featureRequest")}</SelectItem>
                          <SelectItem value="inquiry" className="text-white">{t("types.general")}</SelectItem>
                          <SelectItem value="business" className="text-white">{t("types.business")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "message"> }) => (
                    <FormItem>
                      <FormLabel>{t("message")}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t("messagePlaceholder")} 
                          {...field} 
                          className="bg-bg-card border-bg-light h-40"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-peach-500 hover:bg-peach-600 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('sending') : t('send')}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
      
    </div>
  );
} 