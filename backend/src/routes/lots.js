/**
 * CRUD lots + mint NFT HTS.
 * POST /lots, GET /lots, GET /lots/:lotId
 */

const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const hedera = require("../services/hedera.js");

const router = express.Router();
const prisma = new PrismaClient();

function handleValidation(req, res) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res.status(400).json({ error: "Validation échouée", details: err.array() });
  }
}

/**
 * POST /lots
 * Body: farmerAccountId, origin, variety, weight_kg, quality_grade, harvestDate
 * 1) Upload métadonnées IPFS, 2) mint NFT HTS, 3) créer Lot en DB
 */
router.post(
  "/",
  [
    body("farmerAccountId").notEmpty().trim(),
    body("origin").notEmpty().trim(),
    body("variety").optional().trim(),
    body("weight_kg").isFloat({ min: 0 }).toFloat(),
    body("quality_grade").optional().trim(),
    body("harvestDate").optional().trim(),
  ],
  async (req, res) => {
    handleValidation(req, res);
    if (res.headersSent) return;
    try {
      const { farmerAccountId, origin, variety, weight_kg, quality_grade, harvestDate } = req.body;
      const name = req.body.name || `VANILLE-${Date.now()}`;
      const description = `Lot de vanille ${variety || "Vanilla planifolia"}, origine ${origin}`;
      const metadata = {
        name,
        description,
        image: "",
        properties: {
          origin,
          variety: variety || "Vanilla planifolia",
          weight_kg: Number(weight_kg),
          quality_grade: quality_grade || "A",
          harvestDate: harvestDate || new Date().toISOString().slice(0, 10),
          farmer: farmerAccountId,
        },
      };
      const { tokenId, serial, txId, ipfsRef } = await hedera.mintLotNFT(metadata);
      const lotId = `${tokenId}-${serial}`;
      await prisma.lot.create({
        data: { lotId, tokenId, serial, ipfsRef: ipfsRef || undefined },
      });
      return res.status(201).json({ lotId, tokenId, serial, ipfsRef: ipfsRef || null, txId });
    } catch (e) {
      console.error("POST /lots", e);
      return res.status(500).json({ error: "Erreur création lot", message: e.message });
    }
  }
);

const NEXT_STEP_ORDER = ["HARVEST", "DRYING", "PACKAGING", "EXPORT", "IMPORT"];

/**
 * GET /lots — liste avec pagination (page, limit).
 * Filtres optionnels :
 * - creatorAccountId : lots dont le créateur (HARVEST) est ce compte (pour FARMER).
 * - nextStep : lots en attente de cette étape (ex. DRYING = HARVEST fait, DRYING pas fait).
 */
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("creatorAccountId").optional().trim(),
    query("nextStep").optional().isIn(NEXT_STEP_ORDER),
  ],
  async (req, res) => {
    handleValidation(req, res);
    if (res.headersSent) return;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const creatorAccountId = req.query.creatorAccountId;
    const nextStep = req.query.nextStep;
    try {
      let lotIdsFilter = null;
      if (creatorAccountId) {
        const created = await prisma.hcsEvent.findMany({
          where: { step: "HARVEST", actorAccount: creatorAccountId },
          select: { lotId: true },
          distinct: ["lotId"],
        });
        lotIdsFilter = created.map((r) => r.lotId);
        if (lotIdsFilter.length === 0) {
          return res.json({ lots: [], total: 0, page, limit });
        }
      }
      if (nextStep) {
        const idx = NEXT_STEP_ORDER.indexOf(nextStep);
        const stepsDone = NEXT_STEP_ORDER.slice(0, idx);
        const doneLotIds = new Set();
        for (const s of stepsDone) {
          const rows = await prisma.hcsEvent.findMany({
            where: { step: s },
            select: { lotId: true },
            distinct: ["lotId"],
          });
          rows.forEach((r) => doneLotIds.add(r.lotId));
        }
        const hasNextLotIds = await prisma.hcsEvent.findMany({
          where: { step: nextStep },
          select: { lotId: true },
          distinct: ["lotId"],
        });
        const hasNextSet = new Set(hasNextLotIds.map((r) => r.lotId));
        const pendingLotIds = [...doneLotIds].filter((id) => !hasNextSet.has(id));
        if (pendingLotIds.length === 0) {
          return res.json({ lots: [], total: 0, page, limit });
        }
        lotIdsFilter = lotIdsFilter ? lotIdsFilter.filter((id) => pendingLotIds.includes(id)) : pendingLotIds;
      }
      const where = lotIdsFilter ? { lotId: { in: lotIdsFilter } } : {};
      const [lots, total] = await Promise.all([
        prisma.lot.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
        prisma.lot.count({ where }),
      ]);
      return res.json({ lots, total, page, limit });
    } catch (e) {
      console.error("GET /lots", e);
      return res.status(500).json({ error: "Erreur liste lots", message: e.message });
    }
  }
);

/**
 * GET /lots/:lotId — détail lot + événements HCS (DB)
 */
router.get(
  "/:lotId",
  [param("lotId").notEmpty().trim()],
  async (req, res) => {
    handleValidation(req, res);
    if (res.headersSent) return;
    const { lotId } = req.params;
    try {
      const lot = await prisma.lot.findUnique({
        where: { lotId },
        include: { events: { orderBy: { timestamp: "asc" } } },
      });
      if (!lot) return res.status(404).json({ error: "Lot non trouvé", lotId });
      return res.json(lot);
    } catch (e) {
      console.error("GET /lots/:lotId", e);
      return res.status(500).json({ error: "Erreur détail lot", message: e.message });
    }
  }
);

module.exports = router;
