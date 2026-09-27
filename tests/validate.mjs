import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("module.json", "utf8"));
const source = fs.readFileSync("scripts/strain.js", "utf8");
const transactionSource = fs.readFileSync("scripts/transaction-log.js", "utf8");

const requiredFiles = ["scripts/strain.js", "scripts/transaction-log.js", "styles/strain.css", "styles/transaction-log.css"];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

if (manifest.id !== "pressao-das-profundezas") throw new Error("Unexpected module id.");
if (manifest.socket !== true) throw new Error("Module socket must be enabled.");
if (manifest.compatibility?.minimum !== "14") throw new Error("Foundry minimum must be 14.");
if (manifest.compatibility?.verified !== "14.367") throw new Error("Foundry verified build must be 14.367.");

const version = source.match(/const VERSION = "([^"]+)"/)?.[1];
if (!version) throw new Error("Could not find VERSION in scripts/strain.js");

// During development the source version may be one patch ahead of module.json.
// Release preparation will make them identical.
if (!transactionSource.includes('transactionLog')) throw new Error("Transaction Log API not found.");
if (!transactionSource.includes('CORRELATION_MS')) throw new Error("Transaction correlation engine not found.");
if (!transactionSource.includes('isPlayerFacingKind')) throw new Error("Player-facing transaction filter not found.");
if (!transactionSource.includes('moneyBeforeGP') || !transactionSource.includes('moneyAfterGP')) throw new Error("Transaction balance snapshots not found.");
if (!transactionSource.includes('priorProvenance') || !transactionSource.includes('pdp-tx-provenance')) throw new Error("Transaction provenance history not found.");
if (!manifest.esmodules?.includes("scripts/transaction-log.js")) throw new Error("Transaction Log script is not loaded by manifest.");
console.log(`Source version: ${version}; manifest version: ${manifest.version}`);
console.log("Module structure and manifest checks passed.");
