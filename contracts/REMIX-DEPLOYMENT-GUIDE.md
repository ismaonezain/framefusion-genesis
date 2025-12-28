# 🎨 FrameFusion Genesis V2 - Remix Deployment Guide

Panduan lengkap untuk deploy contract V2 menggunakan Remix IDE.

---

## 📋 Prerequisites

1. **Wallet**: MetaMask atau wallet lain yang sudah terinstall
2. **Base ETH**: Pastikan ada ETH di Base Mainnet untuk gas fee (~$2-5)
3. **Remix IDE**: Buka https://remix.ethereum.org

---

## 🚀 Step-by-Step Deployment

### Step 1: Buka Remix IDE

1. Buka browser dan pergi ke: **https://remix.ethereum.org**
2. Tunggu Remix IDE fully loaded

### Step 2: Create New File

1. Di sidebar kiri, klik icon **"File Explorer"** (icon folder)
2. Klik kanan pada folder `contracts/` → **New File**
3. Nama file: `FrameFusionGenesisV2.sol`

### Step 3: Copy Contract Code

1. Buka file `FrameFusionGenesisV2-Remix.sol` dari project ini
2. **Copy semua kode** dari file tersebut
3. **Paste** ke file baru di Remix (`FrameFusionGenesisV2.sol`)

### Step 4: Compile Contract

1. Di sidebar kiri, klik icon **"Solidity Compiler"** (icon dengan huruf S)
2. Pastikan compiler version: **0.8.20** atau lebih tinggi
3. **PENTING**: Klik **"Advanced Configurations"** dan centang:
   - ✅ **Enable optimization** (200 runs)
   - ✅ **Compile via IR** atau **viaIR: true**
4. Klik tombol biru **"Compile FrameFusionGenesisV2.sol"**
5. Tunggu hingga muncul ✅ **green checkmark** (compiled successfully)

**Troubleshooting Compile:**
- Jika ada error "Stack too deep": Pastikan "Compile via IR" sudah enabled
- Jika OpenZeppelin imports error: Remix akan auto-download, tunggu beberapa detik

### Step 5: Connect Wallet to Base Network

1. Buka **MetaMask** extension
2. Klik dropdown network di atas
3. Pilih **"Base"** (Base Mainnet)
   - Jika tidak ada, tambahkan manual:
     - Network Name: `Base`
     - RPC URL: `https://mainnet.base.org`
     - Chain ID: `8453`
     - Currency Symbol: `ETH`
     - Block Explorer: `https://basescan.org`
4. Pastikan wallet terconnect ke Base dan ada balance ETH

### Step 6: Deploy Contract

1. Di sidebar kiri, klik icon **"Deploy & Run Transactions"** (icon Ethereum)
2. Di bagian **"Environment"**, pilih: **Injected Provider - MetaMask**
3. Confirm connection di MetaMask popup
4. Pastikan:
   - Account: Wallet address kamu muncul
   - Contract: **FrameFusionGenesisV2** terpilih
5. Klik tombol orange **"Deploy"**
6. **Confirm transaction** di MetaMask popup
7. Tunggu 5-10 detik hingga deployment selesai

### Step 7: Copy Contract Address

1. Setelah deployment berhasil, di bagian **"Deployed Contracts"** akan muncul contract baru
2. Klik icon **copy** di samping contract address
3. **Contract address** akan ter-copy ke clipboard (format: `0x123...abc`)

### Step 8: Verify Contract (Optional tapi Recommended)

1. Buka **https://basescan.org**
2. Paste contract address di search bar
3. Klik tab **"Contract"** → **"Verify and Publish"**
4. Pilih:
   - Compiler Type: **Solidity (Single file)**
   - Compiler Version: **v0.8.20** (sesuai yang dipakai)
   - License: **MIT**
5. Di **"Enter the Solidity Contract Code"**:
   - Paste **semua kode** dari `FrameFusionGenesisV2-Remix.sol`
6. Di **"Optimization"**: Select **Yes** dengan **200 runs**
7. Klik **"Verify and Publish"**
8. Tunggu hingga muncul ✅ **"Successfully verified"**

---

## 🔧 Update Application

Setelah deploy berhasil, update contract address di aplikasi:

### Update Contract Address

1. Buka file: `src/lib/nft-contract-v2.ts`
2. Ganti contract address:
   ```typescript
   export const NFT_CONTRACT_ADDRESS_V2 = '0xYOUR_NEW_CONTRACT_ADDRESS_HERE';
   ```
3. Paste contract address yang kamu copy dari Remix

### Update Mint Button (page.tsx)

1. Buka file: `src/app/page.tsx`
2. Import V2 button:
   ```typescript
   import { MintNFTButtonV2 } from '@/components/mint-nft-button-v2';
   ```
3. Replace button lama dengan V2:
   ```typescript
   <MintNFTButtonV2
     fid={fid}
     walletAddress={address}
     nftData={nftData}
     onMintSuccess={handleMintSuccess}
   />
   ```

---

## ✅ Testing

### Test di Remix

Setelah deploy, test fungsi-fungsi contract:

1. Di **"Deployed Contracts"**, expand contract yang baru di-deploy
2. Test fungsi public:
   - **totalSupply**: Cek jumlah NFT yang sudah di-mint (awalnya 0)
   - **checkIfMinted**: Input FID untuk cek apakah sudah mint
   - **name**: Harus return "FrameFusion Genesis V2"
   - **symbol**: Harus return "FFG2"

### Test di Aplikasi

1. Buka aplikasi di browser
2. Connect wallet
3. Coba mint NFT baru
4. Check di Basescan apakah transaction berhasil
5. Verify metadata tersimpan on-chain

---

## 💰 Gas Fee Estimation

Estimasi biaya deployment dan minting:

| Action | Gas Used | Estimated Cost (Base) |
|--------|----------|----------------------|
| Deploy Contract | ~3,000,000 | ~$3-5 |
| First Mint | ~300,000 | ~$0.30-0.50 |
| Subsequent Mints | ~250,000 | ~$0.25-0.40 |

**Note**: Actual costs depend on Base network gas price at deployment time.

---

## 🐛 Common Issues

### Issue 1: "Stack too deep" error saat compile
**Solution**: 
- Enable **"Compile via IR"** di Advanced Configurations
- Enable **optimization** dengan 200 runs

### Issue 2: OpenZeppelin imports not found
**Solution**:
- Remix akan auto-download OpenZeppelin contracts
- Tunggu 10-20 detik dan compile ulang
- Jika masih error, refresh Remix page

### Issue 3: MetaMask tidak connect
**Solution**:
- Pastikan MetaMask unlocked
- Refresh Remix page
- Pilih "Injected Provider - MetaMask" lagi
- Approve connection di MetaMask

### Issue 4: Transaction failed saat deploy
**Solution**:
- Pastikan ada cukup ETH untuk gas (~$5)
- Cek network: Harus di Base Mainnet
- Increase gas limit di MetaMask (Advanced settings)

### Issue 5: Contract deployed tapi tidak bisa interact
**Solution**:
- Verify contract di Basescan
- Tunggu beberapa block (~30 detik) setelah deployment
- Refresh Remix page

---

## 📝 Post-Deployment Checklist

- [ ] Contract deployed successfully
- [ ] Contract address copied
- [ ] Contract verified di Basescan (optional)
- [ ] Contract address updated di `src/lib/nft-contract-v2.ts`
- [ ] Mint button updated di `src/app/page.tsx`
- [ ] Test mint berhasil
- [ ] Metadata tersimpan on-chain (check di Basescan)

---

## 🎉 Success!

Setelah semua langkah selesai, contract V2 sudah live di Base Mainnet dan siap digunakan untuk menyimpan metadata lengkap on-chain!

Contract features:
✅ Store FID, character class, background, accessories, clothing on-chain
✅ One NFT per FID enforcement
✅ Query metadata by token ID or FID
✅ Permanent on-chain storage
✅ No IPFS dependency for metadata

---

## 🔗 Useful Links

- **Remix IDE**: https://remix.ethereum.org
- **Base Mainnet**: https://mainnet.base.org
- **Basescan**: https://basescan.org
- **Base Faucet** (for testnet): https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **OpenZeppelin Docs**: https://docs.openzeppelin.com/contracts

---

## 📞 Need Help?

Jika ada masalah saat deployment, check:
1. Remix console (klik icon console di bawah)
2. MetaMask activity tab
3. Basescan transaction details (paste tx hash)

Happy deploying! 🚀
