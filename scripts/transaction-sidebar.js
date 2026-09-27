const MODULE_ID = "pressao-das-profundezas";
function esc(v){ return foundry.utils.escapeHTML(String(v ?? "")); }
function fmtGP(v,{sign=true}={}){ const n=Math.round((Number(v)+Number.EPSILON)*100)/100; return `${sign&&n>0?"+":""}${n.toLocaleString("pt-BR",{maximumFractionDigits:2})} gp`; }
function compactRow(entry){
  const amount=entry.moneyGP!=null?`<strong class="pdp-sidebar-amount">${fmtGP(entry.moneyGP)}</strong>`:"";
  const badge=entry.verified?"✓":"⚠";
  const item=entry.itemName?`<div class="pdp-sidebar-item">${esc(entry.itemName)} ×${entry.quantity??1}</div>`:"";
  const details=[];
  if(entry.valueGP!=null) details.push(`Valor: ${fmtGP(entry.valueGP,{sign:false})}`);
  if(entry.source?.label) details.push(`${entry.type==="purchase"?"Vendedor":entry.type==="sale"?"Comprador":"Origem"}: ${esc(entry.source.label)}`);
  if(entry.from&&entry.to) details.push(`${esc(entry.from.name)} → ${esc(entry.to.name)}`);
  if(Number.isFinite(entry.moneyBeforeGP)&&Number.isFinite(entry.moneyAfterGP)) details.push(`Saldo: ${fmtGP(entry.moneyBeforeGP,{sign:false})} → ${fmtGP(entry.moneyAfterGP,{sign:false})}`);
  if(entry.scene) details.push(`Cena: ${esc(entry.scene)}`);
  const history=Array.isArray(entry.provenance?.path)&&entry.provenance.path.length
    ? `<div><strong>Histórico:</strong> ${entry.provenance.path.map(x=>esc(x.name)).join(" → ")}${entry.provenance.verified?"":" ⚠"}</div>`:"";
  return `<article class="pdp-sidebar-row" data-entry-id="${esc(entry.id)}">
    <button type="button" class="pdp-sidebar-summary" data-action="toggle-entry">
      <span><strong>${esc(entry.title)}</strong><small>${esc(entry.actorName??"—")}</small></span>
      <span class="pdp-sidebar-right">${amount}<i>${badge}</i></span>
    </button>
    ${item}
    <div class="pdp-sidebar-details" hidden>
      ${details.map(x=>`<div>${x}</div>`).join("")}
      ${history}
      <time>${new Date(entry.timestamp).toLocaleString()}</time>
    </div>
  </article>`;
}
function renderInto(root){
  if(!root) return;
  const all=game.pressaoDasProfundezas?.transactionLog?.entries?.()??[];
  const list=all;
  root.innerHTML=`<div class="pdp-sidebar-log">
    <div class="pdp-sidebar-count">${list.length} registros</div>
    <div class="pdp-sidebar-entries">${list.length?list.map(compactRow).join(""):"<p class=\"pdp-sidebar-empty\">Nenhuma transação registrada.</p>"}</div>
  </div>`;
  root.querySelectorAll('[data-action="toggle-entry"]').forEach(b=>b.addEventListener("click",()=>{
    const details=b.closest(".pdp-sidebar-row")?.querySelector(".pdp-sidebar-details");
    if(details) details.hidden=!details.hidden;
  }));
}
function sidebarRoot(){ return document.querySelector("#pdp-transaction-log-sidebar .pdp-sidebar-content"); }
function refresh(){ const root=sidebarRoot(); if(root) renderInto(root); }
function deactivateTransactionLog(){
  const tab=document.querySelector('[data-tab="pdp-transaction-log"]');
  const panel=document.querySelector("#pdp-transaction-log-sidebar");
  tab?.classList.remove("active");
  panel?.classList.remove("active");
}
function activateTransactionLog(event){
  event?.preventDefault?.();
  event?.stopPropagation?.();
  event?.stopImmediatePropagation?.();
  const tab=document.querySelector('[data-tab="pdp-transaction-log"]');
  const panel=document.querySelector("#pdp-transaction-log-sidebar");
  if(!tab||!panel) return;
  document.querySelectorAll("#sidebar-tabs .item").forEach(x=>x.classList.remove("active"));
  tab.classList.add("active");
  panel.classList.add("active");
  renderInto(panel.querySelector(".pdp-sidebar-content"));
}
function installSidebar(){
  if(!game.user.isGM) return;
  const tabs=document.querySelector("#sidebar-tabs");
  const sidebar=document.querySelector("#sidebar");
  if(!tabs||!sidebar) return;
  let tab=document.querySelector('[data-tab="pdp-transaction-log"]');
  let panel=document.querySelector("#pdp-transaction-log-sidebar");
  if(!tab){
    tab=document.createElement("a");
    tab.className="item pdp-transaction-tab";
    tab.dataset.tab="pdp-transaction-log";
    tab.dataset.tooltip="Transaction Log";
    tab.setAttribute("aria-label","Transaction Log");
    tab.innerHTML='<i class="fas fa-receipt"></i>';
    tabs.append(tab);
    tab.addEventListener("pointerdown",activateTransactionLog,true);
    tab.addEventListener("click",activateTransactionLog,true);
  }
  if(!panel){
    panel=document.createElement("section");
    panel.id="pdp-transaction-log-sidebar";
    panel.className="pdp-sidebar-overlay";
    panel.innerHTML='<header class="pdp-sidebar-header"><h2><i class="fas fa-receipt"></i> Transaction Log</h2><button type="button" data-action="close-log" aria-label="Fechar"><i class="fas fa-times"></i></button></header><div class="pdp-sidebar-content"></div>';
    sidebar.append(panel);
    panel.querySelector('[data-action="close-log"]').addEventListener("click",deactivateTransactionLog);
    renderInto(panel.querySelector(".pdp-sidebar-content"));
  }
  tabs.querySelectorAll(".item:not(.pdp-transaction-tab)").forEach(nativeTab=>{
    if(nativeTab.dataset.pdpCloseBound) return;
    nativeTab.dataset.pdpCloseBound="true";
    nativeTab.addEventListener("pointerdown",deactivateTransactionLog,true);
  });
}
Hooks.once("ready",()=>globalThis.setTimeout(installSidebar,250));
Hooks.on("renderSidebar",()=>globalThis.setTimeout(installSidebar,0));
Hooks.on("updateSetting",setting=>{ if(setting.key===`${MODULE_ID}.transactionLog.entries`) refresh(); });
