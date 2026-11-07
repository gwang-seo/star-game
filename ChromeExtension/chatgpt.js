(()=>{'use strict';
let last='';
function getAnswer(){
 const nodes=[...document.querySelectorAll('[data-message-author-role="assistant"]')];
 let root=nodes.at(-1);
 if(!root){
  const turns=[...document.querySelectorAll('[data-testid^="conversation-turn-"]')];
  root=turns.reverse().find(n=>n.querySelector('[data-message-author-role="assistant"]'))?.querySelector('[data-message-author-role="assistant"]');
 }
 if(!root)return '';
 const textRoot=root.querySelector('.markdown')||root.querySelector('[class*="prose"]')||root;
 return (textRoot.innerText||textRoot.textContent||'').trim().slice(0,10000);
}
function push(force=false){
 const text=getAnswer();
 if(!text||(!force&&text===last))return;
 last=text;
 chrome.runtime.sendMessage({type:'answer',text},()=>{void chrome.runtime.lastError;});
}
let timer;
const observe=()=>{if(!document.documentElement)return;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>push(),650);}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});};
observe();setInterval(()=>push(),3500);setTimeout(()=>push(true),700);
chrome.runtime.onMessage.addListener(message=>{if(message?.type==='rescan-chatgpt'){push(true);}});
})();
