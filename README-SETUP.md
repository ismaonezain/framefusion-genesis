# FidArt NFT Collection - Setup Guide

## 🎨 Tentang Aplikasi

FidArt adalah koleksi NFT eksklusif yang menggenerate gambar unik berdasarkan Farcaster ID (FID) setiap pengguna. Setiap FID hanya bisa mint 1 NFT dengan max supply 3000.

## 📋 Prerequisites

1. Akun Supabase (gratis di https://supabase.com)
2. Farcaster account untuk testing

## 🚀 Setup Supabase

### 1. Buat Project Baru di Supabase

- Login ke https://supabase.com
- Klik "New Project"
- Isi nama project dan password database
- Pilih region terdekat
- Tunggu project selesai dibuat

### 2. Buat Tabel `nfts`

Di Supabase SQL Editor, jalankan query ini:

```sql
CREATE TABLE nfts (
  id TEXT PRIMARY KEY,
  fid INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  ipfs_uri TEXT NOT NULL,
  ipfs_gateway TEXT NOT NULL,
  metadata_uri TEXT NOT NULL,
  token_id TEXT,
  contract_address TEXT,
  minted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk query cepat
CREATE INDEX idx_nfts_fid ON nfts(fid);
CREATE INDEX idx_nfts_created_at ON nfts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;

-- Policy untuk read public
CREATE POLICY "Enable read access for all users" ON nfts
  FOR SELECT USING (true);

-- Policy untuk insert (bisa disesuaikan dengan kebutuhan)
CREATE POLICY "Enable insert for all users" ON nfts
  FOR INSERT WITH CHECK (true);
```

### 3. Ambil Credentials

Di Project Settings > API:
- Ambil `Project URL` (contoh: https://xxxxx.supabase.co)
- Ambil `anon` / `public` key

### 4. Update File `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-project.supabase.co'; // Ganti dengan URL project Anda
const SUPABASE_KEY = 'your-anon-key-here'; // Ganti dengan anon key Anda

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

## 🎯 Fitur Aplikasi

### Generator NFT
- Menggunakan Flux Pro AI untuk generate gambar unik
- Setiap FID menghasilkan gambar berbeda (seed-based)
- Upload otomatis ke IPFS via Pinata
- Metadata NFT-ready disimpan di IPFS

### Database Supabase
- Menyimpan record setiap NFT yang digenerate
- Mencegah duplikasi (1 FID = 1 NFT)
- Tracking stats: total minted, remaining supply

### Sharing
- Share langsung ke Warpcast dengan credit @ismaone.farcaster.eth
- Link ke OpenSea (jika sudah minted on-chain)
- Copy IPFS gateway link

### OnchainKit Integration
- Smart wallet Base sudah terintegrasi
- Siap untuk mint NFT on-chain (perlu deploy contract)

## 🔧 Deploy NFT Smart Contract (Opsional)

Untuk enable minting on-chain, Anda perlu:

1. Deploy ERC-721 NFT contract di Base
2. Update `src/lib/nft-contract.ts` dengan contract address
3. Tambahkan fungsi mint di aplikasi

Contoh simple NFT contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FidArtNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    uint256 public constant MAX_SUPPLY = 3000;
    
    constructor() ERC721("FidArt Collection", "FIDART") Ownable(msg.sender) {}
    
    function safeMint(address to, string memory uri) public returns (uint256) {
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }
}
```

Deploy menggunakan:
- Remix IDE
- Hardhat
- Foundry
- Atau tools lain yang Anda prefer

## 📱 Testing di Warpcast

1. Publish aplikasi Anda
2. Buka di Warpcast
3. Aplikasi akan otomatis connect dengan Farcaster wallet
4. Generate NFT dan share!

## 🎨 Customization

### Ubah Style Gambar
Edit prompt di `src/components/nft-generator.tsx`:

```typescript
const prompt = `Your custom prompt here using FID ${fid}`;
```

### Ubah Nama Collection
Edit `src/lib/nft-contract.ts`:

```typescript
export const NFT_COLLECTION_NAME = 'Your Collection Name';
export const MAX_SUPPLY = 3000; // Ubah max supply jika perlu
```

### Ubah Credit
Edit credit di komponen yang relevan dari:
```
by @ismaone.farcaster.eth
```
ke username Anda.

## 🐛 Troubleshooting

### Error: "Gagal menyimpan ke database"
- Pastikan Supabase credentials sudah benar
- Cek RLS policies sudah diset
- Cek table sudah dibuat dengan benar

### Error: "FID tidak ditemukan"
- Pastikan aplikasi dibuka di Warpcast
- Farcaster SDK membutuhkan context dari Warpcast

### Error build Tailwind
- Pastikan PostCSS config sudah dibuat
- Pastikan globals.css menggunakan `@import "tailwindcss"`

## 📝 License

MIT License - by @ismaone.farcaster.eth

## 🙏 Credits

- Built with Ohara AI
- Powered by Base, Farcaster, OnchainKit
- Image generation by Flux Pro
- Storage by Pinata & Supabase
