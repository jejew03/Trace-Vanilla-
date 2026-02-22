/**
 * GET /actors/:accountId/role — rôle d'un acteur (table Actor).
 */

const express = require("express");
const { param, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

function handleValidation(req, res) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res.status(400).json({ error: "Validation échouée", details: err.array() });
  }
}

router.get(
  "/:accountId/role",
  [param("accountId").notEmpty().trim()],
  async (req, res) => {
    handleValidation(req, res);
    if (res.headersSent) return;
    const { accountId } = req.params;
    try {
      const actor = await prisma.actor.findUnique({
        where: { hederaAccount: accountId },
        select: { role: true },
      });
      if (!actor) {
        return res.status(404).json({ error: "Acteur non trouvé", accountId });
      }
      return res.json({ role: actor.role });
    } catch (e) {
      console.error("GET /actors/:accountId/role", e);
      return res.status(500).json({ error: "Erreur", message: e.message });
    }
  }
);

module.exports = router;
