# FrameShadows Monster Backfill Guide

## Problem: NFT Minted But Not Showing in App

If you successfully minted a monster NFT (paid 0.0001 ETH) but it's not appearing in the app or only shows as "FrameShadows #[tokenId]" without proper metadata, this means the database save failed during minting.

**Don't worry!** Your NFT exists on-chain. We just need to sync it to the database.

---

## Solution: Backfill the Monster

### Method 1: Manual Backfill via UI (Easiest) ⭐

**For Owner (FID 235940) Only:**

1. **Get Token ID from Transaction**
   - Open your transaction on [Basescan](https://basescan.org/address/0xB2df433b8d15fF25C6157c193C8a11817AfA788E)
   - Find your mint transaction
   - Look for the `MonsterMinted` event
   - Copy the `monsterId` value (e.g., `1738926543`)

2. **Use Backfill Tool in App**
   - Open the app in Warpcast
   - Go to "Monsters" tab
   - Scroll to "Mint Monster NFT" section
   - Find the backfill input at the bottom:
     - "🔧 Already minted but not showing? Backfill by Token ID:"
   - Enter your token ID
   - Click "Sync" button

3. **Wait for Sync**
   - The app will:
     - ✅ Check if monster already exists (skip if yes)
     - ✅ Generate monster stats based on token ID
     - ✅ Save to database with placeholder image
     - ✅ Trigger FluxPro anime artwork generation
   - You'll see: "✅ Monster backfilled successfully"
   - Page will auto-reload after 2 seconds

4. **Done!**
   - Your monster now appears in the app
   - Anime artwork generates in background (60s)
   - Metadata updates automatically

---

### Method 2: API Call (Advanced)

**Direct API endpoint:** `POST /api/monsters/backfill`

**Request Body:**
```json
{
  "tokenId": "1738926543",
  "ownerAddress": "0x..." // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Monster backfilled successfully",
  "monster": {
    "id": "monster-1738926543-...",
    "monster_id": 1738926543,
    "name": "FrameShadows #1738926543",
    "monster_type": "Shadow Reaper",
    "element": "Dark",
    "rarity": "Rare",
    "level": 3,
    "power_level": 342,
    ...
  }
}
```

**Example with cURL:**
```bash
curl -X POST https://your-app.com/api/monsters/backfill \
  -H "Content-Type: application/json" \
  -d '{"tokenId": "1738926543"}'
```

---

## How Token ID is Generated

Token IDs are generated using this formula:
```
tokenId = Math.floor(Date.now() / 1000) + userFid + randomNumber(0-999)
```

Example:
- Timestamp: `1738926000`
- User FID: `235940`
- Random: `543`
- Result: `1739161483`

This ensures each token ID is unique and traceable.

---

## What the Backfill Does

1. **Checks Database**
   - Verifies if monster already exists
   - Skips if already backfilled

2. **Generates Stats**
   - Uses token ID as seed for deterministic generation
   - Same token ID = same monster stats every time
   - Includes: type, element, rarity, level, power

3. **Saves to Database**
   - Creates monster record with placeholder image
   - Sets metadata URI to API endpoint
   - Marks as minted and wild

4. **Triggers Image Generation**
   - Starts FluxPro anime artwork generation
   - Takes ~60 seconds
   - Updates database automatically when complete

5. **Updates Metadata**
   - Off-chain metadata automatically reflects new data
   - OpenSea/wallets will show updated info on refresh
   - No blockchain transaction needed!

---

## Common Errors & Solutions

### Error: "Monster already exists in database"
**Meaning:** Monster was already backfilled or saved successfully.

**Solution:** 
- Check "My Monsters" section in app
- Refresh OpenSea metadata if not showing

### Error: "Failed to save monster to database"
**Meaning:** Database permission or configuration issue.

**Solutions:**
1. Check Supabase service role key is configured
2. Verify RLS policies allow inserts
3. Check database schema matches expected format
4. See `MONSTER_DATABASE_FIX.md` for detailed troubleshooting

### Error: "Token ID required"
**Meaning:** No token ID was provided.

**Solution:** Enter a valid numeric token ID from your mint transaction.

---

## Finding Your Token ID

### From Basescan:

1. Go to [FrameShadows Contract on Basescan](https://basescan.org/address/0xB2df433b8d15fF25C6157c193C8a11817AfA788E)
2. Click "Events" tab
3. Find your mint transaction timestamp
4. Look for `MonsterMinted` event
5. The `monsterId` parameter is your token ID

### From Wallet:

Some wallets display the token ID directly in NFT details. Check your wallet's NFT section.

### From Transaction Receipt:

If you have the transaction hash:
1. Open transaction on Basescan
2. Click "Logs" tab
3. Find `MonsterMinted` event
4. Decode parameters to get `monsterId`

---

## Prevention: Why Did This Happen?

Database save can fail due to:
- ⚠️ Supabase service role key not configured
- ⚠️ RLS policies blocking inserts
- ⚠️ Network timeout during save
- ⚠️ Database schema mismatch
- ⚠️ Supabase maintenance/downtime

**Good News:** 
- Your NFT is safe on-chain! ✅
- Payment (0.0001 ETH) went to contract ✅
- Backfill recovers all monster data ✅
- No additional payment needed ✅

---

## Support

If backfill still doesn't work:
1. Check browser console for detailed errors
2. Verify contract address: `0xB2df433b8d15fF25C6157c193C8a11817AfA788E`
3. Confirm you're on Base network
4. Try again in a few minutes (may be temporary network issue)
5. Contact support with token ID and error message

---

## Technical Details

**Contract:** `0xB2df433b8d15fF25C6157c193C8a11817AfA788E`

**Backfill API:** `/api/monsters/backfill`

**Metadata API:** `/api/monsters/metadata/[tokenId]`

**Image Generation:** FluxPro with anime style prompts

**Storage:** Supabase (database) + IPFS/Lighthouse (images)

**Metadata Type:** Off-chain (dynamic, no blockchain updates needed)

---

## Success Indicators

After successful backfill:
- ✅ Monster appears in "My Monsters" section
- ✅ Metadata shows proper name, type, element, rarity
- ✅ Placeholder image displays immediately
- ✅ Anime artwork generates within 60 seconds
- ✅ OpenSea shows full metadata on refresh
- ✅ Wallet displays NFT with proper attributes

Enjoy your FrameShadows monster! 👾🎉
