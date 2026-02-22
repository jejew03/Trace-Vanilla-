/**
 * Service central Hedera — HTS (mint, transfer NFT) et HCS (publication messages).
 * Client singleton, opérateur depuis .env. Ne jamais stocker de clés privées utilisateur.
 */

const {
  Client,
  PrivateKey,
  TokenMintTransaction,
  TopicMessageSubmitTransaction,
  TransferTransaction,
  TokenId,
  NftId,
  AccountCreateTransaction,
  Hbar,
} = require("@hashgraph/sdk");

const ipfs = require("./ipfs.js");

let _client = null;

/**
 * Retourne le client Hedera (singleton). Initialise avec HEDERA_OPERATOR_ID / HEDERA_OPERATOR_KEY.
 * @returns {import("@hashgraph/sdk").Client}
 */
function getClient() {
  if (_client) return _client;

  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKeyStr = process.env.HEDERA_OPERATOR_KEY;

  if (!operatorId || !operatorKeyStr) {
    throw new Error(
      "HEDERA_OPERATOR_ID et HEDERA_OPERATOR_KEY doivent être définis dans .env"
    );
  }

  let operatorKey;
  try {
    if (operatorKeyStr.startsWith("302e") || operatorKeyStr.length > 64) {
      operatorKey = PrivateKey.fromString(operatorKeyStr);
    } else {
      operatorKey = PrivateKey.fromStringED25519(operatorKeyStr);
    }
  } catch (e) {
    throw new Error(
      `HEDERA_OPERATOR_KEY invalide: ${e.message}`
    );
  }

  const client = Client.forName(process.env.HEDERA_NETWORK || "testnet");
  client.setOperator(operatorId, operatorKey);
  _client = client;
  return _client;
}

/**
 * Upload métadonnées sur IPFS puis mint un NFT HTS (1 serial).
 * @param {object} metadata - Métadonnées du lot (conformes au schéma NFT du projet)
 * @returns {Promise<{ tokenId: string, serial: number, txId: string }>}
 */
async function mintLotNFT(metadata) {
  const tokenIdStr = process.env.HEDERA_TOKEN_ID;
  if (!tokenIdStr) {
    throw new Error("HEDERA_TOKEN_ID doit être défini dans .env");
  }

  try {
    const ipfsRef = await ipfs.uploadJSON(metadata);

    const client = getClient();
    const mintTx = new TokenMintTransaction()
      .setTokenId(tokenIdStr)
      .addMetadata(Buffer.from(ipfsRef, "utf8"));

    const response = await mintTx.execute(client);
    const receipt = await response.getReceipt(client);

    if (!receipt.serials || receipt.serials.length === 0) {
      throw new Error("Aucun serial retourné par le mint NFT");
    }
    const serial = receipt.serials[0].toNumber ? receipt.serials[0].toNumber() : Number(receipt.serials[0]);

    return {
      tokenId: tokenIdStr,
      serial,
      txId: response.transactionId.toString(),
      ipfsRef,
    };
  } catch (err) {
    throw new Error(`mintLotNFT: ${err.message}`);
  }
}

/**
 * Publie un message sur le topic HCS vanilla-trace-events.
 * @param {object} eventPayload - Payload conforme au schéma message HCS du projet
 * @returns {Promise<{ txId: string }>}
 */
async function publishHCSEvent(eventPayload) {
  const topicIdStr = process.env.HEDERA_TOPIC_ID;
  if (!topicIdStr) {
    throw new Error("HEDERA_TOPIC_ID doit être défini dans .env");
  }

  try {
    const message = JSON.stringify(eventPayload);
    const client = getClient();

    const submitTx = new TopicMessageSubmitTransaction()
      .setTopicId(topicIdStr)
      .setMessage(message);

    const response = await submitTx.execute(client);
    const txId = response.transactionId.toString();
    return { txId };
  } catch (err) {
    throw new Error(`publishHCSEvent: ${err.message}`);
  }
}

/**
 * Transfère un NFT HTS d'un compte à un autre.
 * Le destinataire doit être associé au token (TokenAssociateTransaction) avant transfert si ce n'est pas déjà fait.
 * @param {string} tokenId - TokenId HTS (ex. "0.0.123456")
 * @param {number} serial - Numéro de série du NFT
 * @param {string} fromAccountId - Compte source (ex. "0.0.789012")
 * @param {string} toAccountId - Compte destinataire (ex. "0.0.789013")
 * @returns {Promise<{ txId: string }>}
 */
async function transferLotNFT(tokenId, serial, fromAccountId, toAccountId) {
  try {
    const client = getClient();

    const nftId =
      typeof tokenId === "string"
        ? new NftId(TokenId.fromString(tokenId), serial)
        : new NftId(tokenId, serial);
    const transferTx = new TransferTransaction().addNftTransfer(
      nftId,
      fromAccountId,
      toAccountId
    );

    const response = await transferTx.execute(client);
    return { txId: response.transactionId.toString() };
  } catch (err) {
    throw new Error(`transferLotNFT: ${err.message}`);
  }
}

/**
 * Crée un nouveau compte Hedera sur le testnet (opérateur paie les frais).
 * À utiliser pour provisionner des comptes démo. Ne pas stocker la clé privée côté serveur.
 * @returns {Promise<{ accountId: string, privateKey: string, publicKey: string }>}
 */
async function createHederaAccount() {
  try {
    const newKey = PrivateKey.generateED25519();
    const client = getClient();

    const createTx = new AccountCreateTransaction()
      .setKey(newKey.publicKey)
      .setInitialBalance(new Hbar(0));

    const response = await createTx.execute(client);
    const receipt = await response.getReceipt(client);

    if (!receipt.accountId) {
      throw new Error("Création de compte: aucun accountId dans le receipt");
    }

    const accountId = receipt.accountId.toString();
    const privateKey = newKey.toStringDer();
    const publicKey = newKey.publicKey.toStringDer();

    return {
      accountId,
      privateKey,
      publicKey,
    };
  } catch (err) {
    throw new Error(`createHederaAccount: ${err.message}`);
  }
}

module.exports = {
  getClient,
  mintLotNFT,
  publishHCSEvent,
  transferLotNFT,
  createHederaAccount,
};
