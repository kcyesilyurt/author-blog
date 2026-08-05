type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
};

export default function PageHeader({ title, description, eyebrow }: PageHeaderProps) {
  return (
    <header className="mb-10 text-center sm:mb-12">
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#F8D794]/55">
          {eyebrow}
        </p>
      )}
      <h1 className="gold-text font-serif text-4xl font-bold sm:text-5xl">{title}</h1>
      <div className="ornament-divider" aria-hidden="true">
        ✦
      </div>
      {description && (
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#EFEACD]/55 sm:text-lg">
          {description}
        </p>
      )}
    </header>
  );
}
