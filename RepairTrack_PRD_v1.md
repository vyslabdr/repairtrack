# RepairTrack — Tamir Takip Sistemi
## Proje Gereksinim Belgesi (PRD) · v1.0

> **Dil:** Uygulama arayüzü yalnızca **Yunanca (el-GR)**  
> **Sürüm:** v1.0.0 — ilk yayın  
> **Son Güncelleme:** Mart 2026

---

## 1. Proje Genel Bakış

| Alan | Detay |
|------|-------|
| **Uygulama Adı** | RepairTrack |
| **Amaç** | Tamire gelen cihazların alımdan teslimata kadar dijital takibi |
| **Frontend** | Next.js 14 (App Router) |
| **Backend / DB** | PostgreSQL — uzak sunucu (remote bağlantı) |
| **ORM** | Prisma |
| **Auth** | NextAuth.js v5 (JWT) |
| **Dil** | Yalnızca Yunanca (el-GR) |
| **Responsive** | Mobil · Tablet · Desktop |

---

## 2. Teknoloji Stack

### Frontend
- **Next.js 14** — App Router
- **Tailwind CSS** + **shadcn/ui** — UI bileşenleri
- **React Hook Form** + **Zod** — form validasyonu
- **Recharts** — dashboard grafikleri
- **Zustand** — global state
- **next-themes** — Dark / Light tema

### Backend
- **Next.js API Routes / Server Actions**
- **Prisma ORM** — PostgreSQL bağlantısı
- **bcryptjs** — şifre hashleme
- **NextAuth.js v5** — session yönetimi

### Deployment & Versiyon
- **GitHub** — kaynak kod
- **Vercel veya VPS** (PM2 + Nginx)
- **Semantic Versioning** — v1.0.0, v1.1.0 …
- **GitHub Actions** *(opsiyonel — v1.1)*

---

## 3. Veritabanı Şeması

### `users` — Kullanıcılar
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
name        VARCHAR(100) NOT NULL
email       VARCHAR(150) UNIQUE NOT NULL
password    VARCHAR(255) NOT NULL          -- bcrypt hash
role        ENUM('admin','manager','technician') NOT NULL
is_active   BOOLEAN DEFAULT true
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

### `devices` — Cihazlar
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
ticket_id       VARCHAR(20) UNIQUE NOT NULL   -- Örn: TRM-A3X9
customer_name   VARCHAR(100) NOT NULL
customer_phone  VARCHAR(20)  NOT NULL
customer_email  VARCHAR(150)
brand           VARCHAR(80)  NOT NULL
model           VARCHAR(100) NOT NULL
serial_number   VARCHAR(100)
issue_desc      TEXT NOT NULL
status          ENUM('received','inspecting','repairing',
                     'awaiting_delivery','archived') DEFAULT 'received'
technician_id   UUID REFERENCES users(id)
estimated_date  DATE
repair_cost     DECIMAL(10,2)
warranty        BOOLEAN DEFAULT false
notes           TEXT
photos          TEXT[]                        -- URL dizisi
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

### `device_history` — Durum Geçmişi
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
device_id   UUID REFERENCES devices(id) ON DELETE CASCADE
changed_by  UUID REFERENCES users(id)
old_status  VARCHAR(50)
new_status  VARCHAR(50)
note        TEXT
changed_at  TIMESTAMP DEFAULT NOW()
```

### `system_settings` — Sistem Ayarları
```sql
key         VARCHAR(100) PRIMARY KEY
value       TEXT
updated_at  TIMESTAMP DEFAULT NOW()
```

### Ticket ID Formatı
- **`TRM-XXXX`** — 4 karakter alfanümerik rastgele kod
- Örnekler: `TRM-A3X9` · `TRM-7KM2` · `TRM-B0P1`
- Veritabanında `UNIQUE` constraint + çakışma kontrollü üretim

---

## 4. Kullanıcı Rolleri & Yetki Matrisi

| Özellik | Admin | Manager | Technician |
|---------|:-----:|:-------:|:----------:|
| Dashboard görüntüleme | ✅ | ✅ | ✅ |
| Yeni cihaz kaydı | ✅ | ✅ | ✅ |
| Cihaz durumu güncelleme | ✅ | ✅ | ✅ |
| Fotoğraf yükleme | ✅ | ✅ | ✅ |
| Tamir ücreti görme | ✅ | ✅ | ❌ |
| Rapor / istatistik | ✅ | ✅ | ❌ |
| Kullanıcı ekleme | ✅ | ❌ | ❌ |
| Kullanıcı düzenleme/silme | ✅ | ❌ | ❌ |
| Sistem ayarları | ✅ | ❌ | ❌ |
| Versiyon kontrolü | ✅ | ❌ | ❌ |

### Varsayılan Admin Hesabı
```
Email  : admin@repairtrack.local
Şifre  : Admin@1234   ← ilk girişte değiştirme zorunlu
Rol    : admin
```
> Seed: `npx prisma db seed` — değerler `.env` içinde `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`

---

## 5. Sayfa & Ekran Yapısı

### 5.1 `/login` — Giriş Ekranı
- Merkezi kart tasarımı, logo + uygulama adı
- E-posta + şifre alanları
- "Beni hatırla" toggle
- Hata mesajları Yunanca
- İlk girişte şifre değiştirme zorunluluğu

---

### 5.2 `/dashboard` — Ana Dashboard

**Header:**
- Sol: Logo + "RepairTrack"
- Sağ: Kullanıcı avatarı · isim · rol badge · çıkış · tema toggle

**Status Kartları (5 adet — tıklanabilir, filtreleyici)**

| # | Yunanca Etiketi | Renk | İkon |
|---|----------------|------|------|
| 1 | Παραλήφθηκε *(Alındı)* | 🔵 Mavi | `inbox` |
| 2 | Υπό Εξέταση *(İnceleniyor)* | 🟡 Sarı | `search` |
| 3 | Υπό Επισκευή *(Tamir Ediliyor)* | 🟠 Turuncu | `wrench` |
| 4 | Αναμονή Παράδοσης *(Teslimat Bekl.)* | 🟢 Yeşil | `truck` |
| 5 | Αρχείο *(Arşiv)* | ⚫ Gri | `archive` |

Her kartın altında o statüdeki toplam cihaz sayısı gösterilir.

**Grafikler (admin + manager):**
- Çubuk grafik: Son 7 gün yeni cihaz sayısı
- Pasta grafik: Mevcut durum dağılımı

**Son Aktivite:** Son 10 durum değişikliği (cihaz · kişi · zaman)

**Hızlı Aksiyonlar:**
- `[+ Νέα Συσκευή]` butonu — modal açar
- Arama kutusu — ticket ID veya müşteri adı

---

### 5.3 `/devices` — Cihaz Listesi

- **Desktop:** Tablo görünümü (sticky header, striped rows)
- **Mobile:** Kart görünümü
- **Sütunlar:** Ticket ID · Müşteri · Cihaz · Durum · Teknisyen · Tarih · İşlemler
- **Filtreler:** Durum · Teknisyen · Tarih aralığı · Arama kutusu
- **Sıralama:** Tüm sütunlarda
- **Sayfalama:** 20 kayıt / sayfa
- Satır üzerinde durum dropdown → anında güncelleme → `device_history` kaydı

---

### 5.4 `/devices/[id]` — Cihaz Detayı

```
┌──────────────────────────────────────┐
│  TRM-A3X9          [Υπό Επισκευή]   │
│  Oluşturma: 12 Mar 2026              │
├──────────────────────────────────────┤
│ Müşteri            │ Cihaz           │
│ Ad Soyad           │ Marka / Model   │
│ Telefon            │ Seri No         │
│ E-posta            │ Garanti: E/H    │
├──────────────────────────────────────┤
│ Arıza Açıklaması (tam metin)         │
├──────────────────────────────────────┤
│ Teknisyen · Tahmini Tarih            │
│ Tamir Ücreti (rol bazlı görünür)     │
├──────────────────────────────────────┤
│ Fotoğraflar (grid, büyütme destekli) │
├──────────────────────────────────────┤
│ Durum Geçmişi (timeline)             │
├──────────────────────────────────────┤
│ Notlar (serbest metin ekleme)        │
└──────────────────────────────────────┘
[Düzenle]  [Durum Güncelle]  [Yazdır]  [Sil — admin only]
```

---

### 5.5 Yeni Cihaz Modalı

Dashboard ve liste sayfasından açılır. Tam ekran overlay, blur arka plan, ESC ile kapanır.

#### Müşteri Bilgileri
| Alan | Zorunlu |
|------|:-------:|
| Ad Soyad | ✅ |
| Telefon | ✅ |
| E-posta | ❌ |

#### Cihaz Bilgileri
| Alan | Zorunlu |
|------|:-------:|
| Marka (autocomplete) | ✅ |
| Model | ✅ |
| Seri No | ❌ |
| Garanti kapsamında mı? | ❌ |

#### Arıza & Servis
| Alan | Zorunlu |
|------|:-------:|
| Arıza açıklaması | ✅ |
| Tahmini teslim tarihi | ❌ |
| Tamir ücreti teklifi *(admin/manager)* | ❌ |
| Atanan teknisyen | ❌ |
| Fotoğraf yükle (max 5) | ❌ |
| Ek notlar | ❌ |

**Submit sonrası:** TRM-XXXX üretilir → başarı mesajı + ticket ID → yazdırılabilir makbuz seçeneği

---

### 5.6 `/users` — Kullanıcı Yönetimi *(yalnızca Admin)*

- Aktif kullanıcılar tablosu
- Yeni kullanıcı ekle modal (Ad, Email, Şifre, Rol)
- Şifre otomatik oluştur seçeneği
- Rol değiştirme
- Soft delete (deaktif etme)

---

### 5.7 `/reports` — Raporlar *(Admin + Manager)*

- Tarih aralığı seçici
- Toplam alınan cihaz · durum dağılımı · teknisyen bazlı yük · ortalama tamir süresi
- CSV dışa aktarma

---

### 5.8 `/settings` — Sistem Ayarları *(yalnızca Admin)*

- Mağaza adı / logo
- Kendi şifresini değiştirme
- **Versiyon Paneli:**
  - Mevcut sürüm: `v1.0.0`
  - "GitHub'dan sürüm kontrol et" butonu
  - Son kontrol zamanı
  - Yeni sürüm varsa uyarı + changelog

---

## 6. Güncelleme Sistemi *(Opsiyonel — v1.1)*

Admin panelindeki buton → GitHub Releases API → sürüm karşılaştırması.
Yeni sürüm varsa bildirim badge + release notları gösterilir.

**GitHub Actions otomatik deploy taslağı:**
```yaml
name: Deploy on Push
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/repairtrack
            git pull origin main
            npm install --production
            npx prisma migrate deploy
            pm2 restart repairtrack
```

---

## 7. Tasarım Sistemi

### Renk Paleti — Dark Tema (varsayılan)
```css
--bg:             #0F1117   /* Ana arka plan      */
--surface:        #1A1D27   /* Kart / panel       */
--surface-hover:  #22263A   /* Hover state        */
--border:         #2E3347   /* Çizgi / border     */
--primary:        #6366F1   /* Indigo aksiyon     */
--primary-hover:  #4F46E5
--text-1:         #F1F5F9   /* Ana metin          */
--text-2:         #94A3B8   /* İkincil metin      */
--success:        #22C55E
--warning:        #F59E0B
--danger:         #EF4444
--info:           #3B82F6
```

### Tipografi
- **Font:** Inter (Google Fonts)
- Weight: 400 gövde · 600-700 başlık
- Scale: 12 · 14 · 16 · 20 · 24 · 32 px

### Komponent Kuralları
- Kartlar: `rounded-xl` + hafif gölge + border
- Butonlar: `rounded-lg` + hover animasyonu + loading state
- Tablolar: striped rows + hover highlight + sticky header
- Modallar: blur overlay + slide-in animasyon
- Badge: status rengiyle eşleşen pill
- Toast: sağ alt köşe, 3 sn otomatik kapanma

### Responsive Breakpoints
| Ekran | Genişlik | Davranış |
|-------|----------|----------|
| Mobile | < 640px | Kart görünüm · hamburger menü |
| Tablet | 640–1024px | Sidebar collapse edilebilir |
| Desktop | > 1024px | Tam sidebar · tablo görünümü |

### Sidebar Navigasyon
```
📊  Πίνακας Ελέγχου   (Dashboard)
📱  Συσκευές          (Cihazlar)
👥  Χρήστες           (Kullanıcılar)   — Admin only
📈  Αναφορές          (Raporlar)       — Admin + Manager
⚙️  Ρυθμίσεις         (Ayarlar)        — Admin only
```

---

## 8. API Endpoint Listesi

```
# Auth
POST   /api/auth/login
POST   /api/auth/logout

# Cihazlar
GET    /api/devices                  liste (filtreli, sayfalı)
POST   /api/devices                  yeni cihaz
GET    /api/devices/:id              detay
PATCH  /api/devices/:id              güncelle
PATCH  /api/devices/:id/status       yalnızca durum
DELETE /api/devices/:id              soft delete — admin only

# Kullanıcılar
GET    /api/users                    liste — admin only
POST   /api/users                    yeni kullanıcı — admin only
PATCH  /api/users/:id                düzenle
PATCH  /api/users/:id/deactivate     deaktif et

# Dashboard & Raporlar
GET    /api/dashboard/stats
GET    /api/reports/summary

# Yardımcı
POST   /api/upload/photo
GET    /api/system/version           GitHub API karşılaştırması
```

---

## 9. Ortam Değişkenleri (.env)

```env
# Veritabanı (uzak sunucu)
DATABASE_URL="postgresql://user:password@remote-host:5432/repairtrack_db"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="change-this-secret"

# Admin seed
SEED_ADMIN_EMAIL="admin@repairtrack.local"
SEED_ADMIN_PASSWORD="Admin@1234"

# Fotoğraf yükleme
UPLOAD_PROVIDER="local"          # "local" | "cloudinary"
CLOUDINARY_URL=""                # Cloudinary kullanılırsa

# GitHub versiyon kontrolü (opsiyonel)
GITHUB_REPO="username/repairtrack"
GITHUB_TOKEN=""
```

---

## 10. Kurulum

```bash
# 1. Repo klonla
git clone https://github.com/username/repairtrack.git
cd repairtrack

# 2. Bağımlılıklar
npm install

# 3. .env hazırla
cp .env.example .env
# DATABASE_URL ve diğer değerleri doldur

# 4. Migration
npx prisma migrate dev --name init

# 5. Admin kullanıcı oluştur
npx prisma db seed

# 6. Geliştirme sunucusu
npm run dev
```

---

## 11. Proje Klasör Yapısı

```
repairtrack/
├── app/
│   ├── (auth)/login/
│   └── (dashboard)/
│       ├── dashboard/
│       ├── devices/
│       │   └── [id]/
│       ├── users/
│       ├── reports/
│       ├── settings/
│       └── layout.tsx          ← sidebar + header
├── app/api/
│   ├── auth/
│   ├── devices/
│   ├── users/
│   ├── dashboard/
│   ├── reports/
│   ├── upload/
│   └── system/
├── components/
│   ├── ui/                     ← shadcn/ui
│   ├── layout/                 ← Sidebar, Header
│   ├── devices/                ← Form, List, Detail
│   ├── dashboard/              ← StatCard, Charts
│   └── modals/                 ← NewDevice, EditDevice
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── ticket.ts               ← TRM-XXXX üretici
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/uploads/
├── types/
├── .env.example
└── package.json                ← version: "1.0.0"
```

---

## 12. Sürüm Geçmişi

| Sürüm | Tarih | Notlar |
|-------|-------|--------|
| v1.0.0 | 2026 Q1 | İlk yayın — temel cihaz takip sistemi |

---

## 13. v2 Yol Haritası

- [ ] Müşteriye SMS / e-posta bildirimi (cihaz hazır)
- [ ] Ticket ID ile müşteri self-servis sorgulama
- [ ] WhatsApp entegrasyonu
- [ ] Şifremi unuttum akışı
- [ ] Çoklu mağaza desteği
- [ ] Otomatik sunucu güncelleme (GitHub Actions)
- [ ] PWA / mobil uygulama

---

*Bu belge RepairTrack v1.0 geliştirme sürecinde temel referans dokümanı olarak kullanılacaktır.*
