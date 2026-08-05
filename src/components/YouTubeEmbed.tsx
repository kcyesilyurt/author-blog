type YouTubeEmbedProps = {
  videoId: string;
  title: string;
  startSeconds?: number;
};

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export default function YouTubeEmbed({
  videoId,
  title,
  startSeconds = 0,
}: YouTubeEmbedProps) {
  if (!VIDEO_ID_PATTERN.test(videoId)) return null;

  const start = Number.isInteger(startSeconds) && startSeconds > 0 ? startSeconds : 0;
  const query = new URLSearchParams({ rel: '0' });
  if (start) query.set('start', String(start));

  return (
    <div className="overflow-hidden rounded-2xl border border-[#64090C]/35 bg-black/30 shadow-xl shadow-black/20">
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?${query.toString()}`}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
