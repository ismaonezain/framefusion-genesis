# 🔄 Vercel Workflow - Visual Guide

## 📊 Diagram Alur Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB REPOSITORY                         │
│                  (FrameFusion Genesis)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ git push
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL PLATFORM                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   DETECT     │→ │    BUILD     │→ │    DEPLOY    │     │
│  │  Git Change  │  │  Next.js App │  │   to CDN     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Deploy URL
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 PRODUCTION APP LIVE                          │
│            https://your-app.vercel.app                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Web    │  │   API    │  │  CRON    │  │Database  │  │
│  │   App    │  │  Routes  │  │  Jobs    │  │(Supabase)│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏰ CRON Jobs Schedule

```
UTC Time                     Action
───────────────────────────────────────────────────
09:00 AM (Every Day)  →  Daily Reminder
                           • Send notifications
                           • Remind users to check-in
                           • Earn $TRIA

10:00 AM (Every Day)  →  Engagement Reminder
                           • Find inactive users (3+ days)
                           • Send re-engagement notifications
                           • Bring users back
```

**Konversi ke WIB (Waktu Indonesia Barat):**
- 09:00 UTC = 16:00 WIB (4 sore)
- 10:00 UTC = 17:00 WIB (5 sore)

---

## 🔐 Security Flow

```
User Request
     │
     ▼
┌─────────────────┐
│  Vercel Edge    │ → Check Headers
│    Network      │ → Rate Limiting
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Route     │ → Validate CRON_SECRET
│  (CRON Jobs)    │ → Check Authorization
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Send Farcaster │ → Use FARCASTER_APP_PRIVATE_KEY
│  Notifications  │ → Secure token handling
└─────────────────┘
```

---

## 🗄️ Data Flow

```
User Action
     │
     ▼
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Routes    │ → /api/checkin
│  (Backend)      │ → /api/claim
└────────┬────────┘ → /api/notifications
         │
         ▼
┌─────────────────┐
│   Supabase DB   │ → users
│   (Database)    │ → checkins
└─────────────────┘ → notifications
         │
         ▼
┌─────────────────┐
│   Blockchain    │ → Base Network
│  (Smart Contract)│ → NFT Contract
└─────────────────┘ → Rewards Contract
```

---

## 📦 Environment Variables Map

```
┌────────────────────────────────────────────────────────┐
│                    VERCEL SETTINGS                     │
│                  Environment Variables                 │
└────────────────┬───────────────────────────────────────┘
                 │
        ┌────────┼────────┐
        │        │        │
        ▼        ▼        ▼
   Production Preview Development
        │        │        │
        └────────┼────────┘
                 │
        ┌────────┴────────────────────┐
        │                             │
        ▼                             ▼
   Runtime Values              Build Time Values
   • Database URLs             • Public URLs
   • API Keys                  • Feature Flags
   • Private Keys              • Config
```

---

## 🔄 Update Workflow

### Auto Deploy (Recommended)
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Edit Code   │ →   │   git push   │ →   │Vercel Deploy │
│   Locally    │     │  to GitHub   │     │ Automatically│
└──────────────┘     └──────────────┘     └──────────────┘
                                                   │
                                                   ▼
                                          ┌──────────────┐
                                          │  App Updated │
                                          │  in 2-5 min  │
                                          └──────────────┘
```

### Manual Redeploy
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│Update Env Var│ →   │   Vercel     │ →   │   Redeploy   │
│  in Vercel   │     │  Dashboard   │     │    Button    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                   │
                                                   ▼
                                          ┌──────────────┐
                                          │New Env Active│
                                          │  in 2-5 min  │
                                          └──────────────┘
```

---

## 🐛 Debugging Flow

```
Issue Reported
     │
     ▼
┌─────────────────┐
│ Check Vercel    │ → View recent deployments
│   Dashboard     │ → Look for failed builds
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  View Build     │ → Read error messages
│     Logs        │ → Identify issue
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Fix Code      │ → Update locally
│   or Config     │ → Test if possible
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Push to        │ → Auto redeploy
│   GitHub        │ → Monitor logs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verify Fix     │ → Test production
│  in Production  │ → Monitor CRON jobs
└─────────────────┘
```

---

## 📱 User Journey

```
User Opens App
     │
     ▼
┌─────────────────┐
│  Farcaster      │ → Check if in Farcaster
│  Integration    │ → Load SDK
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Quick Auth     │ → Authenticate user
│  Login          │ → Get FID
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Check NFT      │ → Query blockchain
│  Ownership      │ → Verify eligibility
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Daily Check-in │ → Record in database
│  & Claim $TRIA  │ → Call smart contract
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Notification   │ → Request token from user
│  Opt-in         │ → Store in database
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  CRON sends     │ → Automated daily
│  Daily Reminder │ → via Farcaster API
└─────────────────┘
```

---

## 🎯 Monitoring Points

### Key Metrics to Watch

**1. Deployment Success Rate**
```
Vercel → Deployments → Look for green checkmarks
Target: 100% success rate
```

**2. CRON Job Execution**
```
Vercel → Logs → Filter by /api/cron/
Target: Daily execution at scheduled times
```

**3. API Response Times**
```
Vercel → Analytics → Function Performance
Target: < 2 seconds for most endpoints
```

**4. Error Rate**
```
Vercel → Logs → Filter by "Error"
Target: < 1% error rate
```

**5. Database Queries**
```
Supabase → Logs → Query performance
Target: < 500ms per query
```

---

## 🚨 Common Issues & Quick Fixes

```
Issue                          Quick Fix
────────────────────────────────────────────────────────
Build Failed                → Check build logs
                             → Fix TypeScript errors
                             → Verify dependencies

CRON not running           → Check vercel.json
                             → Verify CRON_SECRET
                             → Redeploy

Env vars not working       → Redeploy after adding
                             → Check environment selection
                             → Verify variable names

Function timeout           → Optimize code
                             → Reduce external calls
                             → Consider upgrade plan

CORS errors                → Add headers in route.ts
                             → Check API configuration

Database connection        → Verify Supabase URL
failed                      → Check connection limits
                             → Test credentials
```

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ Build completes without errors
✅ Production URL is accessible
✅ All API endpoints respond correctly
✅ CRON jobs appear in Settings → Cron Jobs
✅ Environment variables are set
✅ Database connections work
✅ Notifications can be sent
✅ Smart contract interactions work

---

## 📚 Next Steps After Deploy

1. **Test thoroughly** - Check all features work
2. **Monitor logs** - Watch for errors first 24 hours
3. **Verify CRON** - Wait for first scheduled run
4. **Set up alerts** - Use Vercel integrations
5. **Document issues** - Keep track of any problems
6. **Plan updates** - Use git workflow for changes

---

**Baca panduan lengkap: `PANDUAN_VERCEL.md`**
**Quick start: `QUICK_START_VERCEL.md`**
