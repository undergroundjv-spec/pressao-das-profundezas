const MODULE_ID = "pressao-das-profundezas";
let transactionViewActive = false;

function esc(v){ return foundry.utils.escapeHTML(String(v ?? "")); }
function fmtGP(v,{sign=true}={}){ const n=Math.round((Number(v)+Number.EPSILON)*100)/100; return `${sign&&n>0?"+":""}${n.toLocaleString("pt-BR",{maximumFractionDigits:2})} gp`; }
function compactRow(entry){
  const amount=entry.moneyGP!=null?`<strong class="pdp-chat-amount">${fmtGP(entry.moneyGP)}</strong>`:"";
  const badge=entry.verified?"✓":"⚠";
  const item=entry.itemName?`<div class="pdp-chat-item">${esc(entry.itemName)} ×${entry.quantity??1}</div>`:"";
  const details=[];
  if(entry.valueGP!=null) details.push(`Valor: ${fmtGP(entry.valueGP,{sign:false})}`);
  if(entry.source?.label) details.push(`${entry.type==="purchase"?"Vendedor":entry.type==="sale"?"Comprador":"Origem"}: ${esc(entry.source.label)}`);
  if(entry.from&&entry.to) details.push(`${esc(entry.from.name)} → ${esc(entry.to.name)}`);
  if(Number.isFinite(entry.moneyBeforeGP)&&Number.isFinite(entry.moneyAfterGP)) details.push(`Saldo: ${fmtGP(entry.moneyBeforeGP,{sign:false})} → ${fmtGP(entry.moneyAfterGP,{sign:false})}`);
  if(entry.scene) details.push(`Cena: ${esc(entry.scene)}`);
  const history=Array.isArray(entry.provenance?.path)&&entry.provenance.path.length
    ? `<div><strong>Histórico:</strong> ${entry.provenance.path.map(x=>esc(x.name)).join(" → ")}${entry.provenance.verified?"":" ⚠"}</div>`:"";
  return `<article class="pdp-chat-row">
    <button type="button" class="pdp-chat-summary" data-action="toggle-entry">
      <span><strong>${esc(entry.title)}</strong><small>${esc(entry.actorName??"—")}</small></span>
      <span class="pdp-chat-right">${amount}<i>${badge}</i></span>
    </button>
    ${item}
    <div class="pdp-chat-details" hidden>${details.map(x=>`<div>${x}</div>`).join("")}${history}<time>${new Date(entry.timestamp).toLocaleString()}</time></div>
  </article>`;
}
function findChat(){
  return document.querySelector("#chat, #chat-log")?.closest(".sidebar-tab") ?? document.querySelector("#chat");
}
function findChatLog(chat){
  return chat?.querySelector("#chat-log, .chat-log, [data-application-part='log'], .chat-scroll");
}
function ensureView(chat){
  let view=chat.querySelector(".pdp-chat-transactions");
  if(!view){
    view=document.createElement("section");
    view.className="pdp-chat-transactions";
    view.hidden=true;
    const log=findChatLog(chat);
    if(log?.parentElement) log.parentElement.insertBefore(view,log);
    else chat.append(view);
  }
  return view;
}
function renderTransactions(chat=findChat()){
  if(!chat) return;
  const view=ensureView(chat);
  const list=game.pressaoDasProfundezas?.transactionLog?.entries?.()??[];
  view.innerHTML=`<div class="pdp-chat-count">${list.length} registros</div><div class="pdp-chat-entries">${list.length?list.map(compactRow).join(""):"<p>Nenhuma transação registrada.</p>"}</div>`;
  view.querySelectorAll('[data-action="toggle-entry"]').forEach(b=>b.addEventListener("click",()=>{
    const d=b.closest(".pdp-chat-row")?.querySelector(".pdp-chat-details"); if(d) d.hidden=!d.hidden;
  }));
}
function setView(mode,chat=findChat()){
  if(!chat) return;
  transactionViewActive=mode==="transactions";
  const log=findChatLog(chat);
  const view=ensureView(chat);
  if(log) log.hidden=transactionViewActive;
  view.hidden=!transactionViewActive;
  chat.classList.toggle("pdp-transactions-active",transactionViewActive);
  chat.querySelectorAll(".pdp-chat-mode").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  if(transactionViewActive) renderTransactions(chat);
}
function installChatTransactions(){
  if(!game.user.isGM) return;
  const chat=findChat(); if(!chat) return;
  if(chat.querySelector(".pdp-chat-modebar")) return;
  const bar=document.createElement("nav");
  bar.className="pdp-chat-modebar";
  bar.innerHTML='<button type="button" class="pdp-chat-mode active" data-mode="chat"><i class="fas fa-comments"></i> Chat</button><button type="button" class="pdp-chat-mode" data-mode="transactions"><i class="fas fa-receipt"></i> Transações</button>';
  const anchor=chat.querySelector("header, .chat-control-icon, #chat-controls, .chat-form");
  if(anchor?.parentElement) anchor.parentElement.insertBefore(bar,anchor);
  else chat.prepend(bar);
  bar.querySelector('[data-mode="chat"]').addEventListener("click",()=>setView("chat",chat));
  bar.querySelector('[data-mode="transactions"]').addEventListener("click",()=>setView("transactions",chat));
  renderTransactions(chat);
}
function refresh(){ if(transactionViewActive) renderTransactions(); }
Hooks.once("ready",()=>globalThis.setTimeout(installChatTransactions,300));
Hooks.on("renderChatLog",()=>globalThis.setTimeout(installChatTransactions,0));
Hooks.on("renderSidebar",()=>globalThis.setTimeout(installChatTransactions,0));
Hooks.on("updateSetting",setting=>{ if(setting.key===`${MODULE_ID}.transactionLog.entries`) refresh(); });
