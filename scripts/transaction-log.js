const MODULE_ID = "pressao-das-profundezas";
const SETTING = "transactionLog.entries";
const MAX_ENTRIES = 1000;
const CORRELATION_MS = 1500;
const COIN_GP = { "platinum-pieces": 10, "gold-pieces": 1, "silver-pieces": 0.1, "copper-pieces": 0.01 };
const quantityBeforeUpdate = new Map();
const moneyBalanceBefore = new Map();
const pendingEvidence = [];

function esc(v){ return foundry.utils.escapeHTML(String(v ?? "")); }
function roundGP(v){ return Math.round((Number(v)+Number.EPSILON)*100)/100; }
function fmtGP(v,{sign=true}={}){ const n=roundGP(v); return `${sign&&n>0?"+":""}${n.toLocaleString("pt-BR",{maximumFractionDigits:2})} gp`; }
function actorFor(item){ return item?.parent?.documentName==="Actor" ? item.parent : null; }
function quantity(item){ return Number(item?.system?.quantity ?? 1); }
function coinUnitGP(item){ return COIN_GP[item?.slug] ?? COIN_GP[item?.system?.slug] ?? null; }
function isCoin(item){ return coinUnitGP(item)!==null; }
function actorMoneyGP(actor){
  if(!actor) return null;
  const items=actor.items?.contents ?? actor.items ?? [];
  let total=0;
  for(const item of items){
    const unit=coinUnitGP(item);
    if(unit!==null) total+=unit*quantity(item);
  }
  return roundGP(total);
}
function rememberMoneyBefore(item){
  const actor=actorFor(item);
  if(actor && isCoin(item) && !moneyBalanceBefore.has(item.uuid)) moneyBalanceBefore.set(item.uuid,actorMoneyGP(actor));
}
function takeMoneyBefore(item){
  const before=moneyBalanceBefore.get(item.uuid);
  moneyBalanceBefore.delete(item.uuid);
  return Number.isFinite(before)?before:null;
}
function itemValueGP(item,qty=quantity(item)){
  if(isCoin(item)) return roundGP(coinUnitGP(item)*qty);
  const price=item?.system?.price?.value; if(!price) return null;
  const c=price.toObject?.() ?? price;
  const total=Number(c.pp??0)*10+Number(c.gp??0)+Number(c.sp??0)/10+Number(c.cp??0)/100;
  return roundGP(total/Math.max(Number(item?.system?.price?.per??1),1)*qty);
}
function sourceId(item){ return item?.sourceId ?? item?.flags?.core?.sourceId ?? null; }
function sceneContext(actor){
  const token=actor?.getActiveTokens?.(true,true)?.[0];
  return token?{scene:token.scene?.name??null,token:token.name??null}:{scene:null,token:null};
}
function actorKind(actor){
  if(!actor) return "unknown";
  if(actor.type==="character") return "character";
  if(actor.type==="party") return "party";
  if(actor.type==="loot"){
    const lootType=actor.system?.lootSheetType ?? actor.system?.details?.lootSheetType ?? actor.system?.lootSheet?.type;
    return String(lootType??"").toLowerCase().includes("merchant") ? "merchant" : "loot";
  }
  return actor.type==="npc" ? "npc" : "other";
}
function classifySource(item){
  const sid=sourceId(item);
  if(!sid) return {type:"unknown",label:"Desconhecida",uuid:null};
  if(sid.startsWith("Compendium.")) return {type:"compendium",label:"Compêndio",uuid:sid};
  return {type:"document",label:"Documento",uuid:sid};
}
function snapshot(item){
  const actor=actorFor(item);
  return {
    itemId:item.id,itemUuid:item.uuid,itemName:item.name,itemType:item.type,
    quantity:quantity(item),valueGP:itemValueGP(item),source:classifySource(item),
    actorId:actor?.id??null,actorUuid:actor?.uuid??null,actorName:actor?.name??null,
    actorKind:actorKind(actor),...sceneContext(actor)
  };
}
function isPlayerFacingKind(kind){ return kind==="character" || kind==="party"; }
function entries(){ return foundry.utils.deepClone(game.settings.get(MODULE_ID,SETTING)??[]); }
async function persist(entry){
  if(!game.user.isGM){ game.socket.emit(`module.${MODULE_ID}`,{type:"transaction-log:add",data:entry}); return; }
  const list=entries();
  list.unshift({id:foundry.utils.randomID(),timestamp:Date.now(),...entry});
  await game.settings.set(MODULE_ID,SETTING,list.slice(0,MAX_ENTRIES));
}
async function clearLog(){
  if(!game.user.isGM) return ui.notifications.warn("Apenas o GM pode limpar o Transaction Log.");
  await game.settings.set(MODULE_ID,SETTING,[]);
  ui.notifications.info("Transaction Log limpo.");
}
function evidenceKey(e){ return `${e.itemName}|${e.quantity}|${e.valueGP}`; }
function sameItem(a,b){ return evidenceKey(a)===evidenceKey(b); }
function oppositeItem(e){
  return pendingEvidence.find(x=>!x.used && x.kind!==e.kind && x.kind!=="money" && sameItem(x,e) && x.actorUuid!==e.actorUuid);
}
function moneyNetFor(actorUuid,sign){
  const parts=pendingEvidence.filter(x=>!x.used && x.kind==="money" && x.actorUuid===actorUuid);
  if(!parts.length) return null;
  const net=roundGP(parts.reduce((sum,x)=>sum+x.moneyGP,0));
  if(!net || Math.sign(net)!==sign) return null;
  const balances=parts.filter(x=>Number.isFinite(x.moneyBeforeGP)&&Number.isFinite(x.moneyAfterGP));
  const first=balances.reduce((a,b)=>a.time<=b.time?a:b,balances[0]);
  const last=balances.reduce((a,b)=>a.time>=b.time?a:b,balances[0]);
  return {parts,net,moneyBeforeGP:first?.moneyBeforeGP??null,moneyAfterGP:last?.moneyAfterGP??null};
}
function consume(...xs){ xs.filter(Boolean).forEach(x=>{x.used=true;}); }
function sourceLabel(e){ return e?.actorName ?? "Desconhecida"; }
function provenanceNode(name,uuid=null,type="actor"){ return {name:name??"Desconhecida",uuid,type}; }
function priorProvenance(actorName,itemName){
  if(!actorName||!itemName) return null;
  const prior=entries().find(x=>x.itemName===itemName && x.actorName===actorName && Array.isArray(x.provenance?.path));
  return prior?.provenance ? foundry.utils.deepClone(prior.provenance) : null;
}
function appendProvenance(provenance,node){
  const p=foundry.utils.deepClone(provenance??{verified:false,path:[]});
  const last=p.path.at(-1);
  if(!last || last.name!==node.name || last.uuid!==node.uuid) p.path.push(node);
  return p;
}
function establishedProvenance(origin,destination,verified=true){
  return {verified,path:[origin,destination].filter(Boolean)};
}
function inheritedProvenance(holderName,itemName,destination){
  const prior=priorProvenance(holderName,itemName);
  return prior ? appendProvenance(prior,destination) : {verified:false,path:[provenanceNode(holderName,null,"unknown"),destination]};
}
function transactionChatContent(entry){
  const amount=entry.moneyGP!=null?`<strong>${fmtGP(entry.moneyGP)}</strong>`:"";
  const value=entry.valueGP!=null?`<div>Valor: ${fmtGP(entry.valueGP,{sign:false})}</div>`:"";
  const source=entry.source?.label?`<div>${entry.type==="purchase"?"Vendedor":entry.type==="sale"?"Comprador":"Origem"}: ${esc(entry.source.label)}</div>`:"";
  const transfer=entry.from&&entry.to?`<div>${esc(entry.from.name)} → ${esc(entry.to.name)}</div>`:"";
  const balance=Number.isFinite(entry.moneyBeforeGP)&&Number.isFinite(entry.moneyAfterGP)
    ? `<div>Saldo: ${fmtGP(entry.moneyBeforeGP,{sign:false})} → ${fmtGP(entry.moneyAfterGP,{sign:false})}</div>`:"";
  const provenance=Array.isArray(entry.provenance?.path)&&entry.provenance.path.length
    ? `<div><strong>Histórico:</strong> ${entry.provenance.path.map(x=>esc(x.name)).join(" → ")}${entry.provenance.verified?"":" ⚠"}</div>`:"";
  return `<div class="pdp-transaction-message"><strong>${esc(entry.title)}</strong> — ${esc(entry.actorName??"—")} ${amount}
    ${entry.itemName?`<div>${esc(entry.itemName)} ×${entry.quantity??1}</div>`:""}${provenance}${value}${source}${transfer}${balance}
    ${entry.scene?`<div>Cena: ${esc(entry.scene)}</div>`:""}<div>${entry.verified?"✓ Verificado":"⚠ Não verificado"}</div></div>`;
}
async function createTransactionChatMessage(entry){
  if(!game.user.isGM) return;
  await ChatMessage.create({
    content:transactionChatContent(entry),
    whisper:ChatMessage.getWhisperRecipients("GM").map(u=>u.id),
    flags:{
      [MODULE_ID]:{transaction:true,type:entry.type,verified:entry.verified??false}
    }
  });
}
async function emitSemantic(entry){
  const semantic={...entry,verified:entry.verified??false};
  await persist(semantic);
  await createTransactionChatMessage(semantic);
}

async function correlate(e){
  if(e.used) return;
  if(e.kind==="money"){
    if(!isPlayerFacingKind(e.actorKind)){ e.used=true; return; }
    const related=pendingEvidence.some(x=>!x.used && x!==e && x.actorUuid===e.actorUuid && x.kind!=="money");
    if(related) return;
    consume(e);
    await emitSemantic({type:"currency-adjustment",title:e.moneyGP>0?"Dinheiro adicionado":"Dinheiro removido",actorName:e.actorName,moneyGP:e.moneyGP,
      moneyBeforeGP:e.moneyBeforeGP,moneyAfterGP:e.moneyAfterGP,verified:false,scene:e.scene,token:e.token});
    return;
  }
  const other=oppositeItem(e);
  if(other){
    const removed=e.kind==="item-removed"?e:other;
    const added=e.kind==="item-acquired"?e:other;
    if(removed.kind!=="item-removed" || added.kind!=="item-acquired") return;

    if(isPlayerFacingKind(removed.actorKind) && isPlayerFacingKind(added.actorKind)){
      consume(removed,added);
      const provenance=inheritedProvenance(removed.actorName,removed.itemName,provenanceNode(added.actorName,added.actorUuid,"character"));
      await emitSemantic({type:"transfer",title:"Item transferido",actorName:added.actorName,itemName:added.itemName,quantity:added.quantity,valueGP:added.valueGP,
        from:{name:removed.actorName,uuid:removed.actorUuid},to:{name:added.actorName,uuid:added.actorUuid},provenance,verified:true,scene:added.scene});
      return;
    }
    if(!isPlayerFacingKind(removed.actorKind) && isPlayerFacingKind(added.actorKind)){
      const paid=moneyNetFor(added.actorUuid,-1);
      consume(removed,added,...(paid?.parts??[]));
      if(removed.actorKind==="merchant"){
        const provenance=establishedProvenance(provenanceNode(sourceLabel(removed),removed.actorUuid,"vendor"),provenanceNode(added.actorName,added.actorUuid,"character"),!!paid);
        await emitSemantic({type:"purchase",title:"Compra",actorName:added.actorName,itemName:added.itemName,quantity:added.quantity,valueGP:added.valueGP,
          moneyGP:paid?.net??null,moneyBeforeGP:paid?.moneyBeforeGP??null,moneyAfterGP:paid?.moneyAfterGP??null,source:{type:"vendor",label:sourceLabel(removed),uuid:removed.actorUuid},provenance,verified:!!paid,scene:added.scene});
      } else {
        const sourceType=removed.actorKind==="npc"?"corpse":"treasure";
        const provenance=establishedProvenance(provenanceNode(sourceLabel(removed),removed.actorUuid,sourceType),provenanceNode(added.actorName,added.actorUuid,"character"),true);
        await emitSemantic({type:"loot",title:"Tesouro obtido",actorName:added.actorName,itemName:added.itemName,quantity:added.quantity,valueGP:added.valueGP,
          source:{type:sourceType,label:sourceLabel(removed),uuid:removed.actorUuid},provenance,verified:true,scene:removed.scene??added.scene});
      }
      return;
    }
    if(isPlayerFacingKind(removed.actorKind) && !isPlayerFacingKind(added.actorKind)){
      const received=moneyNetFor(removed.actorUuid,1);
      consume(removed,added,...(received?.parts??[]));
      if(added.actorKind==="merchant"){
        const provenance=inheritedProvenance(removed.actorName,removed.itemName,provenanceNode(sourceLabel(added),added.actorUuid,"vendor"));
        await emitSemantic({type:"sale",title:"Item vendido",actorName:removed.actorName,itemName:removed.itemName,quantity:removed.quantity,valueGP:removed.valueGP,
          moneyGP:received?.net??null,moneyBeforeGP:received?.moneyBeforeGP??null,moneyAfterGP:received?.moneyAfterGP??null,source:{type:"vendor",label:sourceLabel(added),uuid:added.actorUuid},provenance,verified:!!received,scene:removed.scene});
      }
      return;
    }
    consume(removed,added);
    return;
  }

  if(!isPlayerFacingKind(e.actorKind)){ consume(e); return; }
  consume(e);
  if(e.kind==="item-acquired"){
    const origin=provenanceNode(e.source?.label??"Desconhecida",e.source?.uuid??null,e.source?.type??"unknown");
    const provenance=establishedProvenance(origin,provenanceNode(e.actorName,e.actorUuid,"character"),false);
    await emitSemantic({type:"item-acquired",title:"Aquisição não verificada",actorName:e.actorName,itemName:e.itemName,quantity:e.quantity,valueGP:e.valueGP,
      source:e.source,provenance,verified:false,scene:e.scene,token:e.token});
  } else {
    await emitSemantic({type:"item-removed",title:"Item removido",actorName:e.actorName,itemName:e.itemName,quantity:e.quantity,valueGP:e.valueGP,
      verified:false,scene:e.scene,token:e.token});
  }
}
function queueEvidence(e){
  e.time=Date.now(); e.used=false; pendingEvidence.push(e);
  globalThis.setTimeout(async()=>{
    try{ await correlate(e); }
    finally{
      const cutoff=Date.now()-5000;
      for(let i=pendingEvidence.length-1;i>=0;i--) if(pendingEvidence[i].used || pendingEvidence[i].time<cutoff) pendingEvidence.splice(i,1);
    }
  },CORRELATION_MS);
}
function row(entry){
  const amount=entry.moneyGP!=null?`<strong>${fmtGP(entry.moneyGP)}</strong>`:"";
  const value=entry.valueGP!=null?`<span>Valor: ${fmtGP(entry.valueGP,{sign:false})}</span>`:"";
  const source=entry.source?.label?`<span>${entry.type==="purchase"?"Vendedor":entry.type==="sale"?"Comprador":"Origem"}: ${esc(entry.source.label)}</span>`:"";
  const transfer=entry.from&&entry.to?`<span>${esc(entry.from.name)} → ${esc(entry.to.name)}</span>`:"";
  const balance=Number.isFinite(entry.moneyBeforeGP)&&Number.isFinite(entry.moneyAfterGP)
    ? `<span>Saldo: ${fmtGP(entry.moneyBeforeGP,{sign:false})} → ${fmtGP(entry.moneyAfterGP,{sign:false})}</span>`:"";
  const badge=entry.verified?"✓ Verificado":"⚠ Não verificado";
  const provenance=Array.isArray(entry.provenance?.path)&&entry.provenance.path.length
    ? `<div class="pdp-tx-provenance"><strong>Histórico:</strong> ${entry.provenance.path.map(x=>esc(x.name)).join(" → ")}${entry.provenance.verified?"":" <span title=\"A origem completa não pôde ser confirmada\">⚠</span>"}</div>`:"";
  return `<article class="pdp-tx-row"><header><strong>${esc(entry.title)}</strong><span class="pdp-tx-badge">${badge}</span></header>
    <div>${esc(entry.actorName??"—")} ${amount}</div>
    ${entry.itemName?`<div>${esc(entry.itemName)} ×${entry.quantity??1}</div>`:""}
    ${provenance}
    <footer>${value}${source}${transfer}${balance}${entry.scene?`<span>Cena: ${esc(entry.scene)}</span>`:""}<span>${new Date(entry.timestamp).toLocaleString()}</span></footer></article>`;
}
function renderLog(){
  if(!game.user.isGM) return ui.notifications.warn("O Transaction Log é GM-only nesta versão.");
  const list=entries();
  const content=`<div class="pdp-tx-toolbar"><strong>${list.length} registros</strong><button type="button" data-action="clear">Limpar</button></div>
    <div class="pdp-tx-list">${list.length?list.map(row).join(""):"<p>Nenhuma transação registrada.</p>"}</div>`;
  new Dialog({title:"Transaction Log",content,buttons:{close:{label:"Fechar"}},render:html=>html.find('[data-action="clear"]').on("click",async()=>{
    if(!globalThis.confirm("Limpar todo o Transaction Log?")) return; await clearLog(); html.closest(".app").find(".window-header .close").trigger("click");
  })}).render(true);
}
function itemEvidence(kind,item,qty=quantity(item)){
  const s=snapshot(item); return {kind,...s,quantity:qty,valueGP:itemValueGP(item,qty)};
}
function moneyEvidence(item,deltaQty,moneyBeforeGP=null){
  const actor=actorFor(item);
  return {kind:"money",actorUuid:actor?.uuid,actorName:actor?.name,actorKind:actorKind(actor),
    moneyGP:roundGP(coinUnitGP(item)*deltaQty),moneyBeforeGP,moneyAfterGP:actorMoneyGP(actor),...sceneContext(actor)};
}
Hooks.once("init",()=>game.settings.register(MODULE_ID,SETTING,{name:"Transaction Log Entries",scope:"world",config:false,type:Array,default:[]}));
Hooks.once("ready",()=>{
  game.pressaoDasProfundezas??={};
  game.pressaoDasProfundezas.transactionLog={open:renderLog,clear:clearLog,entries};
  game.socket.on(`module.${MODULE_ID}`,async packet=>{ if(game.user.isGM&&packet?.type==="transaction-log:add") await persist(packet.data); });
});
Hooks.on("preCreateItem",(item,data,options,userId)=>{
  if(userId!==game.user.id||options?.[MODULE_ID]?.ignoreTransactionLog) return;
  rememberMoneyBefore(item);
});
Hooks.on("createItem",(item,options,userId)=>{
  if(userId!==game.user.id||options?.[MODULE_ID]?.ignoreTransactionLog) return;
  if(isCoin(item)) queueEvidence(moneyEvidence(item,quantity(item),takeMoneyBefore(item))); else queueEvidence(itemEvidence("item-acquired",item));
});
Hooks.on("preUpdateItem",(item,changed,options,userId)=>{
  if(userId!==game.user.id||options?.[MODULE_ID]?.ignoreTransactionLog) return;
  if(foundry.utils.getProperty(changed,"system.quantity")!==undefined){
    quantityBeforeUpdate.set(item.uuid,quantity(item));
    rememberMoneyBefore(item);
  }
});
Hooks.on("updateItem",(item,changed,options,userId)=>{
  if(userId!==game.user.id||options?.[MODULE_ID]?.ignoreTransactionLog) return;
  if(foundry.utils.getProperty(changed,"system.quantity")===undefined) return;
  const oldQty=quantityBeforeUpdate.get(item.uuid); quantityBeforeUpdate.delete(item.uuid);
  if(!Number.isFinite(oldQty)) return;
  const delta=quantity(item)-oldQty; if(!delta) return;
  if(isCoin(item)) queueEvidence(moneyEvidence(item,delta,takeMoneyBefore(item)));
  else queueEvidence(itemEvidence(delta>0?"item-acquired":"item-removed",item,Math.abs(delta)));
});
Hooks.on("preDeleteItem",(item,options,userId)=>{
  if(userId!==game.user.id||options?.[MODULE_ID]?.ignoreTransactionLog) return;
  rememberMoneyBefore(item);
});
Hooks.on("deleteItem",(item,options,userId)=>{
  if(userId!==game.user.id||options?.[MODULE_ID]?.ignoreTransactionLog) return;
  if(isCoin(item)) queueEvidence(moneyEvidence(item,-quantity(item),takeMoneyBefore(item))); else queueEvidence(itemEvidence("item-removed",item));
});
