/**
 * Lecture du Mirror Node Hedera — topic HCS messages.
 * Indexation en PostgreSQL pour répondre à getLotHistory en < 3s.
 */

const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const MIRROR_BASE = process.env.MIRROR_NODE_URL || "https://testnet.mirrornode.hedera.com";
const DEFAULT_TOPIC_ID = process.env.HEDERA_TOPIC_ID;
const PAGE_LIMIT = 100;

/**
 * Récupère les messages d'un topic depuis le Mirror Node.
 * @param {string} topicId - TopicId HCS (ex. "0.0.123456")
 * @param {string} [lotId] - Si fourni, filtre les messages dont le contenu JSON a lotId égal
 * @returns {Promise<Array<object>>} Messages parsés (schema HCS du projet)
 */
async function getTopicMessages(topicId, lotId) {
  const topic = topicId || DEFAULT_TOPIC_ID;
  if (!topic) {
    throw new Error("topicId ou HEDERA_TOPIC_ID requis");
  }

  const url = `${MIRROR_BASE.replace(/\/$/, "")}/api/v1/topics/${topic}/messages`;
  const params = { limit: PAGE_LIMIT, order: "desc" };

  const results = [];
  let nextUrl = `${url}?${new URLSearchParams(params)}`;

  while (nextUrl) {
    const res = await axios.get(nextUrl, { timeout: 10000 });
    const data = res.data || {};
    const messages = data.messages || data.data?.messages || [];
    if (!Array.isArray(messages)) break;

    for (const row of messages) {
      let payload;
      try {
        const raw = row.message;
        const decoded = Buffer.from(raw, "base64").toString("utf8");
        payload = JSON.parse(decoded);
      } catch (e) {
        continue;
      }
      if (lotId && payload.lotId !== lotId) continue;

      const txId =
        payload.txRef ||
        (row.chunk_info && row.chunk_info.initial_transaction_id) ||
        `${topic}:${row.sequence_number}`;

      results.push({
        lotId: payload.lotId,
        tokenId: payload.tokenId,
        serial: payload.serial,
        step: payload.step,
        actorAccount: payload.actor?.hederaAccount || "",
        role: payload.actor?.role || "",
        timestamp: payload.timestamp || row.consensus_timestamp,
        ipfsRef: payload.ipfsRef || null,
        eventHash: payload.eventHash || null,
        txId,
        sequenceNumber: row.sequence_number,
        consensusTimestamp: row.consensus_timestamp,
        raw: payload,
      });
    }

    const links = data.links || {};
    nextUrl = links.next ? (links.next.startsWith("http") ? links.next : `${MIRROR_BASE}${links.next}`) : null;
  }

  return results.sort(
    (a, b) =>
      new Date(b.timestamp || b.consensusTimestamp).getTime() -
      new Date(a.timestamp || a.consensusTimestamp).getTime()
  );
}

/**
 * Indexe les événements d'un lot dans PostgreSQL (upsert par lotId + txId).
 * @param {string} lotId - Identifiant lot (ex. "0.0.123456-1")
 * @returns {Promise<void>}
 */
async function indexLotEvents(lotId) {
  const topicId = DEFAULT_TOPIC_ID;
  if (!topicId) {
    throw new Error("HEDERA_TOPIC_ID doit être défini pour indexer");
  }

  const messages = await getTopicMessages(topicId, lotId);

  if (messages.length > 0) {
    const first = messages[messages.length - 1];
    const lotExists = await prisma.lot.findUnique({ where: { lotId } });
    if (!lotExists) {
      await prisma.lot.create({
        data: {
          lotId,
          tokenId: first.tokenId || "",
          serial: first.serial || 0,
          ipfsRef: first.ipfsRef ?? undefined,
        },
      });
    }
  }

  for (const msg of messages) {
    const txId = msg.txId || `${msg.lotId}:${msg.step}:${msg.timestamp}`;
    const existing = await prisma.hcsEvent.findFirst({
      where: { lotId: msg.lotId, txId },
    });
    if (existing) continue;

    await prisma.hcsEvent.create({
      data: {
        lotId: msg.lotId,
        step: msg.step,
        actorAccount: msg.actorAccount,
        role: msg.role,
        timestamp: new Date(msg.timestamp || msg.consensusTimestamp),
        ipfsRef: msg.ipfsRef ?? undefined,
        eventHash: msg.eventHash ?? undefined,
        txId,
      },
    });
  }
}

/**
 * Historique d'événements HCS d'un lot : d'abord PostgreSQL, sinon indexation puis DB.
 * Objectif : réponse < 3 secondes.
 * @param {string} lotId - Identifiant lot (ex. "0.0.123456-1")
 * @returns {Promise<Array<{ step: string, actorAccount: string, role: string, timestamp: Date, txId?: string }>>}
 */
async function getLotHistory(lotId) {
  const fromDb = await prisma.hcsEvent.findMany({
    where: { lotId },
    orderBy: { timestamp: "asc" },
    select: {
      step: true,
      actorAccount: true,
      role: true,
      timestamp: true,
      txId: true,
      ipfsRef: true,
      eventHash: true,
    },
  });

  if (fromDb.length > 0) {
    return fromDb;
  }

  await indexLotEvents(lotId);
  const again = await prisma.hcsEvent.findMany({
    where: { lotId },
    orderBy: { timestamp: "asc" },
    select: {
      step: true,
      actorAccount: true,
      role: true,
      timestamp: true,
      txId: true,
      ipfsRef: true,
      eventHash: true,
    },
  });
  return again;
}

module.exports = {
  getTopicMessages,
  indexLotEvents,
  getLotHistory,
};
