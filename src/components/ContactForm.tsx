'use client';

import { useState } from 'react';
import { submitContactMessage } from '@/app/iletisim/actions';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.';
}

const inputClassName =
  'w-full rounded-lg border border-[#64090C]/40 bg-[#64090C]/15 px-4 py-3 text-sm text-[#EFEACD] placeholder:text-[#EFEACD]/25 focus:border-[#F8D794]/60 focus:outline-none';

export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitting(true);
    setFeedback(null);

    try {
      const result = await submitContactMessage({
        name: String(formData.get('name') ?? ''),
        email: String(formData.get('email') ?? ''),
        subject: String(formData.get('subject') ?? ''),
        message: String(formData.get('message') ?? ''),
        website: String(formData.get('website') ?? ''),
      });

      if (!result.ok) {
        setFeedback({ type: 'error', message: result.message });
        return;
      }

      form.reset();
      setFeedback({
        type: 'success',
        message: result.message || 'Mesajınız alındı. Teşekkür ederim.',
      });
    } catch (error) {
      setFeedback({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card rounded-2xl border border-[#64090C]/30 bg-[#64090C]/10 p-5 shadow-xl shadow-black/20 sm:p-8"
    >
      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Web sitesi</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-[#EFEACD]/70">
            İsim Soyisim
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            required
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-[#EFEACD]/70">
            E-posta
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            className={inputClassName}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-subject" className="mb-2 block text-sm font-medium text-[#EFEACD]/70">
          Konu
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          minLength={3}
          maxLength={160}
          required
          className={inputClassName}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-[#EFEACD]/70">
          Mesaj
        </label>
        <textarea
          id="contact-message"
          name="message"
          minLength={10}
          maxLength={5000}
          rows={7}
          required
          className={`${inputClassName} resize-y`}
        />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[#EFEACD]/35">
        Adınız, e-posta adresiniz ve mesajınız yalnızca yanıt verebilmek için yönetici gelen
        kutusunda saklanır ve yönetici tarafından silinebilir.
      </p>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`mt-5 rounded-xl border p-4 text-sm ${
            feedback.type === 'success'
              ? 'border-green-800/60 bg-green-950/30 text-green-300'
              : 'border-red-800/60 bg-red-950/30 text-red-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#9C0512] px-7 py-3 text-sm font-medium text-[#F8D794] hover:bg-[#7a040e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Gönderiliyor...' : 'Mesajı Gönder'}
        </button>
      </div>
    </form>
  );
}
