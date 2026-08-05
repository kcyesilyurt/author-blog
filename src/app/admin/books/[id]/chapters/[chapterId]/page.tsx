'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updateChapter } from '../../../../actions';
import { renderMarkdown } from '@/lib/markdown';
import { toDateTimeLocal, type PublicationStatus } from '@/lib/validation';

export default function ChapterEditorPage() {
  const { id, chapterId } = useParams() as { id: string; chapterId: string };
  const supabase = useMemo(() => createClient(), []);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [chapterOrder, setChapterOrder] = useState(0);
  const [status, setStatus] = useState<PublicationStatus>('draft');
  const [publishedAt, setPublishedAt] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const htmlPreview = useMemo(() => renderMarkdown(content), [content]);

  useEffect(() => {
    const fetchChapter = async () => {
      const { data } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();
        
      if (data) {
        setTitle(data.title);
        setSlug(data.slug);
        setContent(data.content || '');
        setChapterOrder(data.chapter_order);
        setStatus((data.status as PublicationStatus) || 'draft');
        setPublishedAt(toDateTimeLocal(data.published_at));
      }
    };
    fetchChapter();
  }, [chapterId, supabase]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('slug', slug);
      formData.append('content', content);
      formData.append('chapter_order', String(chapterOrder));
      formData.append('status', status);
      formData.append('published_at', publishedAt);
      
      await updateChapter(chapterId, formData);
      alert('Bölüm kaydedildi!');
    } catch (err) {
      console.error(err);
      alert('Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24 relative min-h-[calc(100vh-8rem)]">
      <Link href={`/admin/books/${id}`} className="text-sm text-neutral-500 hover:text-pink-400 mb-6 inline-block">&larr; Kütüphaneye Dön</Link>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-neutral-800 rounded-lg p-1">
          <button
            onClick={() => setMode('edit')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              mode === 'edit' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-300'
            }`}
          >
            Düzenle
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              mode === 'preview' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-300'
            }`}
          >
            Önizleme
          </button>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-pink-400 hover:bg-pink-300 disabled:opacity-50 text-black font-medium rounded-lg px-6 py-2 text-sm transition"
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      {mode === 'edit' ? (
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bölüm Başlığı"
            className="text-2xl font-bold bg-transparent border-b border-neutral-700 focus:border-pink-400 focus:outline-none w-full py-2 text-white"
          />
          <div className="flex gap-4">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-adresi"
              className="text-sm bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 w-64 text-neutral-200 focus:outline-none focus:border-pink-400"
            />
            <input
              type="number"
              value={chapterOrder}
              onChange={(e) => setChapterOrder(parseInt(e.target.value) || 0)}
              placeholder="Sıra"
              className="text-sm bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 w-24 text-neutral-200 focus:outline-none focus:border-pink-400"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PublicationStatus)}
              aria-label="Yayın durumu"
              className="text-sm bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-pink-400"
            >
              <option value="draft">Taslak</option>
              <option value="published">Yayında</option>
              <option value="scheduled">Planlı</option>
              <option value="archived">Arşivde</option>
            </select>
            {(status === 'scheduled' || status === 'published') && (
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                required={status === 'scheduled'}
                aria-label="Yayın tarihi"
                className="text-sm bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-pink-400"
              />
            )}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bölüm içeriğinizi Markdown formatında yazın..."
            className="w-full min-h-[500px] bg-neutral-800 border border-neutral-700 focus:border-pink-400 focus:outline-none rounded-lg p-4 text-neutral-200 font-mono text-sm leading-relaxed resize-y"
          />
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-xl p-8 border border-neutral-800 min-h-[500px] flex justify-center">
          <div 
            className="reader-content font-serif text-lg leading-relaxed text-neutral-200 max-w-[680px] w-full"
            dangerouslySetInnerHTML={{ __html: htmlPreview }} 
          />
        </div>
      )}
    </div>
  );
}
