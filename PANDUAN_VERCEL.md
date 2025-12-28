# 📘 Panduan Lengkap Deploy ke Vercel - FrameFusion Genesis

## 🎯 Apa itu Vercel?

Vercel adalah platform hosting modern yang sangat mudah digunakan untuk deploy aplikasi Next.js. Vercel dibuat oleh tim yang sama yang membuat Next.js, jadi kompatibilitasnya sempurna!

**Keuntungan pakai Vercel:**
- ✅ Deploy otomatis dari GitHub
- ✅ HTTPS gratis
- ✅ CDN global (cepat di seluruh dunia)
- ✅ Preview deployment untuk setiap perubahan
- ✅ CRON jobs untuk notifikasi otomatis
- ✅ Environment variables yang aman
- ✅ Monitoring dan analytics

---

## 🚀 Langkah 1: Persiapan Awal

### A. Pastikan Kode di GitHub
1. Pastikan project ini sudah di GitHub
2. Jika belum, buat repository baru di GitHub
3. Push semua kode ke GitHub

### B. Data yang Perlu Disiapkan
Sebelum deploy, siapkan data-data ini:

**Environment Variables yang dibutuhkan:**
```bash
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Lighthouse Storage (NFT Storage)
LIGHTHOUSE_API_KEY=xxx

# Pinata (IPFS)
PINATA_JWT=eyJhbG...

# Farcaster (Notifications)
FARCASTER_APP_PRIVATE_KEY=0x...
FARCASTER_APP_FID=123456

# Wallet Private Keys
PRIVATE_KEY_HEX=0x...

# CRON Security
CRON_SECRET=random_string_yang_sangat_panjang_dan_aman

# Blockchain RPC
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
```

---

## 🌐 Langkah 2: Deploy Pertama Kali

### A. Buat Akun Vercel
1. Buka [vercel.com](https://vercel.com)
2. Klik **"Sign Up"** 
3. Pilih **"Continue with GitHub"** (paling mudah!)
4. Authorize Vercel untuk akses GitHub kamu

### B. Import Project
1. Setelah login, klik **"Add New..."** → **"Project"**
2. Pilih **"Import Git Repository"**
3. Cari repository GitHub kamu (FrameFusion Genesis)
4. Klik **"Import"**

### C. Configure Project
Di halaman konfigurasi:

**Framework Preset:** Next.js (otomatis terdeteksi)

**Root Directory:** ./ (biarkan default)

**Build Command:** 
```bash
npm run build
```

**Output Directory:** 
```
.next
```

**Install Command:**
```bash
npm install
```

### D. Tambahkan Environment Variables
Ini PENTING! Klik **"Environment Variables"** dan tambahkan satu per satu:

1. Ketik nama variable (contoh: `NEXT_PUBLIC_SUPABASE_URL`)
2. Paste value-nya
3. Pilih environment: **Production**, **Preview**, dan **Development** (centang semua)
4. Klik **"Add"**
5. Ulangi untuk semua environment variables di atas

**💡 Tips:** Simpan semua environment variables ini di file text lokal supaya gampang copy-paste!

### E. Deploy!
1. Setelah semua environment variables diisi, klik **"Deploy"**
2. Tunggu 2-5 menit (Vercel akan build project kamu)
3. Kalau berhasil, kamu akan lihat 🎉 **"Congratulations!"**

---

## 🔄 Langkah 3: Setup CRON Jobs

App kamu sudah punya file `vercel.json` dengan CRON jobs:
- **Daily Reminder:** Jam 9 pagi UTC setiap hari
- **Engagement Reminder:** Jam 10 pagi UTC setiap hari

### Cara Kerja CRON Jobs di Vercel:

**Otomatis aktif setelah deploy!** Vercel akan:
1. Jalankan `/api/cron/daily-reminder` setiap hari jam 9:00 AM UTC
2. Jalankan `/api/cron/engagement-reminder` setiap hari jam 10:00 AM UTC

### Verifikasi CRON Jobs:
1. Buka Vercel Dashboard
2. Pilih project kamu
3. Klik tab **"Settings"** → **"Cron Jobs"**
4. Kamu akan lihat 2 CRON jobs terdaftar

### Monitoring CRON Execution:
1. Buka tab **"Logs"** di Vercel Dashboard
2. Filter berdasarkan path: `/api/cron/daily-reminder`
3. Kamu bisa lihat kapan terakhir kali dijalankan dan hasilnya

---

## 🔐 Langkah 4: Keamanan CRON Jobs

### Setup CRON_SECRET

CRON endpoints kamu harus diamankan dengan `CRON_SECRET` supaya hanya Vercel yang bisa memanggil mereka.

**Sudah disetup di code:**
```typescript
// Di file /api/cron/daily-reminder/route.ts
const cronSecret = process.env.CRON_SECRET;
const authHeader = request.headers.get('authorization');

if (authHeader !== `Bearer ${cronSecret}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Cara menambahkan CRON_SECRET:**
1. Buka Vercel Dashboard → Project Settings
2. Klik **"Environment Variables"**
3. Tambahkan:
   - **Name:** `CRON_SECRET`
   - **Value:** `buatRandomStringYangPanjang123!@#`
   - Environment: **Production** saja (untuk keamanan)
4. Klik **"Save"**
5. **Redeploy** project (lihat Langkah 5)

**💡 Generate Random String:**
```bash
# Di terminal, jalankan:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔄 Langkah 5: Update & Redeploy

### Auto Deploy (Recommended)
Vercel otomatis deploy setiap kali kamu push ke GitHub:

1. Edit code di local
2. Commit changes:
   ```bash
   git add .
   git commit -m "Update feature xyz"
   git push origin main
   ```
3. Vercel otomatis detect dan deploy dalam 2-5 menit

### Manual Redeploy
Jika perlu redeploy tanpa code changes (misal habis update environment variables):

1. Buka Vercel Dashboard
2. Pilih project kamu
3. Klik tab **"Deployments"**
4. Klik titik tiga ⋮ di deployment terakhir
5. Pilih **"Redeploy"**
6. Confirm

---

## 📊 Langkah 6: Monitoring & Debugging

### A. View Logs
1. Buka Vercel Dashboard
2. Pilih project kamu
3. Klik tab **"Logs"**
4. Kamu bisa:
   - Filter berdasarkan function/endpoint
   - Filter berdasarkan error level
   - Search keyword tertentu
   - Lihat real-time logs

### B. Check Deployment Status
Tab **"Deployments"** menampilkan:
- ✅ Deployment yang berhasil (hijau)
- ❌ Deployment yang gagal (merah)
- 🔄 Deployment yang sedang berjalan (kuning)

### C. Analytics
Tab **"Analytics"** (free tier terbatas):
- Page views
- Unique visitors
- Top pages
- Response times

### D. Function Logs untuk CRON
Cek apakah CRON jobs berjalan:

1. Klik **"Logs"**
2. Filter: `/api/cron/daily-reminder`
3. Kamu akan lihat:
   ```
   [GET] /api/cron/daily-reminder
   Status: 200
   Duration: 1234ms
   Sent X notifications
   ```

---

## 🌍 Langkah 7: Custom Domain (Optional)

### Tambah Domain Sendiri
1. Buka tab **"Settings"** → **"Domains"**
2. Klik **"Add"**
3. Masukkan domain kamu (contoh: `framefusion.com`)
4. Follow instruksi untuk update DNS:
   - Tambahkan **A Record** atau **CNAME Record**
   - Tunggu propagasi DNS (bisa 5-60 menit)
5. Selesai! Domain kamu aktif dengan HTTPS otomatis

### Domain Gratis dari Vercel
Setiap project dapat domain gratis:
```
your-project-name.vercel.app
```

---

## 🛠️ Troubleshooting

### ❌ Build Failed
**Penyebab:**
- Missing environment variables
- TypeScript errors
- Missing dependencies

**Solusi:**
1. Buka deployment yang failed
2. Klik **"View Build Logs"**
3. Cari error message (biasanya di bagian bawah)
4. Fix error di code
5. Push ke GitHub lagi

### ❌ CRON Jobs Tidak Jalan
**Cek:**
1. Vercel Dashboard → Settings → Cron Jobs (ada di list?)
2. File `vercel.json` sudah correct?
3. CRON_SECRET sudah diset?
4. Cek logs untuk error messages

**Fix:**
1. Pastikan `vercel.json` ada di root directory
2. Redeploy project
3. Tunggu 1 jam untuk test CRON berikutnya

### ❌ Environment Variables Tidak Terdeteksi
**Solusi:**
1. Settings → Environment Variables
2. Pastikan di-select untuk environment yang benar (Production/Preview/Development)
3. Redeploy setelah menambahkan environment variables baru

### ❌ Function Timeout
Free tier Vercel: 10 detik timeout per function

**Solusi:**
- Optimize code supaya lebih cepat
- Batch operations
- Atau upgrade ke Pro plan (60 detik timeout)

---

## 💰 Pricing (Gratis vs Pro)

### Free Plan (Hobby)
✅ Unlimited deployments
✅ 100 GB bandwidth/bulan
✅ CRON jobs (unlimited)
✅ 10 second function timeout
✅ Serverless functions
❌ Team features
❌ Extended analytics

**Cukup untuk app kamu saat ini!**

### Pro Plan ($20/bulan)
✅ Semua fitur Free
✅ 1 TB bandwidth
✅ 60 second timeout
✅ Advanced analytics
✅ Team collaboration
✅ Password protection
✅ Priority support

---

## 📱 Testing Deployed App

### Test Production URL
Setelah deploy berhasil:

1. Copy production URL (biasanya `xxx.vercel.app`)
2. Buka di browser
3. Test semua features:
   - NFT generation
   - Check-in system
   - Notifications (tunggu CRON schedule)
   - Wallet connection
   - Minting

### Test CRON Manually
Kalau mau test CRON tanpa tunggu schedule:

**⚠️ Jangan expose CRON_SECRET di production!**

Cara aman:
1. Buat test endpoint: `/api/test-cron`
2. Call dari endpoint itu ke CRON logic
3. Atau tunggu scheduled time

---

## 🎉 Checklist Final

Sebelum launch, pastikan:

- [ ] ✅ Semua environment variables sudah diset
- [ ] ✅ Production build berhasil (hijau di Deployments)
- [ ] ✅ CRON jobs terdaftar di Settings → Cron Jobs
- [ ] ✅ CRON_SECRET sudah diset dan aman
- [ ] ✅ Test app di production URL
- [ ] ✅ Supabase tables sudah ada dan correct
- [ ] ✅ Smart contracts deployed di Base
- [ ] ✅ Farcaster app FID sudah benar
- [ ] ✅ Notifications working (test dengan user)

---

## 🔗 Links Penting

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs:** https://vercel.com/docs
- **CRON Documentation:** https://vercel.com/docs/cron-jobs
- **Next.js on Vercel:** https://vercel.com/docs/frameworks/nextjs

---

## 💬 Butuh Bantuan?

**Kalau ada error:**
1. Screenshot error message
2. Screenshot Vercel build logs
3. Share environment variables (JANGAN share values-nya!)
4. Tanya lagi ke aku!

**Common Errors:**
- **"Module not found"** → Missing dependency, run `npm install`
- **"Environment variable undefined"** → Check Settings → Environment Variables
- **"Function execution timed out"** → Optimize code atau upgrade plan
- **"CORS error"** → Add proper headers di API routes

---

## 🚀 Siap Deploy!

Kamu tinggal:
1. Sign up di Vercel dengan GitHub
2. Import project
3. Tambahkan environment variables
4. Klik Deploy
5. Tunggu 5 menit
6. App kamu live! 🎉

**Kalau ada pertanyaan atau stuck di step manapun, tanya aja! Aku siap bantu! 💪**

---

*Last updated: Panduan untuk FrameFusion Genesis v1.0*
