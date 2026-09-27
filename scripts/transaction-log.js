const MODULE_ID = "pressao-das-profundezas";
const SETTING = "transactionLog.entries";
const MAX_ENTRIES = 1000;
const COIN_GP = { "platinum-pieces": 10, "gold-pieces": 1, "silver-pieces": 0.1, "copper-pieces": 0.01 };
const quantityBeforeUpdate = new Map();

function esc(value) { return foundry.utils.escapeHTML(String(value ?? "")); }
function roundGP(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
function fmtGP(value) {
  const n = roundGP(value);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} gp`;
}
function actorFor(item) { return item?.parent?.documentName === "Actor" ? item.parent : null; }
function quantity(item) { return Number(item?.system?.quantity ?? 1); }
function coinUnitGP(item) { return COIN_GP[item?.slug] ?? COIN_GP[item?.system?.slug] ?? null; }
function isCoin(item) { return coinUnitGP(item) !== null; }
function itemValueGP(item, qty = quantity(item)) {
  if (isCoin(item)) return roundGP(coinUnitGP(item) * qty);
  const price = item?.system?.price?.value;
  if (!price) return null;
  const coins = price.toObject?.() ?? price;
  const total = (Number(coins.pp ?? 0) * 10) + Number(coins.gp ?? 0) + (Number(coins.sp ?? 0) / 10) + (Number(coins.cp ?? 0) / 100);
  const per = Math.max(Number(item?.system?.price?.per ?? 1), 1);
  return roundGP((total / per) * qty);
}
function sourceId(item) { return item?.sourceId ?? item?.flags?.core?.sourceId ?? null; }
function sceneContext(actor) {
  const token = actor?.getActiveTokens?.(true, true)?.[0];
  return token ? { scene: token.scene?.name ?? null, token: token.name ?? null } : { scene: null, token: null };
}
function classifySource(item) {
  const sid = sourceId(item);
  if (!sid) return { type: "unknown", label: "Desconhecida", uuid: null };
  if (sid.startsWith("Compendium.")) return { type: "compendium", label: "Compêndio", uuid: sid };
  if (sid.startsWith("Actor.")) return { type: "actor", label: "Ator/Inventário", uuid: sid };
  return { type: "document", label: "Documento", uuid: sid };
}
function snapshot(item) {
  const actor = actorFor(item);
  return {
    itemId: item.id, itemUuid: item.uuid, itemName: item.name, itemType: item.type,
    quantity: quantity(item), valueGP: itemValueGP(item),
    actorId: actor?.id ?? null, actorUuid: actor?.uuid ?? null, actorName: actor?.name ?? null,
    source: classifySource(item), ...sceneContext(actor)
  };
}
function entries() { return foundry.utils.deepClone(game.settings.get(MODULE_ID, SETTING) ?? []); }
async function saveEntry(entry) {
  if (!game.user.isGM) {
    game.socket.emit(`module.${MODULE_ID}`, { type: "transaction-log:add", data: entry });
    return;
  }
  const list = entries();
  list.unshift({ id: foundry.utils.randomID(), timestamp: Date.now(), ...entry });
  await game.settings.set(MODULE_ID, SETTING, list.slice(0, MAX_ENTRIES));
}
async function clearLog() {
  if (!game.user.isGM) return ui.notifications.warn("Apenas o GM pode limpar o Transaction Log.");
  await game.settings.set(MODULE_ID, SETTING, []);
  ui.notifications.info("Transaction Log limpo.");
}
function row(entry) {
  const amount = entry.moneyGP != null ? `<strong class="${entry.moneyGP >= 0 ? "pdp-tx-positive" : "pdp-tx-negative"}">${fmtGP(entry.moneyGP)}</strong>` : "";
  const value = entry.valueGP != null ? `<span>Valor: ${fmtGP(entry.valueGP).replace("+", "")}</span>` : "";
  const source = entry.source?.label ? `<span>Fonte: ${esc(entry.source.label)}</span>` : "";
  const place = entry.scene ? `<span>Cena: ${esc(entry.scene)}${entry.token ? ` — ${esc(entry.token)}` : ""}</span>` : "";
  const badge = entry.verified ? "✓ Verificado" : "⚠ Não verificado";
  return `<article class="pdp-tx-row">
    <header><strong>${esc(entry.title)}</strong><span class="pdp-tx-badge">${badge}</span></header>
    <div>${esc(entry.actorName ?? "—")} ${amount}</div>
    ${entry.itemName ? `<div>${esc(entry.itemName)}${entry.quantity ? ` ×${entry.quantity}` : ""}</div>` : ""}
    <footer>${value}${source}${place}<span>${new Date(entry.timestamp).toLocaleString()}</span></footer>
  </article>`;
}
function renderLog() {
  if (!game.user.isGM) return ui.notifications.warn("O Transaction Log é GM-only nesta primeira versão.");
  const list = entries();
  const content = `<div class="pdp-tx-toolbar"><strong>${list.length} registros</strong><button type="button" data-action="clear">Limpar</button></div>
    <div class="pdp-tx-list">${list.length ? list.map(row).join("") : "<p>Nenhuma transação registrada.</p>"}</div>`;
  new Dialog({
    title: "Transaction Log",
    content,
    buttons: { close: { label: "Fechar" } },
    render: html => html.find('[data-action="clear"]').on("click", async () => {
      if (!globalThis.confirm("Limpar todo o Transaction Log?")) return;
      await clearLog();
      html.closest(".app").find(".window-header .close").trigger("click");
    })
  }).render(true);
}
function createEntry(item) {
  const s = snapshot(item);
  if (!s.actorUuid) return null;
  if (isCoin(item)) return {
    type: "money", title: "Dinheiro adicionado", actorName: s.actorName,
    moneyGP: itemValueGP(item), verified: false, source: s.source, scene: s.scene, token: s.token
  };
  return { type: "item-acquired", title: "Item adquirido", ...s, verified: false };
}
function deleteEntry(item) {
  const s = snapshot(item);
  if (!s.actorUuid) return null;
  if (isCoin(item)) return {
    type: "money", title: "Dinheiro removido", actorName: s.actorName,
    moneyGP: -itemValueGP(item), verified: false, source: s.source, scene: s.scene, token: s.token
  };
  return { type: "item-removed", title: "Item removido", ...s, verified: false };
}
function updateEntry(item, changed, oldQty) {
  const actor = actorFor(item);
  if (!actor) return null;
  if (foundry.utils.getProperty(changed, "system.quantity") === undefined || !Number.isFinite(oldQty)) return null;
  const newQty = quantity(item);
  const delta = newQty - oldQty;
  if (!delta) return null;
  if (isCoin(item)) return {
    type: "money", title: delta > 0 ? "Dinheiro adicionado" : "Dinheiro removido",
    actorName: actor.name, moneyGP: roundGP(coinUnitGP(item) * delta), verified: false,
    source: classifySource(item), ...sceneContext(actor)
  };
  return {
    type: delta > 0 ? "item-acquired" : "item-removed",
    title: delta > 0 ? "Quantidade adicionada" : "Quantidade removida",
    ...snapshot(item), quantity: Math.abs(delta), valueGP: itemValueGP(item, Math.abs(delta)), verified: false
  };
}
Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING, {
    name: "Transaction Log Entries", scope: "world", config: false, type: Array, default: []
  });
});
Hooks.once("ready", () => {
  game.pressaoDasProfundezas ??= {};
  game.pressaoDasProfundezas.transactionLog = { open: renderLog, clear: clearLog, entries };
  game.socket.on(`module.${MODULE_ID}`, async packet => {
    if (!game.user.isGM || packet?.type !== "transaction-log:add") return;
    await saveEntry(packet.data);
  });
});
Hooks.on("createItem", async (item, options, userId) => {
  if (userId !== game.user.id || options?.[MODULE_ID]?.ignoreTransactionLog) return;
  const entry = createEntry(item);
  if (entry) await saveEntry(entry);
});
Hooks.on("preUpdateItem", (item, changed, options, userId) => {
  if (userId !== game.user.id || options?.[MODULE_ID]?.ignoreTransactionLog) return;
  if (foundry.utils.getProperty(changed, "system.quantity") !== undefined) quantityBeforeUpdate.set(item.uuid, quantity(item));
});
Hooks.on("updateItem", async (item, changed, options, userId) => {
  if (userId !== game.user.id || options?.[MODULE_ID]?.ignoreTransactionLog) return;
  const oldQty = quantityBeforeUpdate.get(item.uuid);
  quantityBeforeUpdate.delete(item.uuid);
  const entry = updateEntry(item, changed, oldQty);
  if (entry) await saveEntry(entry);
});
Hooks.on("deleteItem", async (item, options, userId) => {
  if (userId !== game.user.id || options?.[MODULE_ID]?.ignoreTransactionLog) return;
  const entry = deleteEntry(item);
  if (entry) await saveEntry(entry);
});
