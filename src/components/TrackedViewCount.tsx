'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { recordPublicationView, type PublicationViewType } from '@/app/books/actions';
import ViewCount from '@/components/ViewCount';

export default function TrackedViewCount({
  contentType,
  contentId,
  initialCount,
  className,
}: {
  contentType: PublicationViewType;
  contentId: string;
  initialCount: number;
  className?: string;
}) {
  const [count, setCount] = useState(initialCount);
  const recordedRef = useRef(false);

  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;

    startTransition(async () => {
      try {
        setCount(await recordPublicationView(contentType, contentId));
      } catch {
        // Analytics must never make the reading experience fail. The cached
        // initial value remains visible if an old tab or the network is stale.
      }
    });
  }, [contentId, contentType]);

  return <ViewCount count={count} className={className} />;
}
