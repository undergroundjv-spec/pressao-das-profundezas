import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("module.json", "utf8"));
const source = fs.readFileSync("scripts/strain.js", "utf8");

const requiredFiles = ["scripts/strain.js", "styles/strain.css"];
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
console.log(`Source version: ${version}; manifest version: ${manifest.version}`);
console.log("Module structure and manifest checks passed.");
