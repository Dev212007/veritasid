const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying VeritasID Smart Contracts...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`📍 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Deploy DIDRegistry
  console.log("📄 Deploying DIDRegistry...");
  const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
  const didRegistry = await DIDRegistry.deploy();
  await didRegistry.waitForDeployment();
  console.log(`✅ DIDRegistry deployed: ${await didRegistry.getAddress()}`);

  // Deploy CredentialRegistry
  console.log("\n📄 Deploying CredentialRegistry...");
  const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = await CredentialRegistry.deploy();
  await credentialRegistry.waitForDeployment();
  console.log(`✅ CredentialRegistry deployed: ${await credentialRegistry.getAddress()}`);

  // Deploy PermissionManager
  console.log("\n📄 Deploying PermissionManager...");
  const PermissionManager = await ethers.getContractFactory("PermissionManager");
  const permissionManager = await PermissionManager.deploy();
  await permissionManager.waitForDeployment();
  console.log(`✅ PermissionManager deployed: ${await permissionManager.getAddress()}`);

  const addresses = {
    DIDRegistry: await didRegistry.getAddress(),
    CredentialRegistry: await credentialRegistry.getAddress(),
    PermissionManager: await permissionManager.getAddress(),
    deployer: deployer.address,
    network: "localhost",
    deployedAt: new Date().toISOString(),
  };

  console.log("\n📋 Contract Addresses:");
  console.log(JSON.stringify(addresses, null, 2));

  // Save to blockchain/deployments.json
  const deploymentsPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(addresses, null, 2));
  console.log(`\n💾 Saved to: ${deploymentsPath}`);

  // Also save to frontend/src/utils/ for easy import
  const frontendPath = path.join(__dirname, "../../frontend/src/utils/contractAddresses.json");
  if (fs.existsSync(path.dirname(frontendPath))) {
    fs.writeFileSync(frontendPath, JSON.stringify(addresses, null, 2));
    console.log(`💾 Saved to frontend: ${frontendPath}`);
  }

  // Also save to backend/config/ for backend use
  const backendPath = path.join(__dirname, "../../backend/config/contractAddresses.json");
  if (fs.existsSync(path.dirname(backendPath))) {
    fs.writeFileSync(backendPath, JSON.stringify(addresses, null, 2));
    console.log(`💾 Saved to backend: ${backendPath}`);
  }

  console.log("\n🎉 All contracts deployed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
