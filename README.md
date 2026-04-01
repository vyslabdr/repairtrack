# RepairTrack

Tamir servisleri için geliştirilmiş, modern ve kullanımı kolay cihaz takip sistemi. Müşteri cihazlarını kayıt altına alın, tamir sürecini yönetin ve müşterilere anlık durum bilgisi sağlayın.

---

## Özellikler

### Cihaz Yönetimi
- Cihaz kaydı oluşturma (marka, model, arıza açıklaması, tahmini tarih, ücret)
- Otomatik ticket numarası üretimi (`TRM-XXXX` formatı)
- Durum takibi: Teslim Alındı → İnceleniyor → Tamirde → Teslime Hazır → Arşiv
- Fotoğraf yükleme (cihaz başına maks. 5 fotoğraf, ID bazlı klasörleme)
- Fotoğraf silme ile dosya sisteminden otomatik temizleme
- Arşivlenen cihazlar varsayılan listede gizli; yalnızca filtre/arama ile görünür

### Dashboard
- Anlık durum kartları (Teslim Alındı / İnceleniyor / Tamirde / Teslime Hazır)
- Son 8 cihaz listesi (arşiv hariç)
- Canlı aktivite akışı (durum değişiklikleri)
- Haftalık yeni cihaz grafiği (Admin / Manager)
- Gelir ve istatistik raporları

### Müşteri Takip Sayfası
- Public URL: `/track/[ticket-id]` — giriş gerektirmez
- Müşteri adı ve telefon gizli tutulur (gizlilik)
- Görsel ilerleme adımları ve durum geçmişi
- Dükkan adı ve logosu ile markalı görünüm

### Kullanıcı ve Rol Yönetimi
- Üç rol: **Admin**, **Manager**, **Technician**
- Kullanıcı oluşturma, düzenleme, deaktive etme (Admin)
- Zorunlu ilk giriş şifre değiştirme
- "Beni hatırla" seçeneği (30 gün / 1 gün JWT)

### Dükkan Ayarları
- Dükkan adı değiştirme → Header, login ve takip sayfasına anında yansır
- Logo yükleme → Tüm sayfalarda görünür
- Şifre değiştirme

### Teknik Özellikler
- Gerçek zamanlı cihaz içi mesajlaşma (polling)
- Rol bazlı sayfa ve API erişim kontrolü
- Koyu / Açık tema desteği
- Mobil uyumlu (responsive) tasarım
- Fotoğraf lightbox görüntüleyici

---

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 14 (App Router) |
| Dil | TypeScript |
| Veritabanı | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth v5 (JWT) |
| UI | Tailwind CSS + shadcn/ui |
| Animasyon | Framer Motion |
| İkonlar | Lucide React |

---

## Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL veritabanı

### 1. Repoyu klonlayın

```bash
git clone https://github.com/vyslabdr/repairtrack.git
cd repairtrack
```

### 2. Bağımlılıkları yükleyin

```bash
npm install
```

### 3. Ortam değişkenlerini ayarlayın

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/repairtrack"
AUTH_SECRET="guclu-rastgele-bir-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Veritabanını oluşturun

```bash
npx prisma migrate deploy
npx prisma db seed
```

Seed işlemi varsayılan admin hesabı oluşturur:
- **Email:** `admin@repairtrack.local`
- **Şifre:** `admin123` *(ilk girişte değiştirmeniz zorunludur)*

### 5. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışır.

---

## Production Build

```bash
npm run build
npm start
```

---

## Klasör Yapısı

```
repairtrack/
├── app/
│   ├── (auth)/          # Login sayfası
│   ├── (dashboard)/     # Korumalı sayfalar (dashboard, cihazlar, ayarlar...)
│   ├── api/             # API route'ları
│   └── track/[id]/      # Public müşteri takip sayfası
├── components/
│   ├── dashboard/       # Dashboard bileşenleri
│   ├── devices/         # Cihaz bileşenleri
│   ├── layout/          # Header, Sidebar
│   ├── modals/          # Modal pencereler
│   └── ui/              # shadcn/ui bileşenleri
├── lib/                 # Prisma, utils, context
├── prisma/              # Schema ve seed
├── public/uploads/      # Yüklenen fotoğraflar (gitignore'da)
└── types/               # TypeScript tipleri
```

---

## Ekran Görüntüleri

> Dashboard, cihaz listesi, müşteri takip sayfası ve ayarlar ekranlarını buraya ekleyebilirsiniz.

---

## Lisans

MIT
