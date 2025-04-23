'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '@/components/ui/PageHeader';
import Footer from '@/components/ui/Footer';
import { Button } from '@/components/ui/button';
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

// Define form schema with zod
const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  type: z.string({
    required_error: 'Please select an inquiry type.',
  }),
  message: z.string().min(10, {
    message: 'Message must be at least 10 characters.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContactUs() {
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
          message: 'Please select an inquiry type.'
        });
        setFormError('Please select an inquiry type.');
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
        setFormError(`Failed to submit form${errorDetails}`);
        
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
        setFormError('An error occurred while submitting the form. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <PageHeader showSoundSettings={false} />
        </div>
        
        <div className="max-w-2xl mx-auto mb-16 px-2 sm:px-4">
          <h1 className="text-3xl font-bold text-center mb-8">Contact Us</h1>
          
          {submitSuccess ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-green-400 mb-2">Message Sent!</h2>
              <p className="text-text-secondary">Thank you for reaching out. We&apos;ll get back to you soon.</p>
              <p className="text-text-secondary mt-4">Redirecting to homepage...</p>
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
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} className="bg-bg-card border-bg-light" />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@example.com" {...field} className="bg-bg-card border-bg-light" />
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
                      <FormLabel>Inquiry Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                        required
                      >
                        <FormControl>
                          <SelectTrigger className="bg-bg-card border-bg-light text-white focus:border-white focus:ring-white focus:ring-opacity-50">
                            <SelectValue placeholder="Select inquiry type" className="text-white" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-bg-card border-bg-light text-white">
                          <SelectItem value="feedback" className="text-white">Feedback</SelectItem>
                          <SelectItem value="feature" className="text-white">Feature Request</SelectItem>
                          <SelectItem value="inquiry" className="text-white">General Inquiry</SelectItem>
                          <SelectItem value="business" className="text-white">Business Opportunity</SelectItem>
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
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Type your message here..." 
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
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
} 