const MODULE_ID = "pressao-das-profundezas";

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

function renderTransactions(root){
  if(!root) return;
  const list=game.pressaoDasProfundezas?.transactionLog?.entries?.()??[];
  root.innerHTML=`<div class="pdp-chat-count">${list.length} registros</div><div class="pdp-chat-entries">${list.length?list.map(compactRow).join(""):"<p>Nenhuma transação registrada.</p>"}</div>`;
  root.querySelectorAll('[data-action="toggle-entry"]').forEach(b=>b.addEventListener("click",()=>{
    const d=b.closest(".pdp-chat-row")?.querySelector(".pdp-chat-details"); if(d) d.hidden=!d.hidden;
  }));
}

function activateTransactions(chat){
  const nav=chat.querySelector(".damage-log-nav.tabs");
  const tx=chat.querySelector("#pdp-transaction-log");
  const chatLog=chat.querySelector("#chat-log");
  const damageLog=chat.querySelector("#damage-log");
  if(!nav||!tx||!chatLog) return;
  nav.querySelectorAll(".item").forEach(x=>x.classList.remove("active"));
  nav.querySelector(".pdp-transaction-tab")?.classList.add("active");
  chatLog.style.display="none";
  if(damageLog) damageLog.style.display="none";
  tx.style.display="";
  renderTransactions(tx);
}

function deactivateTransactions(chat){
  const tx=chat.querySelector("#pdp-transaction-log");
  if(tx) tx.style.display="none";
}

function install(chat){
  if(!game.user.isGM) return;
  const nav=chat.querySelector(".damage-log-nav.tabs");
  const chatLog=chat.querySelector("#chat-log");
  if(!nav||!chatLog) return;

  let tx=chat.querySelector("#pdp-transaction-log");
  if(!tx){
    tx=document.createElement("section");
    tx.id="pdp-transaction-log";
    tx.className="pdp-chat-transactions";
    tx.style.display="none";
    chatLog.insertAdjacentElement("afterend",tx);
  }

  let tab=nav.querySelector(".pdp-transaction-tab");
  if(!tab){
    tab=document.createElement("a");
    tab.className="item pdp-transaction-tab";
    tab.textContent="Transações";
    tab.href="#";
    nav.append(tab);
    tab.addEventListener("click",event=>{
      event.preventDefault();
      event.stopPropagation();
      activateTransactions(chat);
    });
  }

  nav.querySelectorAll(".item:not(.pdp-transaction-tab)").forEach(nativeTab=>{
    if(nativeTab.dataset.pdpBound) return;
    nativeTab.dataset.pdpBound="true";
    nativeTab.addEventListener("click",()=>deactivateTransactions(chat),true);
  });
  renderTransactions(tx);
}

function installFromRender(chatTab,html){
  const element=html?.[0] ?? html ?? chatTab?.element;
  const chat=element?.[0] ?? element ?? null;
  if(!chat) return;
  globalThis.setTimeout(()=>install(chat),0);
}

function refresh(){
  document.querySelectorAll("#pdp-transaction-log").forEach(renderTransactions);
}

Hooks.on("renderChatLog",installFromRender);
Hooks.once("ready",()=>globalThis.setTimeout(()=>{
  const chat=document.querySelector("#chat");
  if(chat) install(chat);
},500));
Hooks.on("updateSetting",setting=>{ if(setting.key===`${MODULE_ID}.transactionLog.entries`) refresh(); });
