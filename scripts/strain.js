const MODULE_ID = "pressao-das-profundezas";
const TOOLBELT = "pf2e-toolbelt";
const RESOURCE_SETTING = "resourceTracker.worldResources";
const VERSION = "0.8.3";

const LABELS = {
  fortitude:"Fortitude", reflex:"Reflexos", will:"Vontade", perception:"Percepção",
  athletics:"Atletismo", acrobatics:"Acrobacia", survival:"Sobrevivência",
  religion:"Religião", occultism:"Ocultismo", society:"Sociedade", medicine:"Medicina",
  stealth:"Furtividade", arcana:"Arcana", crafting:"Ofício", diplomacy:"Diplomacia",
  initiative:"Iniciativa"
};

const EVENTS = {
  1:["Pressão Sufocante",["fortitude","athletics","survival"]],
  2:["Sussurros nas Paredes",["will","religion","occultism"]],
  3:["Terreno Instável",["reflex","acrobatics","athletics"]],
  4:["Ecos Enganosos",["perception","society","occultism"]],
  5:["Ar Estagnado",["fortitude","medicine","survival"]],
  6:["Sombras Inquietas",["reflex","stealth","acrobatics"]],
  7:["Mau Presságio",["will","religion","society"]],
  8:["A Masmorra Observa",["perception","stealth","survival"]],
  9:["Influência Crescente",["fortitude","religion","occultism"]],
  10:["Memórias Intrusas",["will","society","occultism"]],
  11:["Ressonância Hostil",["reflex","arcana","crafting"]],
  12:["A Masmorra Aprende",["perception","survival","stealth"]],
  13:["Pulso das Profundezas",["fortitude","medicine","athletics"]],
  14:["Silêncio Absoluto",["will","survival","religion"]],
  15:["Presença Dominante",["reflex","acrobatics","occultism"]],
  16:["Caminhos Impossíveis",["perception","survival","society"]],
  17:["Olhos na Escuridão",["reflex","stealth","acrobatics"]],
  18:["Presságio de Desastre",["will","religion","diplomacy"]],
  19:["Pressão das Profundezas",["fortitude","athletics","medicine"]],
  20:["Desespero",["perception","religion","occultism"]]
};


const FAILURE_FLAVOR = {
  1:"O ar parece ficar mais pesado a cada respiração. Por um instante, seu peito se recusa a acompanhar o ritmo — e as profundezas cobram seu preço.",
  2:"Os sussurros finalmente encontram uma brecha. Entre palavras impossíveis de compreender, você tem a perturbadora certeza de ouvir seu próprio nome.",
  3:"Pedras cedem sob seus pés e o chão se desloca inesperadamente. O lugar parece rejeitar sua presença.",
  4:"Um som próximo faz você reagir — passos, talvez uma voz. Quando percebe o engano, resta apenas silêncio... e a sensação de que algo aprendeu como chamar sua atenção.",
  5:"O ar velho das profundezas invade seus pulmões. Cada inspiração exige esforço, e até descansar começa a parecer exaustivo.",
  6:"Uma sombra se move onde nenhuma luz mudou. Quando você olha novamente, ela desapareceu — mas estava definitivamente mais perto.",
  7:"Um pensamento indesejado se instala em sua mente: vocês não deveriam estar aqui. Pior ainda, por alguns segundos ele parece inteiramente racional.",
  8:"Você sente um olhar sobre si e procura sua origem. Não encontra ninguém. Ainda assim, a sensação permanece: alguma coisa sabe exatamente onde vocês estão.",
  9:"Algo invisível parece penetrar lentamente seus pensamentos e músculos. Resistir exige esforço — como se as próprias profundezas tentassem deixar uma marca em você.",
  10:"Uma lembrança surge sem aviso. Por alguns instantes ela parece sua... até que você percebe que jamais viveu aquilo.",
  11:"Uma vibração percorre pedra, metal e ossos ao mesmo tempo. Seus equipamentos tremem e seus dentes rangem enquanto a masmorra parece pulsar ao seu redor.",
  12:"Aquilo que antes parecia aleatório começa a se repetir de maneira familiar demais. As profundezas não estão apenas reagindo à sua presença — estão aprendendo com vocês.",
  13:"Um pulso grave atravessa o chão. Depois outro. Por alguns segundos, é impossível afastar a impressão de que vocês estão descansando dentro de algo vivo.",
  14:"Todos os sons desaparecem de uma vez. Respiração, equipamentos, até seus próprios movimentos parecem abafados. Então o mundo retorna com um único pensamento: alguma coisa estava escutando.",
  15:"Uma presença esmagadora invade o ambiente. Você não consegue vê-la, mas seu corpo reage antes de sua mente — algo aqui exige submissão.",
  16:"Por um instante, a passagem pela qual vocês vieram parece diferente. Ângulos não se encaixam, distâncias parecem erradas... e então tudo volta ao normal.",
  17:"Dois pontos surgem na escuridão. Depois quatro. Depois muitos. Quando a luz alcança o local, não há nada ali — mas você sabe que alguma coisa estava olhando de volta.",
  18:"Uma certeza terrível surge sem explicação: algo ruim está prestes a acontecer. Você não sabe quando, nem de onde virá — apenas que as profundezas ainda não terminaram com vocês.",
  19:"O peso acumulado da masmorra finalmente se torna insuportável. Dor, exaustão e paranoia se misturam enquanto as profundezas parecem apertar suas garras ao redor de vocês.",
  20:"Por um breve instante, continuar parece inútil. A saída parece distante demais, os perigos numerosos demais — e uma pequena parte de você simplesmente quer desistir."
};

const CONSEQUENCES = {
1:[
{name:"Ferimento Leve",text:"O personagem sofre [[/r 1d8]] de dano.",kind:"roll"},
{name:"Equipamento Arranhado",text:"Um equipamento apropriado perde [[/r 1d6]] HP.",kind:"roll"},
{name:"Distraído",text:"–1 de circunstância na próxima Iniciativa.",kind:"effect",selector:"initiative",value:-1},
{name:"Sentidos Perturbados",text:"–1 de circunstância no próximo teste de Percepção.",kind:"effect",selector:"perception",value:-1},
{name:"Trabalho Prejudicado",text:"–1 de circunstância no próximo teste de perícia.",kind:"effect",selector:"skill-check",value:-1}],
2:[
{name:"Ferimento",text:"O personagem sofre [[/r 2d8]] de dano.",kind:"roll"},
{name:"Equipamento Danificado",text:"Um equipamento apropriado perde [[/r 2d6]] HP.",kind:"roll"},
{name:"Mau Presságio",text:"Começa o próximo encontro com Frightened 1.",kind:"queued"},
{name:"Reação Lenta",text:"–2 de circunstância na próxima Iniciativa.",kind:"effect",selector:"initiative",value:-2},
{name:"Atenção Dividida",text:"–2 de circunstância no próximo teste de Percepção.",kind:"effect",selector:"perception",value:-2},
{name:"Trabalho Prejudicado",text:"–2 de circunstância no próximo teste de perícia.",kind:"effect",selector:"skill-check",value:-2}],
3:[
{name:"Ferimento Grave",text:"O personagem sofre [[/r 3d8]] de dano.",kind:"roll"},
{name:"Equipamento Comprometido",text:"Um equipamento apropriado perde [[/r 3d6]] HP.",kind:"roll"},
{name:"Nervos à Flor da Pele",text:"Começa o próximo encontro com Frightened 1 + Sickened 1.",kind:"queued"},
{name:"Guarda Baixa",text:"Off-Guard até o início do primeiro turno no próximo encontro.",kind:"queued"},
{name:"Resposta Lenta",text:"Slowed 1 durante o primeiro turno do próximo encontro.",kind:"queued"},
{name:"Exaustão das Profundezas",text:"Ganha Fatigued.",kind:"condition",condition:"fatigued"},
{name:"Foco Interrompido",text:"Se estava Refocusing, não recupera 1 Focus Point.",kind:"manual"},
{name:"Tratamento Prejudicado",text:"Imune a Treat Wounds por 1 hora.",kind:"manual"},
{name:"Exploração Prejudicada",text:"–2 de circunstância no próximo teste de perícia.",kind:"effect",selector:"skill-check",value:-2}],
4:[
{name:"Ferimento Crítico",text:"O personagem sofre [[/r 4d8]] de dano.",kind:"roll"},
{name:"Equipamento Severamente Danificado",text:"Um equipamento apropriado perde [[/r 4d6]] HP.",kind:"roll"},
{name:"Foco Drenado",text:"Perde 1 Focus Point; se estava Refocusing, em vez disso não recupera esse Focus Point.",kind:"manual"},
{name:"Tratamento Bloqueado",text:"Imune a Treat Wounds por 1 hora.",kind:"manual"},
{name:"Medicina de Combate Exaurida",text:"Imune a Battle Medicine por 1 hora.",kind:"manual"},
{name:"Terror Crescente",text:"Começa o próximo encontro com Frightened 2 + Sickened 1.",kind:"queued"},
{name:"Resposta Comprometida",text:"Slowed 1 durante o primeiro turno do próximo encontro.",kind:"queued"},
{name:"Guarda Baixa",text:"Off-Guard até o fim do primeiro turno no próximo encontro.",kind:"queued"},
{name:"Exaustão Esmagadora",text:"Ganha Fatigued.",kind:"condition",condition:"fatigued"}]
};

const LEVEL_DC = {0:14,1:15,2:16,3:18,4:19,5:20,6:22,7:23,8:24,9:26,10:27,11:28,12:30,13:31,14:32,15:34,16:35,17:36,18:38,19:39,20:40,21:42,22:44,23:46,24:48,25:50};

let activeRest = null;
let socketReady = false;

function esc(s){ return foundry.utils.escapeHTML(String(s ?? "")); }
function randomUnique(array,count){const p=[...array],r=[];while(p.length&&r.length<count)r.push(p.splice(Math.floor(Math.random()*p.length),1)[0]);return r;}
function partyCharacters(){const p=game.actors.filter(a=>a.type==="character"&&a.hasPlayerOwner);return p.length?p:game.actors.filter(a=>a.type==="character");}
function selectedCharacterActors(){const m=new Map();for(const t of canvas?.tokens?.controlled??[]){if(t.actor?.type==="character")m.set(t.actor.uuid,t.actor);}return [...m.values()];}
function consequenceButton(c){if(c.kind==="roll"||c.kind==="manual")return "";const label=c.kind==="queued"?"Preparar no Token Selecionado":"Aplicar ao Token Selecionado";return `<button class="pdp-effect" data-consequence="${encodeURIComponent(JSON.stringify(c))}"><i class="fas fa-bolt"></i> ${label}</button>`;}
function requiredProgress(minutes){ return Math.max(Math.floor(minutes/10)-1,0); }
function penaltyFor(n){ return [1,-1,-3,-5][n-1] ?? -6; }
function getResources(){ return game.settings.get(TOOLBELT, RESOURCE_SETTING) ?? []; }
function getResource(name){ return getResources().find(r=>r.name===name); }

async function changeResource(name, amount){
  const resources = foundry.utils.deepClone(getResources());
  const r = resources.find(x=>x.name===name);
  if(!r) throw new Error(`Resource "${name}" não encontrado.`);
  const oldValue=Number(r.value??0);
  r.value=Math.max(Number(r.min??0),Math.min(Number(r.max??999),oldValue+amount));
  await game.settings.set(TOOLBELT, RESOURCE_SETTING, resources);
  return {oldValue,newValue:r.value};
}

function getStatistic(actor, slug){
  const s=actor.getStatistic?.(slug);
  if(s) return s;
  if(["fortitude","reflex","will"].includes(slug)) return actor.saves?.[slug] ?? null;
  if(slug==="perception") return actor.perception ?? null;
  return actor.skills?.[slug] ?? null;
}

function normalizeDegree(v){
  if(typeof v==="number") return ({0:"criticalFailure",1:"failure",2:"success",3:"criticalSuccess"})[v] ?? null;
  if(v==null) return null;
  const t=String(v).toLowerCase().replaceAll(" ","").replaceAll("-","").replaceAll("_","");
  return ({criticalsuccess:"criticalSuccess",success:"success",failure:"failure",criticalfailure:"criticalFailure"})[t] ?? null;
}

function makeModifier(value,n){
  if(!value) return [];
  const data={label:`Pressão das Profundezas — Teste ${n}`,modifier:value,type:"untyped"};
  const C=game.pf2e?.Modifier ?? CONFIG.PF2E?.Modifier;
  try { return C ? [new C(data)] : [data]; } catch { return [data]; }
}

async function rollStatistic(actor, slug, penalty, eventName, n){
  const statistic=getStatistic(actor,slug);
  if(!statistic) throw new Error(`${actor.name} não possui ${slug}.`);
  const level=Number(actor.level ?? actor.system?.details?.level?.value ?? 0);
  const dc=LEVEL_DC[level];
  if(dc===undefined) throw new Error(`DC não configurada para nível ${level}.`);
  let cbOutcome=null, cbMessage=null;
  const result=await statistic.roll({
    dc:{value:dc},
    modifiers:makeModifier(penalty,n),
    label:`${eventName} — ${LABELS[slug]??slug}`,
    callback:(roll,outcome,message)=>{ cbOutcome=outcome??null; cbMessage=message??null; }
  });
  return normalizeDegree(cbOutcome ?? result?.degreeOfSuccess ?? result?.outcome ?? cbMessage?.flags?.pf2e?.context?.outcome);
}

function playerActor(){
  if(game.user.isGM){
    const selected=(canvas?.tokens?.controlled??[]).filter(t=>t.actor?.type==="character");
    if(selected.length===1) return selected[0].actor;
    if(selected.length>1) ui.notifications.warn("Selecione apenas um token de personagem para rolar o teste de Strain.");
    else ui.notifications.warn("Selecione um token de personagem para rolar o teste de Strain.");
    return null;
  }
  const char=game.user.character;
  if(char?.type==="character") return char;
  const owned=canvas?.tokens?.placeables?.map(t=>t.actor).filter(a=>a?.type==="character" && a.isOwner) ?? [];
  return owned.length===1 ? owned[0] : null;
}

async function createPenaltyEffect(actor,name,selector,value){
 const skills=["acrobatics","arcana","athletics","crafting","deception","diplomacy","intimidation","medicine","nature","occultism","performance","religion","society","stealth","survival","thievery"];
 const resolved=selector==="skill-check"?skills:selector;
 return actor.createEmbeddedDocuments("Item",[{name:`Strain — ${name}`,type:"effect",img:"icons/svg/downgrade.svg",system:{description:{value:"<p>Penalidade de Strain para o próximo teste afetado.</p>"},level:{value:1},duration:{value:-1,unit:"unlimited",sustained:false,expiry:null},tokenIcon:{show:true},unidentified:false,start:{value:0,initiative:null},badge:null,rules:[{key:"FlatModifier",selector:resolved,type:"circumstance",value,label:`Strain — ${name}`,removeAfterRoll:"if-enabled"}],slug:null,traits:{value:[],rarity:"common",otherTags:[]}}}]);
}
async function createQueuedEffect(actor,c){
 let queue={};
 if(c.name==="Mau Presságio") queue={trigger:"combatStart",frightened:1};
 else if(c.name==="Nervos à Flor da Pele") queue={trigger:"combatStart",frightened:1,sickened:1};
 else if(c.name==="Terror Crescente") queue={trigger:"combatStart",frightened:2,sickened:1};
 else if(c.name==="Resposta Lenta"||c.name==="Resposta Comprometida") queue={trigger:"combatStart",slowed:1,remove:"turnEnd"};
 else if(c.name==="Guarda Baixa" && c.text.includes("início")) queue={trigger:"combatStart",offGuard:true,remove:"turnStart"};
 else if(c.name==="Guarda Baixa") queue={trigger:"combatStart",offGuard:true,remove:"turnEnd"};
 return actor.createEmbeddedDocuments("Item",[{name:`Strain — Próximo Encontro — ${c.name}`,type:"effect",img:"icons/svg/clockwork.svg",
  system:{description:{value:`<p>${c.text}</p><p><strong>Pendente:</strong> será processado automaticamente no próximo encontro.</p>`},level:{value:1},duration:{value:-1,unit:"unlimited",sustained:false,expiry:null},tokenIcon:{show:true},unidentified:false,start:{value:0,initiative:null},badge:null,rules:[],slug:null,traits:{value:[],rarity:"common",otherTags:[]}},
  flags:{[MODULE_ID]:{queuedConsequence:{...c,...queue}}}}]);
}
async function setConditionValue(actor,slug,value){
 if(!value)return;
 const current=actor.conditions?.bySlug?.(slug);
 const cur=Number(current?.value??current?.system?.value?.value??0);
 for(let i=cur;i<value;i++) await actor.increaseCondition(slug);
}
async function tempEffect(actor,name,rules,remove,combat,combatant){
 return actor.createEmbeddedDocuments("Item",[{name,type:"effect",img:"icons/svg/aura.svg",
  system:{description:{value:"<p>Efeito temporário de Strain.</p>"},level:{value:1},duration:{value:-1,unit:"unlimited",sustained:false,expiry:null},tokenIcon:{show:true},unidentified:false,start:{value:0,initiative:null},badge:null,rules,slug:null,traits:{value:[],rarity:"common",otherTags:[]}},
  flags:{[MODULE_ID]:{temporary:{remove,combatId:combat.id,combatantId:combatant.id}}}}]);
}
async function deleteTemps(actor,combatId,combatantId,remove){
 const ids=actor.itemTypes.effect.filter(e=>{const t=e.flags?.[MODULE_ID]?.temporary;return t?.combatId===combatId&&t?.combatantId===combatantId&&t?.remove===remove}).map(e=>e.id);
 if(ids.length) await actor.deleteEmbeddedDocuments("Item",ids);
}
async function processCombatStart(combat){
 if(!game.user.isGM)return;
 for(const cb of combat.combatants){
  const actor=cb.actor;if(!actor)continue;
  const effects=actor.itemTypes.effect.filter(e=>e.flags?.[MODULE_ID]?.queuedConsequence?.trigger==="combatStart");
  for(const e of effects){
   const q=e.flags[MODULE_ID].queuedConsequence;
   if(q.frightened) await setConditionValue(actor,"frightened",q.frightened);
   if(q.sickened) await setConditionValue(actor,"sickened",q.sickened);
   if(q.slowed){
     await setConditionValue(actor,"slowed",q.slowed);
     const slowed=actor.conditions?.bySlug?.("slowed");
     if(slowed) await slowed.setFlag(MODULE_ID,"temporary",{combatId:combat.id,combatantId:cb.id,remove:"turnEnd"});
   }
   if(q.offGuard){
     await tempEffect(actor,"Strain — Guarda Baixa",
       [{key:"RollOption",domain:"all",option:"self:condition:off-guard"}],
       q.remove,combat,cb);
   }
   await actor.deleteEmbeddedDocuments("Item",[e.id]);
  }
 }
}
async function cleanupAtTurnStart(combat,cb){
 if(!game.user.isGM||!cb?.actor)return;
 await deleteTemps(cb.actor,combat.id,cb.id,"turnStart");
}
async function cleanupAtTurnEnd(combat,cb){
 if(!game.user.isGM||!cb?.actor)return;
 const actor=cb.actor;
 await deleteTemps(actor,combat.id,cb.id,"turnEnd");
 const slowed=actor.conditions?.bySlug?.("slowed");
 const temp=slowed?.getFlag?.(MODULE_ID,"temporary");
 if(slowed && temp?.combatId===combat.id && temp?.combatantId===cb.id && temp?.remove==="turnEnd"){
   await actor.decreaseCondition("slowed");
 }
}

async function gmFailure(data){
 if(!game.user.isGM)return; const actor=await fromUuid(data.actorUuid); if(!actor)return;
 let vp={oldValue:"?",newValue:"?"},sc={oldValue:data.strain,newValue:Math.min(data.strain+1,4)};
 try{vp=await changeResource("Villain Point",1);}catch(e){console.error(e)} try{sc=await changeResource("Strain",1);}catch(e){console.error(e)}
 const severity=data.degree==="criticalFailure"?Math.min(data.strain+1,4):data.strain;
 const flavor=FAILURE_FLAVOR[data.eventNo]??"As profundezas cobram seu preço.";
 const extra=data.degree==="criticalFailure"?`<p><em>Desta vez, as profundezas não apenas resistem. Elas deixam algo para trás.</em></p>`:"";
 await ChatMessage.create({content:`<h2>${data.degree==="criticalFailure"?"Falha Crítica":"Falha"} — ${esc(data.eventName)}</h2><p><em>${esc(flavor)}</em></p>${extra}<p><strong>${esc(actor.name)}</strong> sucumbe à pressão das profundezas.</p><p><strong>Strain</strong>: ${sc.oldValue} → ${sc.newValue}<br><strong>Villain Point</strong>: ${vp.oldValue} → ${vp.newValue}</p>`});
 const count=severity>=3?2:1, targets=randomUnique(partyCharacters(),count), consequences=randomUnique(CONSEQUENCES[severity]??[],count);
 const rows=targets.map((t,i)=>{const c=consequences[i];return `<div class="pdp-consequence"><h3>🎲 Alvo sorteado: ${esc(t.name)}</h3><p><strong>${esc(c.name)}</strong><br>${c.text}</p>${consequenceButton(c)}${c.kind==="manual"?'<p><em>Aplicação manual pelo GM.</em></p>':""}</div>`}).join("<hr>");
 const hist=data.history.map(h=>`<li>Teste ${h.n}: <strong>${({criticalSuccess:"Sucesso Crítico",success:"Sucesso",failure:"Falha",criticalFailure:"Falha Crítica"})[h.degree]}</strong> (${h.penalty>=0?"+":""}${h.penalty})</li>`).join("");
 await ChatMessage.create({whisper:game.users.filter(u=>u.isGM).map(u=>u.id),content:`<h2>Consequências — Strain ${severity}</h2><p><strong>Evento:</strong> ${esc(data.eventName)}<br><strong>Teste:</strong> ${LABELS[data.check]??data.check}</p><h3>Rolagens</h3><ul>${hist}</ul><hr><p><em>Alvos e consequências sorteados. Selecione o token desejado antes de aplicar um efeito.</em></p>${rows}`});
 activeRest=null;
}

async function gmSuccess(data){
  if(!game.user.isGM) return;
  const actor=await fromUuid(data.actorUuid);
  await ChatMessage.create({content:`<h2>Pressão Superada</h2><p><strong>${esc(actor?.name??"Personagem")}</strong> superou <strong>${esc(data.eventName)}</strong>.</p>
  <p>Progresso: <strong>${data.progress}/${data.required}</strong></p><p>O descanso de <strong>${data.minutes} minutos</strong> foi concluído.</p>`});
  activeRest=null;
}

async function resolveSequenceResult(type,data){
  if(game.user.isGM){
    if(type==="failure") return gmFailure(data);
    if(type==="success") return gmSuccess(data);
  }
  game.socket.emit(`module.${MODULE_ID}`,{type,data});
}

async function rollStrainSequence(actor,payload){
  let progress=0, n=1;
  const history=[];
  while(progress<payload.required){
    const penalty=penaltyFor(n);
    let degree;
    try { degree=await rollStatistic(actor,payload.check,penalty,payload.eventName,n); }
    catch(e){ console.error(e); ui.notifications.error(`Erro ao rolar ${LABELS[payload.check]??payload.check}.`); return; }
    if(!degree){ ui.notifications.error("Não foi possível identificar o grau de sucesso."); return; }
    history.push({n,penalty,degree});
    if(degree==="criticalSuccess") progress+=2;
    else if(degree==="success") progress+=1;
    else {
      await resolveSequenceResult("failure",{
        actorUuid:actor.uuid,eventNo:payload.eventNo,eventName:payload.eventName,check:payload.check,
        strain:payload.strain,degree,history
      });
      return;
    }
    if(progress>=payload.required){
      await resolveSequenceResult("success",{
        actorUuid:actor.uuid,eventName:payload.eventName,progress,required:payload.required,minutes:payload.minutes
      });
      return;
    }
    n++;
  }
}

async function runPlayerSequence(payload){
  if(payload.userId!==game.user.id) return;
  const actor=playerActor();
  if(!actor){
    ui.notifications.warn("Defina um personagem para este usuário em User Configuration, ou tenha exatamente um personagem seu na cena.");
    return;
  }
  return rollStrainSequence(actor,payload);
}

async function startRest(){
  if(!game.user.isGM){ ui.notifications.warn("Apenas o GM pode iniciar."); return; }
  const strain=Number(getResource("Strain")?.value);
  if(!Number.isInteger(strain)||strain<1||strain>4){ ui.notifications.error("Resource Tracker 'Strain' precisa estar entre 1 e 4."); return; }

  let opts="";
  for(let m=10;m<=120;m+=10) opts+=`<option value="${m}">${m} minutos</option>`;
  new Dialog({
    title:"Pressão das Profundezas — Short Rest",
    content:`<div class="form-group"><label>Duração</label><select id="pdp-duration">${opts}</select></div><p>Os primeiros <strong>10 minutos</strong> são seguros.</p>`,
    buttons:{
      start:{label:"Resolver Descanso",callback:async html=>{
        const minutes=Number(html.find("#pdp-duration").val());
        const required=requiredProgress(minutes);
        if(required===0){ await ChatMessage.create({content:"<h2>Short Rest Concluída</h2><p>10 minutos de descanso. Nenhum Evento de Strain ocorreu.</p>"}); return; }
        const r=await new Roll("1d20").evaluate();
        const eventNo=Number(r.total), [eventName,tests]=EVENTS[eventNo];
        const restId=foundry.utils.randomID();
        activeRest={restId,eventNo,eventName,tests,minutes,required,strain,resolved:false};
        const buttons=tests.map(t=>`<button class="pdp-check" data-rest="${restId}" data-check="${t}"><i class="fas fa-dice-d20"></i> ${LABELS[t]??t}</button>`).join("");
        await ChatMessage.create({content:`<h2>Evento de Strain</h2><h3>${esc(eventName)}</h3>
          <p><strong>Duração:</strong> ${minutes} minutos<br><strong>Strain:</strong> ${strain}/4<br><strong>Progresso necessário:</strong> ${required}</p>
          <p><strong>Escolha como enfrentar o evento:</strong></p><div class="pdp-checks">${buttons}</div>
          <p class="pdp-note">Sucesso = 1 progresso • Sucesso Crítico = 2<br>Modificadores: +1 → −1 → −3 → −5 → −6</p>`});
      }},
      cancel:{label:"Cancelar"}
    }, default:"start"
  }).render(true);
}

Hooks.once("init",()=>{
  console.log(`Pressão das Profundezas v${VERSION} | init`);
});

Hooks.on("createCombat",async combat=>{ await processCombatStart(combat); });
Hooks.on("updateCombat",async (combat,changed)=>{
 if(!game.user.isGM)return;
 if(combat.started && (changed.round===1 || changed.turn===0)) await processCombatStart(combat);
 if("turn" in changed || "round" in changed){
   const prevId=combat.previous?.combatantId;
   if(prevId){const prev=combat.combatants.get(prevId);if(prev)await cleanupAtTurnEnd(combat,prev);}
   if(combat.combatant) await cleanupAtTurnStart(combat,combat.combatant);
 }
});
Hooks.once("ready",()=>{
  game.pressaoDasProfundezas={startRest,version:VERSION};

  game.socket.on(`module.${MODULE_ID}`, async packet=>{
    if(!packet?.type) return;
    if(packet.type==="choose"){
      if(!game.user.isGM) return;
      if(!activeRest || activeRest.restId!==packet.data.restId || activeRest.resolved) return;
      activeRest.resolved=true;
      game.socket.emit(`module.${MODULE_ID}`,{type:"run",data:{
        userId:packet.data.userId,check:packet.data.check,eventNo:activeRest.eventNo,eventName:activeRest.eventName,
        minutes:activeRest.minutes,required:activeRest.required,strain:activeRest.strain
      }});
      return;
    }
    if(packet.type==="run") return runPlayerSequence(packet.data);
    if(packet.type==="failure") return gmFailure(packet.data);
    if(packet.type==="success") return gmSuccess(packet.data);
  });

  // Delegated click handling: this listener exists on every connected client
  // and works for both newly-rendered and already-rendered chat cards.
  document.addEventListener("click", async event => {
    const b = event.target?.closest?.(".pdp-check, .pdp-effect");
    if (!b) return;

    if (b.classList.contains("pdp-check")) {
      event.preventDefault();
      event.stopPropagation();

      const restId=b.dataset.rest, check=b.dataset.check;
      if (!restId || !check) return;

      const card=b.closest(".message-content") ?? b.parentElement;
      for(const x of card?.querySelectorAll?.(".pdp-check") ?? []) x.disabled=true;
      b.innerHTML=`<i class="fas fa-check"></i> ${LABELS[check]??check} — Escolhido`;

      if(game.user.isGM){
        const actor=playerActor();
        if(!actor) return;
        if(!activeRest || activeRest.restId!==restId || activeRest.resolved){
          ui.notifications.warn("Este descanso não está mais ativo.");
          return;
        }
        activeRest.resolved=true;
        await rollStrainSequence(actor,{
          check,eventNo:activeRest.eventNo,eventName:activeRest.eventName,
          minutes:activeRest.minutes,required:activeRest.required,strain:activeRest.strain
        });
      } else {
        game.socket.emit(`module.${MODULE_ID}`,{
          type:"choose",
          data:{restId,check,userId:game.user.id}
        });
      }
      return;
    }

    if (b.classList.contains("pdp-effect")) {
      event.preventDefault(); event.stopPropagation(); if(!game.user.isGM)return;
      let c; try{c=JSON.parse(decodeURIComponent(b.dataset.consequence));}catch(e){console.error(e);return;}
      const actors=selectedCharacterActors();
      if(!actors.length){ui.notifications.warn("Selecione pelo menos um token de personagem antes de aplicar a consequência.");return;}
      try{
        for(const actor of actors){
          if(c.kind==="effect")await createPenaltyEffect(actor,c.name,c.selector,c.value);
          else if(c.kind==="condition"){if(actor.increaseCondition)await actor.increaseCondition(c.condition);else throw new Error("API de condição indisponível");}
          else if(c.kind==="queued")await createQueuedEffect(actor,c);
        }
        b.disabled=true;b.innerHTML='<i class="fas fa-check"></i> Aplicado/Preparado';
        ui.notifications.info(`${c.name}: ${actors.map(a=>a.name).join(", ")}.`);
      }catch(e){console.error(e);ui.notifications.error("Falha ao aplicar/preparar a consequência; veja o console.");}
    }
  });
  console.log(`Pressão das Profundezas v${VERSION} pronta. Use game.pressaoDasProfundezas.startRest()`);
});
