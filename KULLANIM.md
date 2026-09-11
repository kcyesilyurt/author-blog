# Kullanım ve Kurulum Rehberi

Bu proje, bir yazarın kitaplarını ve blog yazılarını yayımlayabildiği; okurların eserleri okuyup yorum, tepki ve moderasyonlu fan art paylaşabildiği bir web sitesidir.

## Sitede neler var?

- Ana sayfada en yeni eser, kitaplar ve blog yazıları ayrı alanlarda gösterilir.
- Kitaplar bölüm bölüm okunur; blog yazıları da eser kütüphanesinden yönetilir.
- Her bölümde yorumlar ile beğenme, sevme ve kaydetme tepkileri bulunur.
- Kitap ve bölüm sayfalarında görüntülenme sayısı gösterilir.
- Pano, belirli bir kitaba bağlı olmadan okurların sohbet edebildiği ortak alandır ve en yeni 100 mesajı gösterir.
- Fan Art alanında kayıtlı okurlar görsel gönderebilir; yalnızca yazarın onayladığı çalışmalar kamusal galeride görünür.
- `Ben Kimim?`, etkinlik takvimi ve yazarla iletişim sayfaları bulunur.
- Eski sitedeki dört video, ana sayfada gizlilik geliştirilmiş ve tembel yüklenen YouTube oynatıcılarıyla korunur.
- Misafirler hesap açmadan isim yazarak yorum veya Pano mesajı bırakabilir.
- Kayıtlı okurlar profil, avatar ve isteğe bağlı benzersiz kullanıcı adı oluşturabilir; kullanıcı adı varsa yorum ve Pano mesajlarında `@kullaniciadi` görünür.
- Yöneticiler eserleri, bölümleri, etkinlikleri, iletişim kutusunu, kullanıcıları ve topluluk içeriklerini yönetebilir.

## Kullanıcı türleri

| Kullanıcı | Yapabildikleri | Görünen etiket |
| --- | --- | --- |
| Misafir | Yayımlanmış eserleri okur, isim girerek yorum/Pano mesajı yazar ve tepki bırakır | `Misafir` |
| Kayıtlı kullanıcı | Misafir yetkilerine ek olarak profil adı, isteğe bağlı `@kullaniciadi` ve avatar kullanır; fan art gönderir | `Okur` |
| Yönetici/yazar | Eser ve bölüm yönetir; kullanıcı, yorum, Pano ve fan art moderasyonu yapar | Yalnızca mavi doğrulama rozeti |

Askıya alınmış kullanıcılar siteyi okuyabilir ancak yorum, Pano mesajı veya fan art gönderemez.

## Sayfalar

| Adres | İçerik |
| --- | --- |
| `/` | En Son Eklenen, Kitaplarım, Blog Yazılarım ve Pano bağlantısı |
| `/books/{eser-slug}` | Eser özeti ve bölüm listesi |
| `/books/{eser-slug}/{bolum-slug}` | Okuma sayfası, tepkiler ve yorumlar |
| `/pano` | Eserlerden bağımsız topluluk konuşmaları |
| `/fan-art` | Onaylı galeri, fan art gönderim formu ve kişisel gönderim durumları |
| `/ben-kimim` | Yazarın biyografisi ve yazı dünyası |
| `/etkinlikler` | Yaklaşan ve geçmiş etkinlikler |
| `/iletisim` | Spam korumalı iletişim formu |
| `/auth/signup` | Yeni okur hesabı oluşturma |
| `/auth/login` | Hesaba giriş |
| `/profile` | İsteğe bağlı kullanıcı adı, ad, soyad, görünen ad ve avatar düzenleme |
| `/admin` | Yazarın içerik kütüphanesi |
| `/admin/comments` | Yorum moderasyonu |
| `/admin/events` | Etkinlik oluşturma, yayımlama ve arşivleme |
| `/admin/messages` | İletişim formundan gelen özel mesajlar |
| `/admin/fan-art` | Fan art inceleme, onay/ret ve yayından kaldırma yönetimi |
| `/admin/users` | Kullanıcı, ban ve yönetici rolü yönetimi |
| `/admin/stats` | Eser, bölüm, kullanıcı ve yorum istatistikleri |

## Okur olarak kullanım

1. Ana sayfadan bir kitap veya blog yazısı seçin.
2. Kitaplarda bir bölümü açın; blog yazılarında içerik bağlantısını açın.
3. Okuma sayfasında önceki/sonraki bölüm bağlantılarını kullanın; sayfanın altında tepki bırakın veya yorum yazın.
4. Hesabınız yoksa yorum formuna bir isim girin. Mesajınız `Misafir` etiketiyle görünür.
5. Hesabınız varsa ve profilinizde kullanıcı adı seçtiyseniz yorum `@kullaniciadi` ile; seçmediyseniz mevcut profil adınızla görünür. Yönetici hesaplarında `Okur` etiketi yerine yalnızca mavi doğrulama rozeti gösterilir.
6. Eserlerden bağımsız konuşmak için üst menüdeki `Pano` bağlantısını kullanın.
7. Kendi çalışmanızı paylaşmak için giriş yapıp `/fan-art` formundan JPEG, PNG veya WebP dosyası gönderin. Durumu aynı sayfadaki `Gönderilerim` alanından izleyin.

Kayıt olmak zorunlu değildir. Profil ve avatar kullanmak, yorumlarda sürekli aynı kimlikle görünmek için kayıt olunabilir.

Yorum ve Pano mesajları en fazla 2.000 karakter ve 2 bağlantı içerebilir. Misafir adı 2-50 karakter arasında olmalıdır.

### İsteğe bağlı kullanıcı adı

Giriş yaptıktan sonra `/profile` sayfasından kullanıcı adı seçebilir veya alanı boşaltarak kaldırabilirsiniz. Değer veritabanında `@` olmadan küçük harfle tutulur; formdaki sabit `@` işareti alana yazılmaz ve arayüz bunu gösterirken ekler. Uzunluk 3-24 karakterdir. Yalnızca İngilizce `a-z` harfleri, `0-9` rakamları ve alt çizgi (`_`) kabul edilir; alt çizgi başta veya sonda olamaz. `Deniz_7` yazılması `deniz_7` olarak kaydedilir. Türkçe harfler sessizce dönüştürülmez: örneğin `çağla` yerine kullanıcı bilinçli olarak `cagla` seçmelidir.

Kullanıcı adı kamusal ve benzersizdir. `admin`, `moderator`, `destek`, `yazar` gibi rol veya sistem çağrıştıran bazı adlar kimliğe bürünmeyi azaltmak için rezerve edilmiştir. Aynı adı iki kişi eşzamanlı isterse uygulamanın ön kontrolüne değil veritabanındaki unique index'e güvenilir; yalnızca bir işlem kazanır, diğeri anlaşılır bir “zaten alınmış” mesajı görür.

Yorum ve Pano satırlarına adın metinsel kopyası yazılmaz; kayıtlı kullanıcının değişmeyen UUID'si tutulur ve güncel profil toplu olarak okunur. Bu nedenle kullanıcı adını değiştirmek veya kaldırmak eski yorum ve Pano mesajlarını da sayfa yenilendiğinde günceller. Bu tasarım backfill ve tekrar eden veri maliyetini önler. Eski yorumun o günkü adını sonsuza kadar korumak istenirse alternatif tasarım her iletiye bir ad snapshot'ı yazmaktır; bunun karşılığı daha fazla veri, ek yazma ve ad değişikliği tutarsızlığıdır.

## Yazar/yönetici olarak kullanım

### Yeni eser ekleme

1. Giriş yaptıktan sonra `/admin` sayfasını açın.
2. `Yeni Eser Ekle` düğmesine basın.
3. Eser türü olarak `Kitap` veya `Blog Yazısı` seçin.
4. Başlık, açıklama, kapak, yayın durumu ve gerekiyorsa yayın tarihini girin.
5. Eseri oluşturduktan sonra düzenleme sayfasından bölüm veya yazı içeriği ekleyin.

Kitap çok sayıda bölüm içerebilir. Blog yazısı da teknik olarak tek bir içerik/bölüm üzerinden yayımlanır.

### Bölüm veya blog içeriği ekleme

1. Yönetim panelinde eserin adına veya `Düzenle` bağlantısına basın.
2. Kitap için `Yeni Bölüm Ekle`, blog için `İçerik Ekle` seçeneğini kullanın.
3. Başlık ve sıralama bilgisini girin.
4. Açılan editörde içeriği Markdown biçiminde yazın.
5. Bölümün yayın durumunu ve tarihini ayarlayıp kaydedin.

Bir içeriğin herkese görünmesi için hem ana eser hem de ilgili bölüm görünür durumda olmalıdır.

Sık kullanılan Markdown örnekleri:

```markdown
# Başlık
## Alt başlık

**Kalın metin** ve *italik metin*

- Liste maddesi
- Başka bir madde

> Alıntı

[Bağlantı adı](https://example.com)
![Görsel açıklaması](https://example.com/gorsel.jpg)
```

Ham HTML güvenlik amacıyla doğrudan çalıştırılmaz; metin olarak etkisizleştirilir.

### Yayın durumları

| Durum | Davranış |
| --- | --- |
| `Taslak` | Yalnızca yönetim panelinde görünür |
| `Planlı` | Belirlenen tarih geldiğinde otomatik görünür |
| `Yayında` | Yayın tarihi gelmişse herkese görünür |
| `Arşivde` | Kamusal sayfalardan kaldırılır, yönetim panelinde korunur |

Ana sayfadaki `En Son Eklenen`, görünür eserler arasından en yeni kaydı gösterir. Aynı eser türüne göre `Kitaplarım` veya `Blog Yazılarım` alanında da yer alır.

### Moderasyon

- `/admin/comments`: Bölüm yorumlarını inceleyip silebilirsiniz.
- `/pano`: Yönetici olarak görüntülerken Pano mesajlarını silebilirsiniz.
- `/admin/users`: Kullanıcıyı askıya alabilir, yasağı kaldırabilir veya yönetici rolünü değiştirebilirsiniz.
- `/admin/fan-art`: Temizlenmiş önizlemeyi, başlığı, alt metni ve sanatçı adını inceleyip çalışmayı onaylayabilir, gerekçeyle reddedebilir veya daha önce onaylanmış bir çalışmayı yayından kaldırabilirsiniz.
- `/admin/stats`: Temel kullanım sayılarını görebilirsiniz.

Fan art reaktif değil, yayın öncesi moderasyon kullanır: bekleyen bir dosyanın URL'si public değildir. Onay işlemi temizlenmiş WebP türevini public `fan-art` bucket'ına taşır; ret işlemi private dosyayı silme kuyruğuna alır ve nedeni metadata kaydında tutar. Storage ve Postgres tek transaction paylaşamadığından dosya silmeleri kalıcı bir outbox kaydıyla yeniden denenir; geçici Storage hatasında dosyanın yolu kaybolmaz.

### Etkinlik ve iletişim yönetimi

- `/admin/events`: Bir etkinliği taslak olarak hazırlayabilir, yayımlayabilir, güncelleyebilir veya arşivleyebilirsiniz. Yaklaşan ve geçmiş etkinlikler kamusal sayfada tarihe göre ayrılır.
- `/admin/messages`: İletişim formundan gelen mesajları okuyabilir, okunmadı olarak işaretleyebilir veya silebilirsiniz. E-posta adresleri tarayıcı Supabase istemcisine açılmaz; yalnızca yetkili sunucu işlemleriyle okunur.

İletişim formu şu anda e-posta bildirimi göndermez. Başarılı gönderimler Supabase'deki özel `contact_messages` tablosuna kaydedilir ve yalnızca `/admin/messages` gelen kutusunda görünür.

### Ana sayfadaki YouTube videoları

YouTube videoları henüz yönetim panelinden düzenlenmez. Dört kayıt [`src/app/page.tsx`](./src/app/page.tsx) içindeki `videos` dizisinde `videoId` ve isteğe bağlı `startSeconds` olarak tutulur. Bu alanlar değiştirildiğinde kod değişikliğini test edip GitHub'a göndermek gerekir; Vercel yeni sürümü otomatik yayımlar.

## Görsel yükleme sınırları

- Kitap/blog kapağı: en fazla **10 MB**
- Profil avatarı: en fazla **5 MB**
- Fan art kaynağı: en fazla **6 MB** ve **25 milyon kaynak pikseli**; uzun kenar en fazla **2400 px** olarak yeniden boyutlandırılır
- Kabul edilen biçimler: JPEG, PNG ve WebP

Görseller kısa ömürlü imzalı yükleme adresiyle doğrudan Supabase Storage'a gönderilir ve yükleme sonrasında dosya imzası doğrulanır. Fan art sunucuda tamamen decode edilip WebP olarak yeniden yazılır; bu işlem EXIF/GPS metadata'sını da kaldırır. Veritabanında görsel byte'ları değil yalnızca yol, boyut, durum ve moderasyon metadata'sı tutulur.

## Supabase'i yalnızca web paneliyle hazırlama

Supabase CLI veya masaüstü uygulaması migration'ları çalıştırmak için gerekli değildir. Mevcut Supabase projesi için Dashboard içindeki SQL Editor yeterlidir. SQL Editor ve CLI aşağıda iki alternatif şema-yönetim akışı olarak ele alınır; birini çalıştırıp hemen ardından diğerine geçmeyin.

### Migration öncesi yedek kapısı

“Yedek var” demek yalnızca bir kayıt görmek değil, migration öncesine dönebileceğiniz yeterince yakın bir restore point'i ve geri yükleme yolunu doğrulamak demektir.

- **Pro, Team ve Enterprise:** Dashboard > `Database > Backups` alanında son başarılı backup'ın zamanını ve saklama süresini kontrol edin. Günlük backup migration'ın hemen öncesini garanti etmez; daha düşük veri-kaybı toleransı varsa PITR kullanın veya ayrıca mantıksal dump alın.
- **Free:** Dashboard'dan indirilebilir veritabanı backup'ı yoktur. Supabase'in önerdiği gibi CLI `db dump` ile şema ve uygulama verisini repo dışında saklayın.

CLI projesi henüz bağlı değilse `init`, `login` ve `link` adımlarını bir kez tamamlayın. `supabase/config.toml` zaten varsa `init` komutunu atlayın. Aşağıdaki iki dump birlikte uygulama şeması ve verisi için migration-öncesi mantıksal güvenlik kopyası oluşturur:

```bash
npx --yes supabase@latest init
npx --yes supabase@latest login
npx --yes supabase@latest link --project-ref PROJECT_REF
npx --yes supabase@latest db dump --linked -f ../author-blog-schema-before-feature.sql
npx --yes supabase@latest db dump --linked --data-only --use-copy -f ../author-blog-data-before-feature.sql
```

Dump dosyaları production verisi içerebilir; Git'e eklemeyin, erişimi sınırlı ve şifreli bir konumda saklayın. CLI mantıksal dump'ı Supabase tarafından yönetilen bazı şemaları varsayılan olarak dışarıda bırakır ve platformun fiziksel backup'ıyla aynı şey değildir.

CLI `db dump` yerel Docker daemon'ına ihtiyaç duyar. Docker kullanamıyorsanız Supabase'in bağlantı bilgileriyle uyumlu `pg_dump`/`pg_restore` akışını izleyin; iki yöntemde de gerçekten geri yüklenebilen bir test kopyası, yalnızca dosyanın oluşmuş olmasından daha güçlü bir doğrulamadır. [Supabase backup/restore rehberi](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)

Veritabanı backup'ları Storage API ile yüklenen dosya byte'larını içermez; yalnızca nesne metadata'sı veritabanında bulunur. Bir veritabanı restore'u daha önce silinmiş kapak, avatar veya fan art görselini geri getirmez. Dosyalar için ayrı Storage export/yedek politikası gerekir. [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups) ve [CLI `db dump` başvurusu](https://supabase.com/docs/reference/cli/supabase-db-dump)

### Mevcut proje için gerekli migration'lar

Bu projenin mevcut veritabanında temel tablolar zaten bulunduğu için `001`-`006` dosyalarını yeniden çalıştırmayın. SQL Editor'da yalnızca aşağıdaki dosyaları belirtilen sırayla çalıştırın:

1. [`20260802003532_harden_community_and_publication.sql`](./supabase/migrations/20260802003532_harden_community_and_publication.sql)
2. [`20260802142452_increase_image_upload_limits.sql`](./supabase/migrations/20260802142452_increase_image_upload_limits.sql)
3. [`20260802180000_add_events_and_contact_messages.sql`](./supabase/migrations/20260802180000_add_events_and_contact_messages.sql)
4. [`20260820110356_add_publication_views.sql`](./supabase/migrations/20260820110356_add_publication_views.sql)
5. [`20260820110402_add_fan_art.sql`](./supabase/migrations/20260820110402_add_fan_art.sql)
6. [`20260910141005_add_optional_usernames.sql`](./supabase/migrations/20260910141005_add_optional_usernames.sql)

Her dosya için:

1. Supabase Dashboard'da projenizi açın.
2. Sol menüden `SQL Editor` > `New query` seçin.
3. Yerel dosyanın bütün içeriğini kopyalayıp sorgu alanına yapıştırın.
4. `Run` düğmesine basın ve başarı mesajını bekleyin.
5. Bir sorgu başarıyla tamamlanmadan sonraki dosyaya geçmeyin.

İlk migration; yayın durumlarını, yayın tarihlerini, güvenlik kurallarını, profil erişimini ve atomik istek sınırını hazırlar. İkinci migration Storage sınırlarını uygulama koduyla aynı değere getirir. Üçüncü migration etkinlik ve iletişim tablolarını, dördüncü migration atomik yayın sayaçlarını, beşinci migration private/public Fan Art akışını, altıncı migration ise isteğe bağlı ve benzersiz kullanıcı adlarını ekler.

Daha önce başarıyla çalıştırdığınız dosyaları tekrarlamayın. İlk beş dosya canlı veritabanında tamamlandıysa bu sürüm için yalnızca altıncı dosyayı çalıştırın.

Production'da DB-first sırası zorunlu bir yayın kapısıdır: önce yukarıdaki yedeği doğrulayın, eksik migration'ları ve özellikle altıncı kullanıcı adı dosyasını uygulayıp aşağıdaki kontrolleri bitirin, ancak sonra yeni deployment'ı yayımlayın. Yeni kod eski şemada bulunmayan `profiles.username` alanını doğrudan okuduğu için ters sıra profil, yorum ve Pano sorgularında runtime hatası üretir. Migration geriye uyumlu olduğundan mevcut kodla birlikte güvenle bekleyebilir; yalnızca Vercel kod rollback'i yapmak Supabase migration'ını veya veriyi geri almaz. Fan Art kurulumu henüz tamamlanmadıysa 4-5 numaralı dosyalar ve Vercel Production `CRON_SECRET` kontrolü de ayrıca gereklidir.

Migration'lardan sonra Dashboard'da şunları kontrol edin:

- `Table Editor`: `books` ve `chapters` tablolarında `status` ile `published_at` alanları bulunmalı.
- `Table Editor`: `community_rate_limits` tablosu bulunmalı.
- `Table Editor`: `events` ve `contact_messages` tabloları bulunmalı; `contact_messages` için tarayıcı rollerine policy verilmemiş olmalı.
- `Table Editor`: `books` ve `chapters` içinde `view_count`; ayrıca `publication_view_dedup`, `fan_art_submissions` ve `fan_art_storage_cleanup_jobs` tabloları bulunmalı.
- `Table Editor`: `profiles` içinde boş bırakılabilen `username` alanı bulunmalı.
- `Storage`: `covers` public ve 10 MB; `avatars` public ve 5 MB olmalı.
- `Storage`: `fan-art-staging` private, `fan-art` public ve ikisi de 6 MB olmalı; public bucket yalnızca WebP kabul etmelidir.
- `Storage` genel ayarları: projenin global dosya sınırı en az 10 MB olmalı. Migration bucket sınırlarını değiştirir, global proje sınırını değiştirmez.

Tamamen boş, yeni bir Supabase projesi kuruluyorsa bunun yerine `supabase/migrations` klasöründeki bütün SQL dosyaları dosya adına göre sırayla çalıştırılmalıdır.

Altıncı migration'ın yapısını SQL Editor'da salt-okunur olarak doğrulamak için şu sorguları çalıştırabilirsiniz:

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'username';

select indexname, indexdef
from pg_catalog.pg_indexes
where schemaname = 'public'
  and tablename = 'profiles'
  and indexname = 'profiles_username_lower_uidx';

select grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'username'
order by grantee;
```

İlk sorgu `text` ve `YES`, ikinci sorgu `UNIQUE ... lower(username) ... WHERE username IS NOT NULL`, üçüncü sorgu ise `anon` ve `authenticated` için `SELECT` göstermelidir. Bu yalnız yeni kamusal kolonu açar; `profiles` tablosuna genel `SELECT` veya kullanıcıya doğrudan `UPDATE` yetkisi verilmez. Profil güncellemesi oturumu sunucuda doğrulayan action üzerinden yapılır.

### SQL Editor ve CLI migration geçmişini ayırma

SQL Editor ile çalıştırılan dosyalar `supabase_migrations.schema_migrations` geçmişine otomatik kaydolmaz. Bu nedenle mevcut proje için SQL Editor akışı, CLI `db push` komutunun hazırlık adımı değil alternatifidir. Manuel SQL'den hemen sonra `db push` çalıştırmak, veritabanında zaten bulunan `001`-`006` veya daha önce elle uygulanan güncel migration'ları yeniden çalıştırmaya kalkabilir.

Baştan beri CLI geçmişiyle yönetilen bir projede güvenli akış şöyledir:

```bash
npx --yes supabase@latest migration list
npx --yes supabase@latest db push --dry-run
npx --yes supabase@latest db push
```

`migration list` ve `--dry-run` çıktısı yalnızca gerçekten beklenen yeni dosyaları göstermelidir. Daha önce SQL Editor ile uyguladığınız herhangi bir dosya yeniden çalıştırılacak görünüyorsa son komutu çalıştırmayın.

Mevcut manuel projeyi ileride CLI yönetimine geçirmek için:

1. Önce backup alın ve geçişi ayrı bir dal/staging ortamında deneyin.
2. Projeyi bağladıktan sonra `npx --yes supabase@latest migration list` ile yerel dosyaları uzak migration geçmişiyle karşılaştırın.
3. Uzak şemada bir migration'ın bütün tablo, kolon, constraint, fonksiyon ve policy değişikliklerinin gerçekten bulunduğunu doğrulayın. Yalnız dosya adına veya “tablo var” kontrolüne güvenmeyin.
4. Şema dosyayla birebir uyumlu fakat yalnız history satırı eksikse `npx --yes supabase@latest migration repair --status applied MIGRATION_VERSION` kullanabilirsiniz. Bu komut SQL çalıştırmaz veya şemayı düzeltmez; yalnızca history kaydı ekler. Doğrulamadığınız bir sürümü `applied` işaretlemeyin.
5. Uzak şema yerel dosyalardan farklıysa veya emin değilseniz history'yi zorla onarmayın. Docker çalışırken `npx --yes supabase@latest db pull remote-baseline` ile uzak durumu yeni bir migration'a alın; oluşturulan dosyayı ve isteğe bağlı history güncellemesini kabul etmeden önce dikkatle inceleyin. `db pull` tek başına eski yerel dosyaları uygulanmış saymaz; history ile yerel liste eşleşmeden push'a geçmeyin.
6. Son olarak `migration list` ve `db push --dry-run` çıktısını yeniden kontrol edin. Production'da hiçbir zaman `db reset --linked` çalıştırmayın; bu komut uzak kullanıcı şemasını silip yeniden kurar.

Bu geçişin amacı iki ayrı gerçeği eşitlemektir: Git hangi SQL dosyalarının var olduğunu, Supabase migration history ise hangilerinin uzak veritabanına uygulandığını kaydeder. [Supabase migration rehberi](https://supabase.com/docs/guides/deployment/database-migrations) ve [CLI başvurusu](https://supabase.com/docs/reference/cli/getting-started)

### Görüntülenme sayacı ve veri bakımı

Kitap ve bölüm toplamları ilgili satırda tek bir `bigint` alanı olarak tutulur; her ziyaret için kalıcı olay satırı üretilmez. Aynı kayıtlı okur veya imzalı misafir kimliği, aynı hedef için 24 saatte bir kez sayılır. Kimlik, her kitap/bölüm için ayrı HMAC ile tek yönlü özetlenir; ham IP kaydedilmez. Tekilleştirme satırları 30 gün sonra aggregate toplamı değiştirmeden silinebilir.

Bu geçici tablonun sınırsız büyümemesi için dördüncü migration `pg_cron` uzantısını etkinleştirir ve aşağıdaki işi otomatik olarak zamanlar. Dashboard `Integrations > Cron > Jobs` alanında `prune-publication-view-dedup-hourly` kaydını görmeniz gerekir. Proje politikası uzantıyı SQL'den etkinleştirmeyi engellerse önce `Integrations > Cron` ekranından etkinleştirip migration'ı yeniden çalıştırın.

```sql
select cron.schedule(
  'prune-publication-view-dedup-hourly',
  '17 * * * *',
  $$select public.prune_publication_view_dedup(5000);$$
);
```

Bu işlem her saatin 17. dakikasında en fazla 5.000 eski satırı kısa bir transaction ile temizler. Yukarıdaki SQL, eksik bir işi elle onarmak veya aynı isimli işi güncellemek için de kullanılabilir; aynı isim tekrarlandığında Supabase mevcut işi günceller. `Job Run Details` alanında sonucun başarılı olduğunu kontrol edin. Trafik saatte 5.000'den fazla yeni tekil hedef-okur çifti üretiyorsa batch veya sıklık artırılabilir; başlangıçta partitioning gerekmez. [Supabase Cron rehberi](https://supabase.com/docs/guides/cron)

### Fan Art dosya yaşam döngüsü

İmzalı upload token'ı yaklaşık iki saat geçerli olduğu için kaynak nesne finalize/cancel anında hemen silinmez. Kaynak yolu 3 saatlik dayanıklı temizleme kaydıyla izlenir; bu sürede token tekrar kullanılsa `upsert: false` nedeniyle var olan nesnenin üzerine yazamaz. Dosya hiç yüklenmemişse ilk finalize denemesi bileti terminal `cancelled` durumuna geçirir; aynı bilet Storage isteklerini çoğaltmak için tekrar kullanılamaz.

Paralel finalize isteklerinden yalnızca atomik `uploading → processing` lease'ini kazanan istek görseli decode eder. Lease UUID ile çevrelenir ve sunucu kesilirse 10 dakika sonra geri alınabilir; eski worker yeni worker'ın durumunu güncelleyemez. Kullanıcı başına en fazla beş aktif gönderi kontrolü de count+insert yapan tek bir kilitli RPC içindedir.

`fan_art_storage_cleanup_jobs`, Storage silme işlemi başarıyla bitene kadar nesne yolunu ve deneme sayısını tutar. Temizleyici her iş için ayrı bir fenced lease alır ve veritabanı pointer'larını aynı transaction'da ayırır; aktif finalize/onay işlemiyle yarışan bir worker canlı dosyayı silemez. Vadesi gelen işler yeni bir fan art bileti oluşturulurken ve yönetici moderasyon sırasını açtığında 25'lik batch'lerle yeniden denenir. Bunlar hızlı, trafik-tetikli denemelerdir; aşağıdaki günlük Vercel işi ise sessiz bir sitede kayıtların süresiz beklememesini sağlayan fallback'tir.

#### Günlük Vercel cleanup fallback'i

[`vercel.json`](./vercel.json), production deployment'ındaki `/api/cron/fan-art-cleanup` rotasını her gün `03:17 UTC` için kaydeder. Rota her çağrıda en fazla sekiz adet 25'lik tarama yapar; bir çalıştırmada en fazla 200 satır için claim/silme denenir ve yarış halinde aynı satır yeniden görülebilir. Trafik-tetikli temizleme çalışmasa bile normal, küçük bir backlog sessiz bir sitede yaklaşık bir gün içinde yeniden ele alınır; 200'den büyük veya sürekli hata veren bir kuyruk birden fazla güne yayılabilir. Bu günlük iş üç saatlik `delete_after` değerinin kesin silme SLA'sı olduğu anlamına gelmez.

Cron endpoint'i public bir bakım kapısıdır ama secret olmadan çalışmaz. Kurulum sırası:

1. `RATE_LIMIT_SECRET` değerinden farklı bir değer üretmek için `openssl rand -hex 32` komutunu yeniden çalıştırın.
2. Sonucu Vercel > Project > Settings > Environment Variables alanında `CRON_SECRET` adıyla yalnızca güvenilen ortamlara, özellikle `Production` kapsamına ekleyin. `NEXT_PUBLIC_` öneki kullanmayın ve değeri Git'e yazmayın.
3. Yeniden deploy edin. Vercel, cron GET isteğinde bu değeri otomatik olarak `Authorization: Bearer ...` başlığıyla yollar; uygulama eksik veya farklı başlığa `401` döner.
4. Vercel > Project > Settings > Cron Jobs alanında işi, ardından `View Logs` ile `200` yanıtını kontrol edin. `500`, en az bir veritabanı/Storage cleanup adımının başarısız olduğunu gösterir; silinemeyen nesnenin outbox kaydı sonraki deneme için korunur.

Vercel Cron ifadeleri UTC kullanır. Hobby planı bir cron'u günde en fazla bir kez çalıştırabilir ve `03:17` ifadesini `03:00-03:59 UTC` arasında çağırabilir; mevcut günlük ifade bu sınıra uygundur. Pro ve üzeri planda daha kısa gecikme veya yüksek backlog gerekiyorsa `vercel.json` içindeki schedule örneğin saatlik `17 * * * *` yapılabilir ve yeniden deploy edilir. Bunu artırmadan önce cleanup sayıları, fonksiyon süresi ve Storage hataları izlenmelidir. Cron yalnız production deployment'ında otomatik tetiklenir. Vercel Instant Rollback aktif cron kaydını eski deployment ayarına otomatik döndürmez; cron rotası veya schedule değişmişse rollback sonrasında Cron Jobs ekranını ayrıca kontrol edin. [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) ve [Cron yönetimi/güvenliği](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

Yönetici, onaylanan bir çalışmayı telif/şikâyet/yanlış onay halinde gerekçeyle yayından kaldırabilir. `approved → removed` geçişi public yolu ve cleanup outbox kaydını aynı Postgres transaction'ında günceller; bu nedenle yeni galeri sorguları çalışmayı hemen dışarıda bırakır ve kullanıcı gerekçeyi “Gönderilerim” alanında görür. Ancak açık bir tarayıcı sekmesine gerçek zamanlı kaldırma bildirimi gönderilmez; o sekme yenilenene kadar eski kartı gösterebilir.

Storage nesnesi Postgres transaction'ıyla aynı anda silinemez. Galeri görseli doğrudan Supabase public URL'sini Next.js image optimizer cache'ine almadan gösterir; buna rağmen bilinen direct URL, outbox worker Storage silmesini başarıyla tamamlayana kadar çalışabilir. Supabase Pro ve üzerindeki Smart CDN nesne silindiğinde edge cache'i otomatik geçersizleştirir, fakat küresel yayılım 60 saniyeye kadar sürebilir; Supabase Free planında Smart CDN invalidation garantisi varsayılmamalıdır. Ayrıca CDN invalidation tarayıcı cache'ini temizlemez: public WebP `cacheControl: 3600` ile yüklendiğinden bir tarayıcı kopyayı bir saate kadar gösterebilir ve daha önce indirilmiş bir dosya teknik olarak geri alınamaz. Acil Pro+ takedown'da server-side secret key ile manuel CDN purge ek bir seçenek olsa da tarayıcı kopyalarını yine silemez. [Supabase Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn) ve [CDN cache purge](https://supabase.com/docs/guides/storage/cdn/purge-cdn-cache)

`fan_art_submissions.user_id` ilişkisi metadata ve Storage pointer'larının sessizce kaybolmaması için `ON DELETE RESTRICT` kullanır. İleride hesap silme özelliği eklenirse önce kullanıcının fan art nesnelerini outbox'a alan ve metadata'yı kontrollü temizleyen ayrı bir hesap-silme workflow'u yazılmalıdır.

### Ölçek kontrolü ve alternatifler

Mevcut model küçük ve orta trafik için dengeli bir başlangıçtır: görsel byte'ları SQL yerine Storage'da, yalnız metadata Postgres'te tutulur; galeri, moderasyon ve kullanıcı geçmişi sorguları keyset pagination ile uyumlu bileşik indekslere dayanır; görüntülenme toplamları aggregate kolonlarda kalırken geçici tekilleştirme kayıtları batch halinde temizlenir. Kullanıcı adı yalnız `profiles` içinde nullable kısa bir metindir ve partial index'e yalnız kullanıcı adı seçen hesaplar girer; yorum sayısı arttıkça username index'i büyümez. Topluluk sorgusu profilleri ileti başına ayrı ayrı değil sayfadaki benzersiz kullanıcı UUID'leriyle tek batch'te getirir. Ölçek kararını toplam satır sayısından çok ölçülen darboğaza göre verin.

Aynı eser satırında çok yüksek eşzamanlı görüntülenme write trafiği oluşursa sayaç olaylarını kuyruğa alıp toplu artırmak veya gerçek-zamanlı kesin sayı gerekmiyorsa ayrı bir analytics sistemi kullanmak satır hotspot'unu azaltır; karşılığında gösterilen sayı gecikir ve yeni operasyonel bileşen gelir. Fan art hacmi günlük worker kapasitesini aşarsa önce izlenen backlog'a göre cron sıklığı/batch'i artırın; kalıcı yüksek hacimde kuyruk tüketen ayrı worker ya da yönetilen görsel dönüştürme/moderasyon/CDN servisi tercih edilebilir. Bunlar daha yüksek kapasite sağlar ama maliyet, sağlayıcı bağımlılığı ve hata ayıklama yüzeyi ekler.

### API anahtarlarını alma

Supabase Dashboard'da `Connect` penceresinden veya `Project Settings` > `API Keys` sayfasından şu değerleri alın:

| `.env.local` değişkeni | Supabase değeri |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_...`) veya legacy `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key (`sb_secret_...`) veya legacy `service_role` key |

Secret/service-role anahtarını asla `NEXT_PUBLIC_` adlı bir değişkene koymayın, Git'e eklemeyin veya tarayıcı kodunda kullanmayın.

### Auth ayarı

Supabase Dashboard > `Authentication` > `URL Configuration` bölümünde yerel geliştirme için:

- Site URL: `http://localhost:3000`
- Redirect URLs listesine: `http://localhost:3000/auth/callback`

Üretime geçerken Site URL'yi gerçek alan adınızla değiştirin ve aynı alan adının izin verilen yönlendirme adresini ekleyin.

#### Production e-posta gönderimi ve `email rate limit exceeded`

Bu hata SQL tablosunun büyümesinden değil Supabase Auth'ın e-posta gönderim kotasından gelir. Supabase'in varsayılan SMTP servisi production toplu kayıt için tasarlanmamıştır. Yalnızca Supabase organizasyon takımındaki önceden yetkili adreslere teslimat yapar; başka bir alıcı `email_address_not_authorized` hatası alır. Güncel varsayılan kota proje genelinde toplam **2 e-posta/saat**tir ve kayıt doğrulama, parola sıfırlama ile e-posta değiştirme akışları bu ortak toplamı tüketir. Dolayısıyla iki kayıt/saat garantisi değildir.

Custom SMTP bağlandığında başlangıç Auth limiti proje genelinde **30 e-posta/saat**tir; sağlayıcının kendi kota/itibar kuralları buna ek olarak geçerlidir. Teslimat doğrulandıktan ve kötüye kullanım koruması kurulduktan sonra Supabase limiti beklenen trafiğe göre değiştirilebilir.

Küçük hacimli bu site için başlangıç tercihi olarak Resend kullanılabilir; SMTP destekli başka bir transactional sağlayıcı da aynı mimariyle çalışır. Auth gönderimini ilerideki pazarlama e-postalarından ayırmak için `auth.ovgudevecisafi.com` gönderim alt alanı ve `no-reply@auth.ovgudevecisafi.com` göndereni önerilir.

##### Resend ve WordPress.com DNS kurulumu

1. Resend hesabında `Domains > Add Domain` alanına `auth.ovgudevecisafi.com` ekleyin.
2. Resend'in ürettiği MX/TXT (SPF ve DKIM) kayıtlarını ezberden değil ekrandaki tür, ad, değer ve priority ile birebir kopyalayın.
3. Domain WordPress.com nameserver'larını kullanıyorsa `Hosting Dashboard > Domains > ovgudevecisafi.com > Settings > DNS records > Add record` yolundan bu kayıtları ekleyin. Nameserver başka sağlayıcıdaysa kayıtları aktif DNS sağlayıcısına girin. Mevcut site A/CNAME veya kök domain e-posta kayıtlarını silmeyin.
4. Resend'de domain `Verified` olana kadar bekleyin; ardından yalnız gönderim yetkili ve mümkünse bu domainle sınırlı bir API key oluşturun.
5. Resend domain ayarlarında open/click tracking'in kapalı kaldığını doğrulayın. Link tracking tek kullanımlık Supabase doğrulama URL'sini yeniden yazabilir.
6. Supabase Dashboard > `Authentication > Emails > SMTP Settings` alanında Custom SMTP'yi açıp aşağıdakileri girin:

```text
Sender name: Övgü Deveci Safi
Sender email: no-reply@auth.ovgudevecisafi.com
Host: smtp.resend.com
Port: 465
Username: resend
Password: Resend'de oluşturulan re_... API key
```

7. SMTP ayarını kaydedin. API key'i Vercel'e, `.env.local` dosyasına veya Git'e koymayın; yalnız Supabase'in SMTP parola alanında ve parola yöneticinizde tutun.
8. Daha önce kullanılmamış gerçek bir adresle tek bir kontrollü kayıt yapın. Resend `Emails` ekranında `Delivered`, Supabase `auth_logs` içinde başarılı signup ve gelen mesajda çalışan doğrulama bağlantısı görmeden limiti yükseltmeyin.
9. Supabase `Authentication > Rate Limits` alanında `Emails sent` değerini başlangıçta **30/saat** bırakın. Sağlayıcının günlük/aylık kotasını ve gerçek trafik ölçümünü görmeden daha yukarı çıkmayın.

[Resend–Supabase SMTP rehberi](https://resend.com/docs/send-with-supabase-smtp), [WordPress.com DNS kaydı ekleme](https://wordpress.com/support/domains/custom-dns/add-a-new-dns-record/)

##### Cloudflare Turnstile ile bot koruması

Custom SMTP daha yüksek kapasite sağlar ama botların bu yeni kotayı tüketmesini tek başına engellemez. Uygulama signup ve login çağrılarına Turnstile token'ı gönderecek şekilde hazırlanmıştır; ayrıca aynı sekmedeki çift submit kilitlenir ve Supabase `429` yanıtından sonra buton 60 saniye bekletilir. Bu client cooldown yalnız kullanıcı deneyimidir, güvenlik sınırı değildir.

1. Cloudflare Dashboard > `Turnstile > Add widget` alanında managed bir widget oluşturun.
2. Production hostname olarak `ovgudevecisafi.com` ekleyin; Cloudflare bu kaydın `www` dahil alt alanlarını da yetkilendirir. Preview hostname'i ayrıca izinli değilse production Turnstile anahtarını Preview'da kullanmayın.
3. Cloudflare'ın verdiği **Site key** değerini Vercel Production ortamına `NEXT_PUBLIC_TURNSTILE_SITE_KEY` olarak ekleyin. Bu public değerdir; `Secret key` değildir.
4. Yeni kodu deploy edin ve `/auth/signup` ile `/auth/login` sayfalarında Turnstile widget'ının yüklendiğini doğrulayın. Bu aşamada Supabase CAPTCHA henüz kapalı kalmalıdır.
5. Cloudflare'ın verdiği **Secret key** değerini Supabase Dashboard > `Authentication > Bot and Abuse Protection > Enable CAPTCHA protection` alanında `Cloudflare Turnstile` sağlayıcısıyla kaydedin. Secret key Vercel'e veya Git'e girilmez.
6. CAPTCHA'yı etkinleştirin ve hemen kontrollü bir login ile signup testi yapın. `captcha_failed` görülürse toggle'ı kapatıp site key/secret eşleşmesini ve hostname izin listesini düzeltin; art arda denemelerle e-posta kotasını tüketmeyin.

Sıra ters çevrilmemelidir: Supabase CAPTCHA, frontend token desteği production'a çıkmadan açılırsa hem kayıt hem giriş istekleri reddedilebilir. [Supabase CAPTCHA rehberi](https://supabase.com/docs/guides/auth/auth-captcha)

CAPTCHA production Supabase projesinde açıldıktan sonra site key bulunmayan yerel veya Preview formları token gönderemeyeceği için bu ortamlardaki login/signup beklenen biçimde reddedilir. Cloudflare production widget'ına `localhost` eklenmesini önermediğinden, düzenli yerel Auth geliştirmesi gerekiyorsa ayrı bir staging Supabase projesi ile Cloudflare test key/secret çiftini kullanın; test secret'ını production Supabase projesine yazmayın. Production dışındaki Auth akışına ihtiyacınız yoksa site key'i yalnız Vercel `Production` ortamında tutun.

SMTP kullanıcı adı ve parolası `.env.local` veya repoya yazılmaz; Supabase Dashboard'da tutulur. Uygulama bilinen Auth hata kodlarını Türkçe ve güvenli mesaja çevirir, fakat gerçek proje kotasını koddan yükseltemez. [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) ve [production kontrol listesi](https://supabase.com/docs/guides/deployment/going-into-prod)

## Ortam değişkenleri

İlk kurulumda, yalnızca `.env.local` dosyası henüz yoksa örnek dosyayı kopyalayın:

```bash
cp .env.local.example .env.local
```

Ardından `.env.local` dosyasını doldurun:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=Cloudflare_public_site_key
SUPABASE_SERVICE_ROLE_KEY=...

NEXT_PUBLIC_SITE_NAME="Yazar Adı"
NEXT_PUBLIC_SITE_DESCRIPTION="Hikayeler ve Düşünceler"
NEXT_PUBLIC_SITE_URL=https://ovgudevecisafi.com
ADMIN_USER_ID=Supabase_Auth_kullanici_UUID_degeri
RATE_LIMIT_SECRET=uzun_ve_rastgele_bir_deger
CRON_SECRET=farkli_uzun_ve_rastgele_bir_deger
```

`RATE_LIMIT_SECRET` ve `CRON_SECRET` için aşağıdaki komutu ayrı ayrı çalıştırın; iki değişkende aynı çıktıyı kullanmayın:

```bash
openssl rand -hex 32
```

`NEXT_PUBLIC_TURNSTILE_SITE_KEY` public widget kimliğidir ve tarayıcıya gönderilir. Cloudflare Turnstile **Secret key** bu değişkene yazılmaz; yalnız Supabase Auth CAPTCHA ayarında tutulur. `RATE_LIMIT_SECRET` ve `CRON_SECRET` yalnızca sunucu içindir: `NEXT_PUBLIC_` öneki almamalı, Git'e eklenmemeli ve tarayıcı koduna gönderilmemelidir. `CRON_SECRET` özellikle Vercel `Production` ortamına deployment'tan önce eklenir; Vercel günlük cron isteğinde bu değeri Bearer token olarak otomatik kullanır.

Eski `ADMIN_EMAIL` ve `NEXT_PUBLIC_ADMIN_EMAIL` değişkenleri artık kullanılmaz. İlk yönetici yalnızca `ADMIN_USER_ID` ile belirlenir.

## `ovgudevecisafi.com` alan adına geçiş

Domain WordPress.com hesabında kalabilir; transfer zorunlu değildir. DNS değişikliğini ancak yeni sürüm Vercel önizleme adresinde doğrulandıktan ve gerçek kitap kayıtları taşındıktan sonra yapın.

1. Güncel kodu GitHub'a gönderin ve Vercel'de projeyi bu repodan oluşturun.
2. Yukarıdaki ortam değişkenlerinin tamamını, özellikle `CRON_SECRET` değerini Vercel `Production` ortamına ekleyin ve yeniden deploy edin.
3. Vercel `Domains` alanına önce `ovgudevecisafi.com`, sonra `www.ovgudevecisafi.com` ekleyin; apex adresi birincil yapın.
4. Vercel'in gösterdiği güncel DNS kayıtlarını WordPress.com `Domains > ovgudevecisafi.com > DNS records` ekranına girin. Vercel'in gösterdiği değerleri esas alın; ezbere IP kullanmayın.
5. Supabase `Authentication > URL Configuration` içinde Site URL'yi `https://ovgudevecisafi.com`, Redirect URL'yi `https://ovgudevecisafi.com/auth/callback` yapın. Yerel geliştirme için `http://localhost:3000/auth/callback` adresini de redirect listesinde tutabilirsiniz.
6. `/`, `/ben-kimim`, `/etkinlikler`, `/iletisim`, `/pano`, `/fan-art`, `/robots.txt` ve `/sitemap.xml` adreslerini kontrol edin.

Eski `/kayip-liman` ve `/tanri-kuyusunun-kemikleri` adresleri ancak aynı slug'lı gerçek kitaplar Supabase'e taşındığında kalıcı olarak yeni kitap rotalarına yönlendirilmelidir. Şu anda örnek kitaplara yönlendirme yapılmaz.

## Yayından sonra güncelleme

- Kitap, bölüm, blog, etkinlik, kullanıcı, mesaj ve fan art moderasyon işlemleri yönetim panelinden yapılır. Bunlar Supabase'e kaydedildiği için Git commit'i veya Vercel dağıtımı gerekmez.
- Tasarım, sayfa düzeni, uygulama davranışı ve mevcut YouTube listesi kodun parçasıdır. Bunlar aşağıdaki Git/Vercel akışıyla yayımlanır.
- Hatalı bir kod sürümü yayımlanırsa Vercel'deki önceki production deployment'a rollback yapılabilir. Bu işlem Supabase verilerini veya migration'ları geri almaz.

### Kod değişikliğini güvenli biçimde `main` dalına taşıma

`main` bu projenin canlı production dalıdır. `main` güncellendiğinde Vercel otomatik olarak yeni canlı sürüm oluşturur. Bu nedenle doğrudan `main` üzerinde çalışmak yerine değişikliği ayrı bir dalda hazırlayıp Vercel Preview'da kontrol etmek daha güvenlidir.

#### 1. Temiz ve güncel bir `main` ile başlayın

Terminali açın ve sırayla çalıştırın:

```bash
cd /Users/kcyesilyurt/.codex/author-blog
git status --short
git switch main
git pull --ff-only origin main
git status --short
```

İlk ve son `git status` komutu normalde hiçbir çıktı vermemelidir. Beklemediğiniz dosyalar görünüyorsa sonraki komuta geçmeyin; onları silmeden veya ezmeden önce ne olduklarını kontrol edin. `git pull --ff-only`, uzak ve yerel geçmiş ayrışmışsa otomatik birleştirme yapmadan durur.

#### 2. Değişiklik için ayrı bir dal oluşturun

Dal adında boşluk veya Türkçe karakter kullanmayın:

```bash
git switch -c degisiklik/kisa-aciklama
```

Örneğin YouTube videolarını değiştirmek için `degisiklik/youtube-videolari` adı kullanılabilir.

#### 3. Dosyaları düzenleyip yerelde kontrol edin

Değişikliği kod editöründe yaptıktan sonra proje kökünde şu kontrolleri çalıştırın:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Komutlardan biri hata verirse commit veya push yapmayın. Önce hatayı düzeltin. `npm run build` sırasında Google Fonts ağ hatası alınırsa internet bağlantısını kontrol edip bir kez daha deneyebilirsiniz; TypeScript veya kod hatasını ağ hatası sanmayın.

#### 4. Yalnızca istediğiniz dosyaları commit edin

Önce değişiklikleri inceleyin:

```bash
git status --short
git diff --check
git diff
git check-ignore -v .env.local
```

Son komut `.env.local` dosyasının `.gitignore` tarafından dışlandığını göstermelidir. Bu repo herkese açık olduğu için `.env.local`, Supabase service-role/secret anahtarı, Vercel token'ı, özel anahtar veya parola hiçbir zaman commit edilmemelidir.

`git add .` yerine yalnızca gerçekten değiştirdiğiniz dosyaları açıkça yazın. Örnek:

```bash
git add src/app/page.tsx KULLANIM.md
git diff --cached
git commit -m "Update homepage videos"
```

`git diff --cached`, commit'e girecek son içeriği gösterir. Burada beklenmeyen dosya veya gizli bilgi görürseniz commit işlemine devam etmeyin.

#### 5. Dalı GitHub'a gönderip Preview'u deneyin

Komuttaki dal adını ikinci adımda seçtiğiniz adla aynı yazın:

```bash
git push -u origin degisiklik/kisa-aciklama
```

Ardından GitHub'da `kcyesilyurt/author-blog` reposunu açın:

1. `Compare & pull request` düğmesine basın.
2. `base` alanının `main`, `compare` alanının değişiklik dalınız olduğunu doğrulayın.
3. Pull request'i oluşturun ve Vercel kontrolünün tamamlanmasını bekleyin.
4. Vercel'in verdiği Preview bağlantısında `/`, `/pano`, değişen sayfa ve mobil görünümü kontrol edin.

Preview ortamı production ile aynı Supabase projesini kullanıyorsa panelden yaptığınız ekleme/silme işlemleri gerçek veriyi değiştirebilir. Preview'u mümkün olduğunca görüntüleme ve tasarım testi için kullanın. Preview build ortam değişkeni hatası verirse Vercel `Project > Settings > Environment Variables` ekranında gerekli değişkenlerin `Preview` kapsamına da açık olduğunu kontrol edin; anahtarları koda yazmayın.

#### 6. Değişikliği canlıya alın

Preview doğru ve Vercel kontrolü yeşilse GitHub pull request ekranından `Merge pull request` düğmesine basın. Birleştirme `main` dalını günceller ve Vercel production deployment'ını otomatik başlatır.

1. Vercel `Deployments` ekranında yeni production kaydının `Ready` olmasını bekleyin.
2. Canlı ana sayfayı ve değiştirdiğiniz rotaları kontrol edin.
3. Yerel kopyayı yeniden güncelleyin:

```bash
git switch main
git pull --ff-only origin main
git status --short
```

#### 7. Canlı sürümde sorun çıkarsa

- Yeni commit göndermeye devam etmeyin ve `git push --force`, `git reset --hard` gibi geçmişi ezen komutları kullanmayın.
- Hızlı geri dönüş için Vercel `Deployments` ekranından bir önceki sağlıklı production sürümüne rollback yapın.
- Kalıcı düzeltme için hatalı commit'i `git revert` ile geri alan yeni bir commit oluşturabilirsiniz:

```bash
git switch main
git pull --ff-only origin main
git log --oneline -5
git revert HATALI_COMMIT_KIMLIGI
git push origin main
```

`git revert` editör açarsa varsayılan mesajı kaydedip kapatın. Bu yalnızca kod sürümünü geri alır; Supabase migration'ı veya production verisi etkilenmişse ayrıca değerlendirme gerekir.

Bu akış GitHub'ın pull request geçmişini, Vercel Preview kontrolünü ve geri dönüş imkânını korur. Yalnızca yönetim panelinden yapılan içerik değişikliklerinde bu komutların hiçbirine ihtiyaç yoktur.

Resmî başvuru sayfaları: [GitHub pull request oluşturma](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request) ve [Vercel Git deployment akışı](https://vercel.com/docs/git).

## Yayındaki siteyi geçici kapatma

Alan adı Vercel'e bağlandıktan sonra site bilgisayarınız ve `npm run dev` kapalıyken de barındırılmaya devam eder.

- Okura düzgün bir açıklama göstermek için önerilen yöntem, açılıp kapatılabilen bir bakım sayfasıdır.
- Vercel'in sert proje duraklatma işlemi REST API üzerinden yapılır ve ziyaretçilere `503 DEPLOYMENT_PAUSED` gösterir. Proje daha sonra Vercel Project Settings içindeki `Resume Service` ile, yeniden deploy gerekmeden açılabilir. Erişim belirteci kesinlikle repoya veya ekran görüntüsüne konmamalıdır.
- DNS kayıtlarını silmek veya Vercel projesini silmek geçici kapatma yöntemi olarak kullanılmamalıdır.

Vercel Hobby planı yalnızca kişisel ve ticari olmayan kullanıma izin verir. Bu site bir yazarın kitaplarını tanıtıyor ve müşteri için hazırlanıyorsa Vercel'in [ticari kullanım tanımına](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage) büyük olasılıkla girer; canlıya geçmeden önce Pro planı değerlendirin.

## İlk yöneticiyi oluşturma

1. Uygulamayı çalıştırın ve `/auth/signup` sayfasından yazar hesabını oluşturun.
2. E-posta doğrulaması açıksa gelen bağlantıyı onaylayın.
3. Supabase Dashboard > `Authentication` > `Users` sayfasını açın.
4. Yazar hesabının `User UID`/UUID değerini kopyalayın.
5. Bu değeri `.env.local` içindeki `ADMIN_USER_ID` alanına yazın.
6. Geliştirme sunucusunu durdurup yeniden başlatın.
7. Yazar hesabıyla giriş yapıp `/admin` sayfasını açın.

Bu ilk ziyarette ilgili profil yönetici olarak işaretlenir. E-posta adresine göre otomatik yönetici yetkisi verilmez.

## Siteyi yerelde açma

Proje üretimle aynı çalışma ortamını kullanmak için Node.js 22.x sürümüne sabitlenmiştir.

```bash
cd /Users/kcyesilyurt/.codex/author-blog
npm install
npm run dev
```

Ardından tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın. `3000` portu doluysa Next.js terminalde kullandığı diğer adresi gösterir; isterseniz `npm run dev -- -p 3001` komutuyla sabit başka bir port seçebilirsiniz.

## Sorun giderme

- Ana sayfada eserler görünmüyorsa eser ve bölümün yayın durumunu/tarihini kontrol edin.
- `column ... status does not exist` hatası varsa güvenlik/yayın migration'ı çalıştırılmamıştır.
- Yorum veya Pano gönderilemiyorsa `community_rate_limits` tablosu ve RPC fonksiyonu için ilk migration'ı çalıştırın.
- Profilde kullanıcı adı kaydedilemiyor veya yorumlar yüklenmiyorsa altıncı migration'ın çalıştığını, `profiles.username` alanını ve `anon`/`authenticated` kolon `SELECT` izinlerini kontrol edin.
- Etkinlikler görünmüyor veya iletişim formu çalışmıyorsa üçüncü migration'ın tamamını çalıştırıp `events` ile `contact_messages` tablolarını kontrol edin.
- Kapak/avatar yüklenemiyorsa Storage'da `covers` ve `avatars` bucket'larını ve boyut sınırlarını kontrol edin.
- Fan art yüklenemiyorsa beşinci migration'ın tamamlandığını, `fan-art-staging`/`fan-art` bucket'larını ve Storage global limitinin en az 10 MB olduğunu kontrol edin.
- Fan art cleanup kuyruğu küçülmüyorsa Vercel Production ortamında `CRON_SECRET` bulunduğunu, secret eklendikten sonra yeniden deploy edildiğini ve `Settings > Cron Jobs > View Logs` yanıtını kontrol edin. `401` secret/header uyuşmazlığına, `500` cleanup bağımlılıklarındaki hataya işaret eder.
- Sayaçlar görünmüyorsa dördüncü migration'ı; geçici tekilleştirme tablosu büyüyorsa Cron iş geçmişini kontrol edin.
- Yönetim paneli açılmıyorsa giriş yaptığınız hesabın UUID değeri ile `ADMIN_USER_ID` değerinin aynı olduğunu kontrol edip sunucuyu yeniden başlatın.
- E-posta doğrulama bağlantısı yanlış adrese gidiyorsa Supabase Auth `Site URL` ve `Redirect URLs` ayarlarını kontrol edin.
- `email rate limit exceeded` veya `over_email_send_rate_limit` görülüyorsa custom SMTP ve proje-geneli e-posta kotasını; `over_request_rate_limit` için istemci/IP trafiğini; `email_address_not_authorized` için varsayılan SMTP alıcı kısıtını kontrol edin.

## Teknik doğrulama

Değişikliklerden sonra aşağıdaki komutlar kullanılabilir:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```
