/**
 * Upload métadonnées sur IPFS via Pinata.
 * Utilisé par hedera.js pour stocker les métadonnées NFT avant mint.
 */

const axios = require("axios");

const PINATA_PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

/**
 * Envoie un objet JSON sur IPFS via Pinata.
 * @param {object} metadata - Objet à épingler (ex. métadonnées NFT)
 * @returns {Promise<string>} - CID IPFS (ex. "QmXXX...")
 */
async function uploadJSON(metadata) {
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error(
      "PINATA_API_KEY et PINATA_SECRET_KEY doivent être définis dans .env"
    );
  }

  try {
    const { data } = await axios.post(
      PINATA_PIN_JSON_URL,
      {
        pinataContent: metadata,
        pinataMetadata: { name: "vanilla-trace-metadata.json" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: apiKey,
          pinata_secret_api_key: secretKey,
        },
      }
    );

    if (!data.IpfsHash) {
      throw new Error("Pinata n'a pas retourné de IpfsHash");
    }
    return data.IpfsHash;
  } catch (err) {
    const msg =
      err.response?.data?.error ||
      err.message ||
      "Erreur inconnue lors de l'upload IPFS";
    throw new Error(`IPFS (Pinata): ${msg}`);
  }
}

module.exports = {
  uploadJSON,
};
