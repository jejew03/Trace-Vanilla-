/**
 * Vérification des rôles on-chain via le contrat VanillaTrace (isStepAllowed).
 * Utilise le Mirror Node pour récupérer l'adresse EVM d'un compte Hedera.
 */

const axios = require("axios");
const {
  ContractCallQuery,
  ContractFunctionParameters,
} = require("@hashgraph/sdk");
const hedera = require("./hedera.js");

const MIRROR_BASE = (process.env.MIRROR_NODE_URL || "https://testnet.mirrornode.hedera.com").replace(/\/$/, "");
const CONTRACT_ID = process.env.HEDERA_CONTRACT_ID;

const STEP_TO_UINT8 = {
  HARVEST: 0,
  DRYING: 1,
  PACKAGING: 2,
  EXPORT: 3,
  IMPORT: 4,
};

/**
 * Récupère l'adresse EVM d'un compte Hedera depuis le Mirror Node.
 * @param {string} accountId - Compte Hedera (ex. "0.0.789012")
 * @returns {Promise<string|null>} - Adresse 0x... ou null si indisponible
 */
async function getEvmAddress(accountId) {
  try {
    const url = `${MIRROR_BASE}/api/v1/accounts/${accountId}`;
    const { data } = await axios.get(url, { timeout: 5000 });
    const evm = data.evm_address || data.alias;
    if (evm && typeof evm === "string" && evm.startsWith("0x")) return evm;
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Vérifie si un acteur a le droit de valider une étape (appel au contrat).
 * @param {string} actorAccountId - Compte Hedera (ex. "0.0.789012")
 * @param {string} step - Étape: HARVEST | DRYING | PACKAGING | EXPORT | IMPORT
 * @returns {Promise<boolean>}
 */
async function isStepAllowed(actorAccountId, step) {
  if (!CONTRACT_ID) {
    throw new Error("HEDERA_CONTRACT_ID doit être défini pour vérifier les rôles");
  }
  const stepIndex = STEP_TO_UINT8[step];
  if (stepIndex === undefined) {
    return false;
  }
  const evmAddress = await getEvmAddress(actorAccountId);
  if (!evmAddress) {
    return false;
  }
  const client = hedera.getClient();
  const query = new ContractCallQuery()
    .setContractId(CONTRACT_ID)
    .setGas(100_000)
    .setFunction(
      "isStepAllowed(address,uint8)",
      new ContractFunctionParameters().addAddress(evmAddress).addUint8(stepIndex)
    );
  const result = await query.execute(client);
  return result.getBool(0);
}

module.exports = {
  getEvmAddress,
  isStepAllowed,
};
