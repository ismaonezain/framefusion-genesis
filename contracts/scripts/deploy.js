const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying FrameFusion Genesis V2 to", hre.network.name);
  console.log("=========================================\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  console.log("⏳ Deploying FrameFusionGenesisV2...");
  const FrameFusionGenesisV2 = await hre.ethers.getContractFactory("FrameFusionGenesisV2");
  const contract = await FrameFusionGenesisV2.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  
  console.log("\n✅ FrameFusion Genesis V2 deployed successfully!");
  console.log("=========================================");
  console.log("📍 Contract Address:", address);
  console.log("🌐 Network:", hre.network.name);
  console.log("⛽ Max Supply: 3000");
  console.log("=========================================\n");

  console.log("📋 Next Steps:");
  console.log("1. Update src/lib/nft-contract-v2.ts:");
  console.log(`   export const NFT_CONTRACT_ADDRESS_V2 = '${address}';`);
  console.log("\n2. Verify contract on BaseScan:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${address}`);
  console.log("\n3. View on BaseScan:");
  if (hre.network.name === 'base') {
    console.log(`   https://basescan.org/address/${address}`);
  } else if (hre.network.name === 'baseSepolia') {
    console.log(`   https://sepolia.basescan.org/address/${address}`);
  }
  console.log("\n✨ Ready to mint NFTs with on-chain metadata!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
