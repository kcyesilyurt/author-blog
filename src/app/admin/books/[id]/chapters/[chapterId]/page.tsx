'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updateChapter } from '../../../../actions';
import { renderMarkdown } from '@/lib/markdown';

export default function ChapterEditorPage() {
  const { id, chapterId } = useParams() as { id: string; chapterId: string };
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [chapterOrder, setChapterOrder] = useState(0);
  
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [htmlPreview, setHtmlPreview] = useState('');

  useEffect(() => {
    const fetchChapter = async () => {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();
        
      if (data) {
        setTitle(data.title);
        setSlug(data.slug);
        setContent(data.content || '');
        setChapterOrder(data.chapter_order);
      }
    };
    fetchChapter();
  }, [chapterId]);

  useEffect(() => {
    if (mode === 'preview') {
      setHtmlPreview(renderMarkdown(content));
    }
  }, [content, mode]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('slug', slug);
      formData.append('content', content);
      formData.append('chapter_order', String(chapterOrder));
      
      await updateChapter(chapterId, formData);
      alert('Saved!');
    } catch (err) {
      console.error(err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24 relative min-h-[calc(100vh-8rem)]">
      <Link href={`/admin/books/${id}`} className="text-sm text-zinc-500 hover:text-amber-500 mb-6 inline-block">&larr; Back to Book</Link>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setMode('edit')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              mode === 'edit' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              mode === 'preview' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Preview
          </button>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-medium rounded-lg px-6 py-2 text-sm transition"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {mode === 'edit' ? (
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chapter Title"
            className="text-2xl font-bold bg-transparent border-b border-zinc-700 focus:border-amber-500 focus:outline-none w-full py-2 text-zinc-100"
          />
          <div className="flex gap-4">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="slug"
              className="text-sm bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 w-64 text-zinc-200 focus:outline-none focus:border-amber-500"
            />
            <input
              type="number"
              value={chapterOrder}
              onChange={(e) => setChapterOrder(parseInt(e.target.value) || 0)}
              placeholder="Order"
              className="text-sm bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 w-24 text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your chapter in Markdown..."
            className="w-full min-h-[500px] bg-zinc-800 border border-zinc-700 focus:border-amber-500 focus:outline-none rounded-lg p-4 text-zinc-200 font-mono text-sm leading-relaxed resize-y"
          />
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 min-h-[500px] flex justify-center">
          <div 
            className="reader-content font-serif text-lg leading-relaxed text-zinc-200 max-w-[680px] w-full"
            dangerouslySetInnerHTML={{ __html: htmlPreview }} 
          />
        </div>
      )}
    </div>
  );
}
