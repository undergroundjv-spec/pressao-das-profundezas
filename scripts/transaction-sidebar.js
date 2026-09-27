const MODULE_ID = "pressao-das-profundezas";
const VERSION = "0.8.1";
const TAB_ID = "pdp-transactions";

function log(message){ console.log(`Pressão das Profundezas v${VERSION} | ${message}`); }
function rootElement(chatTab, html){
  const candidate=html?.[0] ?? html ?? chatTab?.element?.[0] ?? chatTab?.element;
  return candidate?.querySelector ? candidate : null;
}
function isTransactionElement(node){
  const id=node?.dataset?.messageId;
  return !!id && game.messages.get(id)?.flags?.[MODULE_ID]?.transaction===true;
}
function moveTransactions(chatLog,txLog){
  const nodes=[...chatLog.querySelectorAll("[data-message-id]")].filter(isTransactionElement);
  if(nodes.length) txLog.append(...nodes);
}
function activate(root,nav,chatLog,txLog,tab){
  nav.querySelectorAll(".item").forEach(x=>x.classList.remove("active"));
  tab.classList.add("active");
  chatLog.style.display="none";
  const damage=root.querySelector("#damage-log");
  if(damage) damage.style.display="none";
  txLog.style.display="";
  txLog.scrollTop=txLog.scrollHeight;
}
function deactivate(txLog){ txLog.style.display="none"; }

async function install(chatTab,html){
  if(!game.user.isGM) return;
  const root=rootElement(chatTab,html);
  log(`renderChatLog fired; root=${!!root}`);
  if(!root) return;

  const chatLog=root.querySelector(".chat-log") ?? root.querySelector("#chat-log") ?? root.querySelector("ol[data-application-part='log']");
  log(`chat log found=${!!chatLog}`);
  if(!chatLog) return;

  let nav=root.querySelector(".damage-log-nav.tabs");
  if(!nav){
    nav=document.createElement("nav");
    nav.className="pdp-chat-nav tabs";
    nav.dataset.group="pdp-chat-tabs";
    nav.innerHTML='<a class="item active" data-tab="chat" data-group="pdp-chat-tabs">Chat</a>';
    root.insertAdjacentElement("afterbegin",nav);
    log("created standalone chat navigation");
  } else log("Damage Log navigation found");

  if(root.querySelector("#"+TAB_ID)){ log("Transactions tab already installed"); return; }

  const txLog=document.createElement("ol");
  txLog.id=TAB_ID;
  txLog.className=chatLog.className;
  txLog.style.display="none";
  chatLog.insertAdjacentElement("afterend",txLog);
  moveTransactions(chatLog,txLog);

  const tab=document.createElement("a");
  tab.className="item pdp-transaction-tab";
  tab.dataset.tab=TAB_ID;
  tab.dataset.group=nav.dataset.group || "damage-log-tabs";
  tab.textContent="Transações";
  nav.append(tab);

  tab.addEventListener("click",event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    activate(root,nav,chatLog,txLog,tab);
  },true);

  nav.addEventListener("click",event=>{
    if(event.target.closest(".pdp-transaction-tab")) return;
    deactivate(txLog);
  },true);

  const observer=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      const nodes=[...mutation.addedNodes].filter(isTransactionElement);
      if(nodes.length) txLog.append(...nodes);
    }
  });
  observer.observe(chatLog,{childList:true});
  log("Transactions tab installed");
}
Hooks.on("renderChatLog",(chatTab,html)=>{ install(chatTab,html).catch(error=>console.error("Pressão das Profundezas | Transaction UI error",error)); });
Hooks.once("ready",()=>log("Transaction UI ready; waiting for renderChatLog"));
