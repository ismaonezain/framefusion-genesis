# ⚡ Quick Start - Deploy ke Vercel dalam 10 Menit

## 🎯 Ringkasan Super Cepat

### Step 1: Sign Up (2 menit)
```
1. Buka vercel.com
2. Klik "Sign Up" → "Continue with GitHub"
3. Authorize Vercel
```

### Step 2: Deploy (3 menit)
```
1. Klik "Add New..." → "Project"
2. Pilih repository GitHub kamu
3. Klik "Import"
```

### Step 3: Environment Variables (5 menit)
Tambahkan satu per satu di Vercel:

```bash
# Copy-paste ini satu per satu ke Vercel Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_value_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value_here
LIGHTHOUSE_API_KEY=your_value_here
PINATA_JWT=your_value_here
FARCASTER_APP_PRIVATE_KEY=your_value_here
FARCASTER_APP_FID=your_value_here
PRIVATE_KEY_HEX=your_value_here
CRON_SECRET=your_value_here
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
```

**💡 Tips:** Centang ketiga environment (Production, Preview, Development)

### Step 4: Deploy! (2-5 menit)
```
1. Klik "Deploy"
2. Tunggu build selesai
3. Done! 🎉
```

---

## 🔄 Update App (Auto Deploy)

Setiap kali push ke GitHub, Vercel otomatis deploy:

```bash
# Edit code kamu
# Lalu:
git add .
git commit -m "your message"
git push origin main
```

Tunggu 2-5 menit, app updated! ✨

---

## 🔐 Generate CRON_SECRET

Jalankan di terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy hasil-nya, paste ke environment variable `CRON_SECRET`

---

## 📊 Monitoring

### Cek Logs
```
Vercel Dashboard → Project → Logs
```

### Cek CRON Jobs
```
Vercel Dashboard → Project → Settings → Cron Jobs
```

### Cek Deployments
```
Vercel Dashboard → Project → Deployments
```

---

## 🛠️ Quick Fixes

### Build Failed?
```
1. Buka deployment yang failed
2. Klik "View Build Logs"
3. Fix error yang ditampilkan
4. Push lagi ke GitHub
```

### CRON Tidak Jalan?
```
1. Cek file vercel.json ada di root
2. Cek CRON_SECRET sudah diset
3. Redeploy
```

### Environment Variable Tidak Work?
```
1. Settings → Environment Variables
2. Centang Production
3. Redeploy (Deployments → ⋮ → Redeploy)
```

---

## 📱 Production URL

Setelah deploy, app kamu ada di:
```
https://your-project-name.vercel.app
```

---

## ✅ Checklist

- [ ] Sign up Vercel dengan GitHub
- [ ] Import project dari GitHub
- [ ] Tambahkan semua environment variables
- [ ] Deploy berhasil (status hijau)
- [ ] Test app di production URL
- [ ] CRON jobs terdaftar

---

**Baca panduan lengkap di `PANDUAN_VERCEL.md` untuk detail lebih lanjut!**
