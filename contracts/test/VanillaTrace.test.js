const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VanillaTrace", function () {
  let vanillaTrace;
  let owner;
  let farmer;
  let other;

  const Role = { NONE: 0, FARMER: 1, DRYER: 2, EXPORTER: 3, IMPORTER: 4, ADMIN: 5 };
  const Step = { HARVEST: 0, DRYING: 1, PACKAGING: 2, EXPORT: 3, IMPORT: 4 };

  beforeEach(async function () {
    [owner, farmer, other] = await ethers.getSigners();
    const VanillaTrace = await ethers.getContractFactory("VanillaTrace");
    vanillaTrace = await VanillaTrace.deploy();
  });

  describe("setRole", function () {
    it("assigne bien un rôle à une adresse", async function () {
      expect(await vanillaTrace.roles(farmer.address)).to.equal(Role.NONE);
      await vanillaTrace.setRole(farmer.address, Role.FARMER);
      expect(await vanillaTrace.roles(farmer.address)).to.equal(Role.FARMER);
    });

    it("échoue si l'appelant n'est pas admin", async function () {
      await expect(
        vanillaTrace.connect(farmer).setRole(other.address, Role.DRYER)
      ).to.be.revertedWith("Not admin");
    });
  });

  describe("attestStep", function () {
    beforeEach(async function () {
      await vanillaTrace.setRole(farmer.address, Role.FARMER);
    });

    it("réussit si le rôle est autorisé pour l'étape (FARMER + HARVEST)", async function () {
      const lotRef = ethers.keccak256(ethers.toUtf8Bytes("0.0.123456-1"));
      const eventHash = ethers.keccak256(ethers.toUtf8Bytes("event-data"));
      await expect(
        vanillaTrace.connect(farmer).attestStep(lotRef, Step.HARVEST, eventHash)
      ).to.emit(vanillaTrace, "StepAttested");
    });

    it("échoue si le rôle n'est pas autorisé (FARMER + DRYING)", async function () {
      const lotRef = ethers.keccak256(ethers.toUtf8Bytes("0.0.123456-1"));
      const eventHash = ethers.keccak256(ethers.toUtf8Bytes("event-data"));
      await expect(
        vanillaTrace.connect(farmer).attestStep(lotRef, Step.DRYING, eventHash)
      ).to.be.revertedWith("Step not allowed for role");
    });
  });

  describe("getAttestations", function () {
    it("retourne bien les attestations d'un lot", async function () {
      await vanillaTrace.setRole(farmer.address, Role.FARMER);
      const lotRef = ethers.keccak256(ethers.toUtf8Bytes("lot-1"));
      const eventHash = ethers.keccak256(ethers.toUtf8Bytes("hash1"));
      await vanillaTrace.connect(farmer).attestStep(lotRef, Step.HARVEST, eventHash);

      const atts = await vanillaTrace.getAttestations(lotRef);
      expect(atts.length).to.equal(1);
      expect(atts[0].actor).to.equal(farmer.address);
      expect(atts[0].step).to.equal(Step.HARVEST);
      expect(atts[0].eventHash).to.equal(eventHash);
    });
  });

  describe("isStepAllowed", function () {
    it("retourne true quand le rôle est autorisé pour l'étape", async function () {
      await vanillaTrace.setRole(farmer.address, Role.FARMER);
      expect(await vanillaTrace.isStepAllowed(farmer.address, Step.HARVEST)).to.be.true;
    });

    it("retourne false quand le rôle n'est pas autorisé pour l'étape", async function () {
      await vanillaTrace.setRole(farmer.address, Role.FARMER);
      expect(await vanillaTrace.isStepAllowed(farmer.address, Step.DRYING)).to.be.false;
    });

    it("retourne false pour une adresse sans rôle", async function () {
      expect(await vanillaTrace.isStepAllowed(other.address, Step.HARVEST)).to.be.false;
    });
  });
});
