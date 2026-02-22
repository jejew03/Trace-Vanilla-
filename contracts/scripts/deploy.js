/**
 * Déploiement Vanilla Trace sur Hedera (EVM + HCS topic + HTS NFT).
 * Utilise HEDERA_OPERATOR_ID et HEDERA_OPERATOR_KEY depuis .env (racine du monorepo).
 *
 * Usage: depuis contracts/ : npm run compile && node scripts/deploy.js
 *        ou avec Hardhat : npx hardhat run scripts/deploy.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const {
  Client,
  PrivateKey,
  ContractCreateFlow,
  TopicCreateTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
} = require("@hashgraph/sdk");

async function main() {
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKeyStr = process.env.HEDERA_OPERATOR_KEY;

  if (!operatorId || !operatorKeyStr) {
    throw new Error(
      "HEDERA_OPERATOR_ID et HEDERA_OPERATOR_KEY doivent être définis dans .env"
    );
  }

  const client = Client.forName(
    process.env.HEDERA_NETWORK || "testnet"
  );
  let operatorKey;
  try {
    if (operatorKeyStr.startsWith("302e") || operatorKeyStr.length > 64) {
      operatorKey = PrivateKey.fromString(operatorKeyStr);
    } else {
      operatorKey = PrivateKey.fromStringED25519(operatorKeyStr);
    }
  } catch (e) {
    throw new Error(
      "HEDERA_OPERATOR_KEY invalide (attendu: hex DER ou hex ED25519). " + e.message
    );
  }
  client.setOperator(operatorId, operatorKey);

  console.log("--- 1. Compilation et déploiement du contrat EVM ---");
  const hre = require("hardhat");
  await hre.run("compile");
  const artifact = await hre.artifacts.readArtifact("VanillaTrace");
  const bytecode = artifact.bytecode;
  if (!bytecode || bytecode === "0x") {
    throw new Error("Bytecode VanillaTrace introuvable. Lancez npm run compile.");
  }

  const contractCreateTx = new ContractCreateFlow()
    .setBytecode(bytecode)
    .setGas(500_000);

  const contractCreateResponse = await contractCreateTx.execute(client);
  const contractCreateReceipt = await contractCreateResponse.getReceipt(client);
  const contractId = contractCreateReceipt.contractId;

  console.log("HEDERA_CONTRACT_ID=" + contractId.toString());

  console.log("\n--- 2. Création du topic HCS vanilla-trace-events ---");
  const topicCreateTx = new TopicCreateTransaction().setTopicMemo(
    "vanilla-trace-events"
  );
  const topicCreateResponse = await topicCreateTx.execute(client);
  const topicCreateReceipt = await topicCreateResponse.getReceipt(client);
  const topicId = topicCreateReceipt.topicId;

  console.log("HEDERA_TOPIC_ID=" + topicId.toString());

  console.log("\n--- 3. Création du token HTS (NFT collection) ---");
  const treasuryId = operatorId;
  const supplyKey = operatorKey.publicKey;

  const tokenCreateTx = new TokenCreateTransaction()
    .setTokenName("VanillaTrace")
    .setTokenSymbol("VTR")
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(treasuryId)
    .setSupplyKey(supplyKey)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(100000);

  const tokenCreateResponse = await tokenCreateTx.execute(client);
  const tokenCreateReceipt = await tokenCreateResponse.getReceipt(client);
  const tokenId = tokenCreateReceipt.tokenId;

  console.log("HEDERA_TOKEN_ID=" + tokenId.toString());

  console.log("\n--- Résumé — à copier dans .env ---");
  console.log("HEDERA_CONTRACT_ID=" + contractId.toString());
  console.log("HEDERA_TOPIC_ID=" + topicId.toString());
  console.log("HEDERA_TOKEN_ID=" + tokenId.toString());

  client.close();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
