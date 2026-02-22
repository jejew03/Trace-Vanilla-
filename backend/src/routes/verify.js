/**
 * GET /verify/:lotId — Portail vérification (Mirror Node + score).
 * Retourne { lot, events, score }. Cible : < 3 secondes.
 */

const express = require("express");
const mirror = require("../services/mirror.js");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

const STEP_SCORE = {
  HARVEST: 25,
  DRYING: 50,
  PACKAGING: 65,
  EXPORT: 85,
  IMPORT: 100,
};

function computeScore(events) {
  if (!events || events.length === 0) return 0;
  let max = 0;
  for (const e of events) {
    const p = STEP_SCORE[e.step];
    if (p != null && p > max) max = p;
  }
  return max;
}

/**
 * GET /verify/:lotId
 * - lot: fiche lot depuis DB (ou null si inconnu)
 * - events: historique HCS (PostgreSQL, ou indexation puis DB)
 * - score: 0–100 selon étapes complétées (HARVEST=25, …, IMPORT=100)
 */
router.get("/:lotId", async (req, res) => {
  const { lotId } = req.params;
  if (!lotId) {
    return res.status(400).json({ error: "lotId requis" });
  }

  try {
    const events = await mirror.getLotHistory(lotId);
    const lot = await prisma.lot.findUnique({
      where: { lotId },
    });
    const score = computeScore(events);

    return res.json({
      lot: lot || null,
      events,
      score,
    });
  } catch (err) {
    console.error("GET /verify/:lotId", err);
    return res.status(500).json({
      error: "Erreur lors de la vérification du lot",
      message: err.message,
    });
  }
});

module.exports = router;
