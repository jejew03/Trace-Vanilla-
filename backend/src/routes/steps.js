/**
 * POST /lots/:lotId/steps — valider une étape (rôle + HCS + DB, transfert si EXPORT).
 */

const crypto = require("crypto");
const express = require("express");
const { body, param, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const hedera = require("../services/hedera.js");
const roles = require("../services/roles.js");

const router = express.Router();
const prisma = new PrismaClient();

function handleValidation(req, res) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res.status(400).json({ error: "Validation échouée", details: err.array() });
  }
}

function sha256Hex(str) {
  return "0x" + crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

/**
 * POST /lots/:lotId/steps
 * Body: actorAccountId, step, data (optionnel)
 * 403 si rôle non autorisé, 409 si étape déjà validée.
 */
router.post(
  "/:lotId/steps",
  [
    param("lotId").notEmpty().trim(),
    body("actorAccountId").notEmpty().trim(),
    body("step").isIn(["HARVEST", "DRYING", "PACKAGING", "EXPORT", "IMPORT"]),
    body("data").optional().isObject(),
  ],
  async (req, res) => {
    handleValidation(req, res);
    if (res.headersSent) return;
    const { lotId } = req.params;
    const { actorAccountId, step, data: stepData } = req.body;
    try {
      const allowed = await roles.isStepAllowed(actorAccountId, step);
      if (!allowed) {
        return res.status(403).json({
          error: "Rôle non autorisé pour cette étape",
          step,
          actorAccountId,
        });
      }

      const lot = await prisma.lot.findUnique({ where: { lotId } });
      if (!lot) {
        return res.status(404).json({ error: "Lot non trouvé", lotId });
      }

      const existing = await prisma.hcsEvent.findFirst({
        where: { lotId, step },
      });
      if (existing) {
        return res.status(409).json({
          error: "Cette étape a déjà été validée pour ce lot",
          lotId,
          step,
        });
      }

      const actor = await prisma.actor.findUnique({
        where: { hederaAccount: actorAccountId },
      });
      const role = actor?.role || "UNKNOWN";

      const timestamp = new Date().toISOString();
      const payloadWithoutHash = {
        version: "1.0",
        lotId,
        tokenId: lot.tokenId,
        serial: lot.serial,
        step,
        actor: { hederaAccount: actorAccountId, role },
        timestamp,
        location: stepData?.location || {},
        data: stepData || {},
        ipfsRef: "",
        txRef: "",
      };
      const eventHash = sha256Hex(JSON.stringify(payloadWithoutHash));
      const payload = { ...payloadWithoutHash, eventHash };

      const { txId } = await hedera.publishHCSEvent(payload);

      if (step === "EXPORT") {
        const harvestEvent = await prisma.hcsEvent.findFirst({
          where: { lotId, step: "HARVEST" },
        });
        const fromAccount = harvestEvent?.actorAccount || process.env.HEDERA_OPERATOR_ID;
        await hedera.transferLotNFT(lot.tokenId, lot.serial, fromAccount, actorAccountId);
      }

      await prisma.hcsEvent.create({
        data: {
          lotId,
          step,
          actorAccount: actorAccountId,
          role,
          timestamp: new Date(timestamp),
          eventHash,
          txId,
        },
      });

      return res.status(201).json({
        txId,
        eventHash,
        step,
        timestamp,
      });
    } catch (e) {
      console.error("POST /lots/:lotId/steps", e);
      return res.status(500).json({
        error: "Erreur validation étape",
        message: e.message,
      });
    }
  }
);

module.exports = router;
