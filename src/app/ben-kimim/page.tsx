import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import { absoluteSiteUrl, SOCIAL_IMAGE_PATH } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Ben Kimim?',
  description: 'Yazar Övgü Deveci Safi, yazı dünyası ve Hainin Mührü Serisi hakkında.',
  alternates: { canonical: '/ben-kimim' },
  openGraph: {
    title: 'Ben Kimim? | Övgü Deveci Safi',
    description: 'Yazar Övgü Deveci Safi, yazı dünyası ve Hainin Mührü Serisi hakkında.',
    url: absoluteSiteUrl('/ben-kimim'),
    type: 'profile',
    images: [{ url: SOCIAL_IMAGE_PATH, width: 1024, height: 682, alt: 'Övgü Deveci Safi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ben Kimim? | Övgü Deveci Safi',
    description: 'Yazar Övgü Deveci Safi, yazı dünyası ve Hainin Mührü Serisi hakkında.',
    images: [SOCIAL_IMAGE_PATH],
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <PageHeader title="Ben Kimim?" eyebrow="Övgü Deveci Safi" />

      <article className="glass-card rounded-2xl border border-[#64090C]/30 bg-[#64090C]/10 p-6 shadow-2xl shadow-black/20 sm:p-10">
        <div className="relative mx-auto mb-10 aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl border border-[#F8D794]/15 shadow-2xl shadow-black/30">
          <Image
            src="/images/author/pirate-chest.jpg"
            alt="Yazar Övgü Deveci Safi"
            fill
            sizes="(max-width: 640px) 85vw, 384px"
            className="object-cover"
          />
        </div>
        <div className="reader-content text-base text-[#EFEACD]/70 sm:text-lg">
          <p>
            Ben Övgü Deveci Safi. Hikâyeleri; suskunluğun, karanlığın ve insanın içinde
            büyüyen o sessiz soruların içinden çıkarıp yazıya dönüştüren bir yazarım.
          </p>
          <p>
            Yazmak benim için yalnızca anlatmak değil; hatırlamak, yüzleşmek ve bazen de kendini
            yeniden kurmak demek. Kurduğum evrenlerde gerçek ile düş arasındaki sınır
            bulanıklaşır: Bir cümle kapı aralığıdır, bir karakter bazen aynadır, bazen de kaçtığımız
            şeyin ta kendisi.
          </p>
          <blockquote>
            Okurla aramda tek bir anlaşma var: Ben dürüstçe yazacağım; sen de hissetmeye cesaret
            edeceksin.
          </blockquote>

          <h2>Neler Yazıyorum?</h2>
          <p>Metinlerimin kalbinde genellikle şunlar var:</p>
          <ul>
            <li>Karanlık atmosfer ve yüksek gerilim</li>
            <li>Mitoloji ve semboller</li>
            <li>İnsan doğası: korku, arzu, suçluluk, intikam, merhamet</li>
            <li>Gerçeklik algısı: “Bu yaşandı mı, yoksa oldu sanıldı mı?”</li>
            <li>Güçlü karakterler ve dönüşüm hikâyeleri</li>
          </ul>
          <p>
            Bazı hikâyeler bağırır, bazıları fısıldar. Ben fısıltıları severim; çünkü en çok
            onlar akılda kalır.
          </p>

          <h2>Kitaplarım — Hainin Mührü Serisi</h2>
          <p>
            Bu seride, kadim sırların gölgesinde ilerleyen bir yolculuk var. Her kitap bir kapı gibi:
            açtıkça daha derine iniyorsun, indikçe “iyi” ve “kötü” dediğimiz şeylerin yer
            değiştirebildiğini görüyorsun. Seriye ve güncel gelişmelere{' '}
            <Link href="/#kitaplarim">Kitaplarım</Link> bölümünden ulaşabilirsin.
          </p>

          <h2>Neden Bu Site?</h2>
          <p>
            Burası, sadece kitap duyurularının olduğu bir alan değil. Burası; yazdıklarımın arka
            planını, etkinlikleri, okur notlarını, yeni projeleri ve bazen de yazma sürecinin perde
            arkasını paylaştığım bir durak. Eğer benimle aynı hikâyelerin izini sürüyorsan, doğru
            yerdesin.
          </p>

          <h2>Birlikte Kalalım</h2>
          <p>
            Yeni kitaplar, imza günleri ve etkinlikler için{' '}
            <Link href="/etkinlikler">Etkinlikler</Link> bölümünü takip edebilirsin. Soru, iş birliği
            veya sadece bir merhaba için <Link href="/iletisim">İletişim</Link> sayfasından bana
            ulaşabilirsin.
          </p>
          <blockquote>Hoş geldin. Hikâye burada başlıyor.</blockquote>
        </div>
      </article>
    </div>
  );
}
