# ✅ Deployment Checklist - FrameFusion Genesis

## 📋 Sebelum Deploy

### Persiapan Code
- [ ] Code sudah di push ke GitHub
- [ ] Semua file penting sudah di commit
- [ ] `vercel.json` ada di root directory
- [ ] `package.json` dependencies lengkap
- [ ] No TypeScript errors (`npm run build` berhasil lokal)

### Persiapan Data
- [ ] Supabase project sudah setup
- [ ] Tables sudah dibuat (users, checkins, notifications, etc.)
- [ ] Smart contracts sudah deployed ke Base
- [ ] NFT contract address tersimpan
- [ ] Rewards contract address tersimpan
- [ ] Farcaster app sudah registered
- [ ] Farcaster FID sudah dapat

### Persiapan Keys & Secrets
Kumpulkan semua ini dalam file text aman:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `LIGHTHOUSE_API_KEY`
- [ ] `PINATA_JWT`
- [ ] `FARCASTER_APP_PRIVATE_KEY`
- [ ] `FARCASTER_APP_FID`
- [ ] `PRIVATE_KEY_HEX` (untuk wallet transactions)
- [ ] `CRON_SECRET` (generate baru kalau belum ada)
- [ ] `NEXT_PUBLIC_BASE_RPC_URL`

---

## 🚀 Proses Deploy

### Step 1: Vercel Sign Up
- [ ] Buka vercel.com
- [ ] Klik "Sign Up"
- [ ] Pilih "Continue with GitHub"
- [ ] Authorize Vercel untuk access GitHub
- [ ] Confirm email (jika diminta)

### Step 2: Import Project
- [ ] Di Vercel Dashboard, klik "Add New..." → "Project"
- [ ] Pilih "Import Git Repository"
- [ ] Cari repository "FrameFusion Genesis"
- [ ] Klik "Import"

### Step 3: Configure Build Settings
Vercel biasanya auto-detect, tapi pastikan:

- [ ] **Framework Preset:** Next.js
- [ ] **Root Directory:** ./
- [ ] **Build Command:** `npm run build`
- [ ] **Output Directory:** `.next`
- [ ] **Install Command:** `npm install`

### Step 4: Add Environment Variables
Tambahkan SATU PER SATU (copy dari file text kamu):

#### Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL` → Production ✓ Preview ✓ Development ✓
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Production ✓ Preview ✓ Development ✓

#### Storage
- [ ] `LIGHTHOUSE_API_KEY` → Production ✓ Preview ✓ Development ✓
- [ ] `PINATA_JWT` → Production ✓ Preview ✓ Development ✓

#### Farcaster
- [ ] `FARCASTER_APP_PRIVATE_KEY` → Production ✓ Preview ✓ Development ✓
- [ ] `FARCASTER_APP_FID` → Production ✓ Preview ✓ Development ✓

#### Blockchain
- [ ] `PRIVATE_KEY_HEX` → Production ✓ Preview ✓ Development ✓
- [ ] `NEXT_PUBLIC_BASE_RPC_URL` → Production ✓ Preview ✓ Development ✓

#### Security
- [ ] `CRON_SECRET` → Production ✓ (only Production!)

### Step 5: Deploy!
- [ ] Klik tombol "Deploy"
- [ ] Tunggu build process (2-5 menit)
- [ ] Lihat build logs jika ada error
- [ ] Tunggu sampai muncul "Congratulations!" 🎉

---

## 🔍 Post-Deploy Verification

### Verifikasi Deployment
- [ ] Status deployment = hijau (success)
- [ ] Production URL dapat diakses
- [ ] Tidak ada build errors di logs
- [ ] Tidak ada runtime errors di logs (cek Vercel → Logs)

### Verifikasi CRON Jobs
- [ ] Buka Settings → Cron Jobs
- [ ] Ada 2 CRON jobs terdaftar:
  - [ ] `/api/cron/daily-reminder` - Schedule: `0 9 * * *`
  - [ ] `/api/cron/engagement-reminder` - Schedule: `0 10 * * *`

### Verifikasi Environment Variables
- [ ] Buka Settings → Environment Variables
- [ ] Semua 9 variables ada dan ter-set
- [ ] Production environment ter-centang untuk semua

---

## 🧪 Testing Production App

### Basic Functionality
- [ ] Buka production URL (https://your-app.vercel.app)
- [ ] App loads tanpa error
- [ ] Homepage tampil dengan benar
- [ ] No console errors di browser

### Farcaster Integration
- [ ] Open app dalam Farcaster
- [ ] Quick Auth works
- [ ] User FID detected
- [ ] Manifest signer active

### NFT Features
- [ ] Generate NFT button works
- [ ] AI image generation successful
- [ ] Metadata correct
- [ ] Minting process works (if testing)

### Check-in System
- [ ] NFT ownership detected correctly
- [ ] Check-in button available (if eligible)
- [ ] Daily limit enforced (300 claims)
- [ ] Check-in recorded in database

### Database Connection
- [ ] Data saved ke Supabase
- [ ] Queries berhasil
- [ ] No connection errors
- [ ] Tables accessible

### Blockchain Interaction
- [ ] Smart contract calls work
- [ ] Wallet connection works
- [ ] Transaction signing works
- [ ] Base network RPC responding

### Notifications
- [ ] User can opt-in to notifications
- [ ] Token saved to database
- [ ] No errors when saving token

---

## ⏰ CRON Jobs Testing

### Wait for Scheduled Time
Karena CRON hanya jalan pada scheduled time:

**Daily Reminder (09:00 UTC = 16:00 WIB):**
- [ ] Tunggu sampai jam 16:00 WIB
- [ ] Check Vercel Logs → Filter: `/api/cron/daily-reminder`
- [ ] Verify execution successful (Status 200)
- [ ] Check berapa notifications terkirim

**Engagement Reminder (10:00 UTC = 17:00 WIB):**
- [ ] Tunggu sampai jam 17:00 WIB
- [ ] Check Vercel Logs → Filter: `/api/cron/engagement-reminder`
- [ ] Verify execution successful (Status 200)
- [ ] Check berapa users di-notify

### Alternative: Manual Test (Optional)
Jika tidak mau tunggu:
- [ ] Buat test user dengan opt-in notification
- [ ] Tunggu CRON schedule berikutnya
- [ ] Atau test logic manually di development

---

## 📊 Monitoring Setup

### Day 1 Monitoring
- [ ] Check Vercel Logs setiap 2-3 jam
- [ ] Monitor untuk errors atau warnings
- [ ] Verify CRON jobs executed
- [ ] Check user activity in Supabase

### Week 1 Monitoring
- [ ] Daily check of deployment status
- [ ] Review error logs
- [ ] Monitor CRON execution success rate
- [ ] Check notification delivery rate
- [ ] Monitor database performance

### Ongoing Monitoring
- [ ] Setup Vercel alerts (jika ada)
- [ ] Weekly review of logs
- [ ] Monthly performance review
- [ ] Check for timeout issues
- [ ] Monitor bandwidth usage

---

## 🐛 Troubleshooting Checklist

### Jika Build Failed
- [ ] Read build logs lengkap
- [ ] Note specific error message
- [ ] Check TypeScript errors
- [ ] Verify all dependencies installed
- [ ] Fix error locally
- [ ] Test `npm run build` locally
- [ ] Push fix ke GitHub
- [ ] Vercel auto redeploy

### Jika CRON Tidak Jalan
- [ ] Verify `vercel.json` exists in root
- [ ] Check CRON Jobs di Settings
- [ ] Verify CRON_SECRET is set
- [ ] Check CRON endpoint logs
- [ ] Redeploy project
- [ ] Wait for next scheduled time
- [ ] Check authorization headers

### Jika Environment Variables Tidak Work
- [ ] Double check variable names (exact match!)
- [ ] Verify values are correct (no extra spaces)
- [ ] Ensure Production is checked
- [ ] Redeploy after adding variables
- [ ] Check logs for "undefined" errors
- [ ] Restart all functions

### Jika Database Connection Failed
- [ ] Verify Supabase URL is correct
- [ ] Check anon key is valid
- [ ] Test connection from Supabase dashboard
- [ ] Check connection pool limits
- [ ] Verify tables exist
- [ ] Check RLS policies

### Jika Notifications Tidak Terkirim
- [ ] Verify Farcaster app private key
- [ ] Check FID is correct
- [ ] Verify notification tokens in database
- [ ] Test notification endpoint manually
- [ ] Check Farcaster API status
- [ ] Verify authorization

---

## 📝 Documentation

### Update Documentation
- [ ] Save production URL
- [ ] Document any issues encountered
- [ ] Note any configuration changes
- [ ] Save all environment variable names (not values!)
- [ ] Document testing results

### Share with Team (if applicable)
- [ ] Share production URL
- [ ] Share deployment notes
- [ ] Document known issues
- [ ] Create user guide if needed

---

## 🎉 Launch Checklist

### Pre-Launch
- [ ] All features tested and working
- [ ] No critical bugs
- [ ] CRON jobs verified working
- [ ] Database properly seeded
- [ ] Smart contracts funded (if needed)
- [ ] Documentation complete

### Launch Day
- [ ] Announce to users
- [ ] Monitor logs closely
- [ ] Be ready for hotfixes
- [ ] Monitor user feedback
- [ ] Track key metrics

### Post-Launch
- [ ] Gather user feedback
- [ ] Fix any reported issues
- [ ] Monitor performance
- [ ] Plan improvements
- [ ] Celebrate success! 🎊

---

## 🔄 Maintenance Checklist

### Weekly
- [ ] Review Vercel logs for errors
- [ ] Check CRON execution logs
- [ ] Monitor database size
- [ ] Review notification delivery rate
- [ ] Check for any failed deployments

### Monthly
- [ ] Review analytics
- [ ] Check bandwidth usage
- [ ] Optimize slow queries
- [ ] Update dependencies (if needed)
- [ ] Review and clean old logs

### Quarterly
- [ ] Performance audit
- [ ] Security review
- [ ] Feature usage analysis
- [ ] Plan new features
- [ ] Consider scaling needs

---

## 🆘 Emergency Contacts

### If Critical Issue
Document siapa yang harus dihubungi:

- **You:** [Your contact]
- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/support
- **Farcaster Support:** Discord/GitHub

### Backup Plans
- [ ] Manual notification sending procedure documented
- [ ] Database backup process setup
- [ ] Rollback procedure documented
- [ ] Emergency contact list ready

---

## ✨ Success!

Jika semua checklist di atas ✅, congratulations! 

**App kamu sudah:**
- ✅ Deployed ke production
- ✅ Accessible globally
- ✅ CRON jobs running automatically
- ✅ Notifications active
- ✅ Monitored and maintained

**Siap untuk users! 🚀**

---

*Print checklist ini atau save di tempat yang mudah diakses!*
*Update status setiap item sambil deploy.*
