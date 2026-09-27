const MODULE_ID = "pressao-das-profundezas";
const VERSION = "0.8.2";
const TAB_ID = "pdp-transactions";
const WAIT_MS = 1200;

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
function showPane(root,nav,chatLog,txLog,tab){
  nav.querySelectorAll(".item").forEach(x=>x.classList.remove("active"));
  tab.classList.add("active");
  chatLog.style.display="none";
  const damage=root.querySelector("#damage-log");
  if(damage) damage.style.display="none";
  txLog.style.display="";
  txLog.scrollTop=txLog.scrollHeight;
}
function hideTransactions(txLog){ txLog.style.display="none"; }

function bindNavigation(root,nav,chatLog,txLog,tab){
  tab.addEventListener("click",event=>{
    event.preventDefault();
    event.stopPropagation();
    showPane(root,nav,chatLog,txLog,tab);
  });

  for(const item of nav.querySelectorAll(".item:not(.pdp-transaction-tab)")){
    item.addEventListener("click",()=>hideTransactions(txLog));
  }
}

function installIntoNav(root,nav,chatLog){
  if(root.querySelector("#"+TAB_ID) || nav.querySelector(".pdp-transaction-tab")) return true;

  const txLog=document.createElement("ol");
  txLog.id=TAB_ID;
  txLog.className=chatLog.className;
  txLog.style.display="none";
  const damage=root.querySelector("#damage-log");
  (damage ?? chatLog).insertAdjacentElement("afterend",txLog);
  moveTransactions(chatLog,txLog);

  const tab=document.createElement("a");
  tab.className="item pdp-transaction-tab";
  tab.dataset.tab=TAB_ID;
  tab.dataset.group=nav.dataset.group || "damage-log-tabs";
  tab.textContent="Transações";
  nav.append(tab);
  bindNavigation(root,nav,chatLog,txLog,tab);

  const observer=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      const nodes=[...mutation.addedNodes].filter(isTransactionElement);
      if(nodes.length) txLog.append(...nodes);
    }
  });
  observer.observe(chatLog,{childList:true});
  log(`Transactions tab installed in ${nav.classList.contains("damage-log-nav")?"Damage Log":"standalone"} navigation`);
  return true;
}

function waitForDamageLog(root,chatLog){
  const existing=root.querySelector(".damage-log-nav.tabs");
  if(existing) return Promise.resolve(existing);

  return new Promise(resolve=>{
    let finished=false;
    const finish=nav=>{
      if(finished) return;
      finished=true;
      observer.disconnect();
      clearTimeout(timer);
      resolve(nav);
    };
    const observer=new MutationObserver(()=>{
      const nav=root.querySelector(".damage-log-nav.tabs");
      if(nav) finish(nav);
    });
    observer.observe(root,{childList:true,subtree:true});
    const timer=setTimeout(()=>finish(null),WAIT_MS);
  });
}

async function install(chatTab,html){
  if(!game.user.isGM) return;
  const root=rootElement(chatTab,html);
  log(`renderChatLog fired; root=${!!root}`);
  if(!root) return;

  const chatLog=root.querySelector(".chat-log") ?? root.querySelector("#chat-log") ?? root.querySelector("ol[data-application-part='log']");
  log(`chat log found=${!!chatLog}`);
  if(!chatLog) return;

  const damageNav=await waitForDamageLog(root,chatLog);
  if(damageNav){
    log("Damage Log navigation found");
    installIntoNav(root,damageNav,chatLog);
    return;
  }

  log("Damage Log navigation not found after wait; creating standalone fallback");
  const nav=document.createElement("nav");
  nav.className="pdp-chat-nav tabs";
  nav.dataset.group="pdp-chat-tabs";
  nav.innerHTML='<a class="item active" data-tab="chat" data-group="pdp-chat-tabs">Chat</a>';
  root.insertAdjacentElement("afterbegin",nav);
  installIntoNav(root,nav,chatLog);
}

Hooks.on("renderChatLog",(chatTab,html)=>{
  install(chatTab,html).catch(error=>console.error("Pressão das Profundezas | Transaction UI error",error));
});
Hooks.once("ready",()=>log("Transaction UI ready; waiting for renderChatLog"));
