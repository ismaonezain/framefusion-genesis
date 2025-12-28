# 🤖 Automated Notifications Setup Guide

This guide explains how to set up automated notifications for FrameFusion Genesis app.

## 📋 Overview

The app has 2 automated notification types:

1. **Daily Check-in Reminder** - Sent every day at 9:00 AM UTC
   - Reminds all users to check in and claim 50k TRIA
   - Prevents streak loss
   - Notification ID: `daily-reminder-YYYY-MM-DD`

2. **Engagement Reminder** - Sent every day at 10:00 AM UTC
   - Targets users inactive for 3+ days
   - Re-engages users who haven't checked in
   - Notification ID: `engagement-reminder-YYYY-MM-DD`

---

## 🚀 Setup Methods

### Option 1: Vercel Cron Jobs (Recommended)

**Requirements:**
- Vercel Pro plan (includes cron jobs)
- App deployed on Vercel

**Setup Steps:**

1. **Add Environment Variable** in Vercel Dashboard:
   ```
   CRON_SECRET=your-random-secret-key-here
   ```
   Generate a strong secret key (e.g., use `openssl rand -hex 32`)

2. **Deploy with vercel.json**
   - File `vercel.json` is already configured
   - Contains cron schedules:
     - Daily reminder: `0 9 * * *` (9 AM UTC daily)
     - Engagement reminder: `0 10 * * *` (10 AM UTC daily)

3. **Verify in Vercel Dashboard**
   - Go to Project → Settings → Cron Jobs
   - You should see 2 cron jobs listed
   - Check execution logs after schedule time

**Advantages:**
- ✅ Native Vercel integration
- ✅ Automatic execution
- ✅ Built-in monitoring and logs
- ✅ No external dependencies

**Disadvantages:**
- ❌ Requires Vercel Pro plan ($20/month)

---

### Option 2: External Cron Service (Free Alternative)

**Requirements:**
- Free cron service account (cron-job.org, EasyCron, etc.)
- Publicly accessible app URL

**Setup Steps:**

1. **Add CRON_SECRET Environment Variable**
   ```
   CRON_SECRET=your-random-secret-key-here
   ```
   Add this in Vercel → Project → Settings → Environment Variables

2. **Create Cron Jobs** on External Service:

   **Example using cron-job.org:**
   
   a. Sign up at https://cron-job.org (free tier: 50 jobs)
   
   b. Create Job #1 - Daily Reminder:
   - **Title**: FrameFusion Daily Reminder
   - **URL**: `https://your-app.vercel.app/api/cron/daily-reminder`
   - **Schedule**: Every day at 09:00 (UTC)
   - **Request Method**: GET
   - **Custom Headers**: Add authorization header:
     ```
     Authorization: Bearer your-random-secret-key-here
     ```
   
   c. Create Job #2 - Engagement Reminder:
   - **Title**: FrameFusion Engagement Reminder
   - **URL**: `https://your-app.vercel.app/api/cron/engagement-reminder`
   - **Schedule**: Every day at 10:00 (UTC)
   - **Request Method**: GET
   - **Custom Headers**: Add authorization header:
     ```
     Authorization: Bearer your-random-secret-key-here
     ```

3. **Test Endpoints Manually**
   ```bash
   # Test daily reminder
   curl -X GET https://your-app.vercel.app/api/cron/daily-reminder \
     -H "Authorization: Bearer your-secret-key"
   
   # Test engagement reminder
   curl -X GET https://your-app.vercel.app/api/cron/engagement-reminder \
     -H "Authorization: Bearer your-secret-key"
   ```

**Advantages:**
- ✅ Free (no Vercel Pro needed)
- ✅ Easy setup
- ✅ Web-based monitoring
- ✅ Email notifications on failures

**Disadvantages:**
- ❌ Requires external service account
- ❌ Less integrated with Vercel ecosystem

---

### Option 3: GitHub Actions (Free Alternative)

**Requirements:**
- GitHub repository
- GitHub account (free tier is sufficient)

**Setup Steps:**

1. **Add Secret to GitHub Repository**
   - Go to Repository → Settings → Secrets and variables → Actions
   - Add secret: `CRON_SECRET` with your secret key

2. **Create Workflow Files**

   Create `.github/workflows/daily-reminder.yml`:
   ```yaml
   name: Daily Reminder Notification
   
   on:
     schedule:
       - cron: '0 9 * * *'  # 9 AM UTC daily
     workflow_dispatch:  # Allow manual trigger
   
   jobs:
     send-notification:
       runs-on: ubuntu-latest
       steps:
         - name: Send Daily Reminder
           run: |
             curl -X GET https://your-app.vercel.app/api/cron/daily-reminder \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
   ```

   Create `.github/workflows/engagement-reminder.yml`:
   ```yaml
   name: Engagement Reminder Notification
   
   on:
     schedule:
       - cron: '0 10 * * *'  # 10 AM UTC daily
     workflow_dispatch:  # Allow manual trigger
   
   jobs:
     send-notification:
       runs-on: ubuntu-latest
       steps:
         - name: Send Engagement Reminder
           run: |
             curl -X GET https://your-app.vercel.app/api/cron/engagement-reminder \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
   ```

3. **Enable GitHub Actions**
   - Go to Repository → Actions
   - Enable workflows if prompted

**Advantages:**
- ✅ Free (GitHub Actions free tier: 2000 minutes/month)
- ✅ Version controlled (workflows in Git)
- ✅ Manual trigger option
- ✅ No external service needed

**Disadvantages:**
- ❌ Requires GitHub repository
- ❌ Slightly more complex setup

---

## 🔒 Security

**CRON_SECRET Protection:**
- All cron endpoints require `Authorization: Bearer <CRON_SECRET>` header
- Prevents unauthorized execution
- Returns 401 Unauthorized if secret is invalid

**Generate Strong Secret:**
```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 📊 Monitoring

### Check Cron Execution:

**Vercel Dashboard:**
- Project → Deployments → Functions
- Filter by `/api/cron/*`
- View execution logs and errors

**Admin Panel:**
- Login as owner (FID 235940)
- Go to Admin → Notifications tab
- View "Recent Notifications" section
- Check for automated sends (sent_by: "automated")

**Manual Test:**
```bash
# Test with your secret
curl -X GET https://your-app.vercel.app/api/cron/daily-reminder \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -v
```

### Expected Response:
```json
{
  "success": true,
  "message": "Daily reminder sent",
  "stats": {
    "total": 150,
    "successful": 145,
    "failed": 3,
    "rateLimited": 2
  }
}
```

---

## ⏰ Schedule Customization

**Modify Schedule Times:**

Edit `vercel.json` cron schedule (uses cron syntax):

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reminder",
      "schedule": "0 14 * * *"  // Change to 2 PM UTC (9 PM WIB)
    }
  ]
}
```

**Cron Syntax Reference:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Examples:**
- `0 9 * * *` - Every day at 9 AM UTC
- `0 14 * * *` - Every day at 2 PM UTC (9 PM WIB)
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - Every weekday at 9 AM UTC

---

## 🧪 Testing

**Test Endpoints Locally:**

1. Start dev server: `npm run dev`
2. Test endpoint with secret:
   ```bash
   curl -X GET http://localhost:3000/api/cron/daily-reminder \
     -H "Authorization: Bearer your-secret-key"
   ```

**Test in Production:**
```bash
# Daily reminder
curl -X GET https://your-app.vercel.app/api/cron/daily-reminder \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Engagement reminder
curl -X GET https://your-app.vercel.app/api/cron/engagement-reminder \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📝 Notification Deduplication

Each notification uses a unique ID with date:
- `daily-reminder-2025-11-27`
- `engagement-reminder-2025-11-27`

**Prevents:**
- ✅ Duplicate notifications if cron runs twice
- ✅ Spam from multiple triggers
- ✅ Manual send conflicts

**24-Hour Window:**
- Same notification ID won't send twice in 24 hours
- Resets automatically next day with new date

---

## 🐛 Troubleshooting

**Problem: Notifications not sending**
- Check CRON_SECRET is set correctly
- Verify Supabase credentials
- Check notification_tokens table has active tokens
- View Vercel function logs for errors

**Problem: Unauthorized (401) error**
- Verify CRON_SECRET matches between env and cron service
- Check Authorization header format: `Bearer <secret>`

**Problem: No users to notify**
- Users must enable notifications first
- Check notification_tokens table has is_active = true
- Verify users added app via addMiniApp()

**Problem: Rate limited**
- Farcaster enforces: 1 per 30s, 100 per day per user
- Reduce notification frequency
- Space out different notification types

---

## 📚 Additional Resources

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Cron Expression Reference](https://crontab.guru/)
- [Farcaster Notifications Documentation](https://docs.farcaster.xyz/developers/guides/mini-apps/notifications)

---

## ✅ Checklist

Before going live:

- [ ] Add CRON_SECRET environment variable
- [ ] Choose and configure cron method (Vercel/External/GitHub)
- [ ] Test endpoints manually
- [ ] Verify notification tokens exist in database
- [ ] Monitor first scheduled execution
- [ ] Check admin panel for automated logs
- [ ] Adjust schedule if needed based on user timezone

---

**Need help?** Check Vercel function logs or test endpoints manually with curl.
