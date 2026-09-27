const MODULE_ID = "pressao-das-profundezas";
const TAB_KEY = "pdp-transactions";

function registerTransactionTab(){
  const api=game.modules.get("custom-chat-tabs")?.api ?? game.customChatTabs;
  if(!api){
    console.warn("Pressão das Profundezas | Custom Chat Tabs API unavailable; Transaction Log dialog remains available.");
    return;
  }
  if(api.getTabs?.().has?.(TAB_KEY)) return;
  api.register({
    key:TAB_KEY,
    label:"Transações",
    icon:"fas fa-receipt",
    hint:"Transaction Log — Pressão das Profundezas",
    filter:message=>message.flags?.[MODULE_ID]?.transaction===true,
    exclusive:true,
    removable:false,
    roles:[CONST.USER_ROLES.GAMEMASTER]
  });
}
Hooks.on("custom-chat-tabs.init",registerTransactionTab);
Hooks.once("ready",()=>{
  if(game.modules.get("custom-chat-tabs")?.active) registerTransactionTab();
});
