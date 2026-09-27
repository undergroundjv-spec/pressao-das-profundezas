const MODULE_ID = "pressao-das-profundezas";
const TAB_KEY = "pdp-transactions";

function transactionMessage(message){
  return message.flags?.[MODULE_ID]?.transaction===true;
}
function installStandaloneTab(app,html){
  if(!game.user.isGM) return;
  const root=html?.[0] ?? html ?? app?.element?.[0] ?? app?.element;
  if(!root?.querySelector) return;
  const chatLog=root.querySelector("#chat-log");
  if(!chatLog) return;

  let nav=root.querySelector(".damage-log-nav.tabs");
  if(!nav){
    nav=document.createElement("nav");
    nav.className="pdp-chat-nav tabs";
    nav.innerHTML='<a class="item active" data-pdp-tab="chat">Chat</a>';
    chatLog.before(nav);
  }
  if(nav.querySelector('[data-pdp-tab="transactions"]')) return;

  const tab=document.createElement("a");
  tab.className="item pdp-transaction-tab";
  tab.dataset.pdpTab="transactions";
  tab.textContent="Transações";
  nav.append(tab);

  const view=document.createElement("ol");
  view.id=TAB_KEY;
  view.className="chat-log plain";
  view.hidden=true;
  chatLog.after(view);

  const showTransactions=()=>{
    nav.querySelectorAll(".item").forEach(x=>x.classList.remove("active"));
    tab.classList.add("active");
    chatLog.hidden=true;
    const damage=root.querySelector("#damage-log");
    if(damage) damage.hidden=true;
    view.hidden=false;
    const messages=game.messages.contents.filter(transactionMessage);
    view.innerHTML=messages.length
      ? messages.map(m=>'<li class="chat-message message flexcol" data-message-id="'+m.id+'">'+m.content+'</li>').join("")
      : '<li class="pdp-empty">Nenhuma transação registrada.</li>';
  };
  tab.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();showTransactions();});
  nav.addEventListener("click",event=>{
    if(event.target.closest('[data-pdp-tab="transactions"]')) return;
    view.hidden=true;
  },true);
}
Hooks.on("renderChatLog",installStandaloneTab);
