(()=>{'use strict';
let last='';
function extract(){
 const roleNodes=[...document.querySelectorAll('[data-message-author-role="assistant"], [data-testid="assistant-message"]')];
 let root=roleNodes.at(-1);
 if(!root){
  const turns=[...document.querySelectorAll('[data-testid^="conversation-turn-"]')];
  root=turns.reverse().find(n=>n.querySelector('[data-message-author-role="assistant"], .markdown'));
  if(root)root=root.querySelector('[data-message-author-role="assistant"]')||root;
 }
 if(!root)return '';
 const parts=[...root.querySelectorAll('.markdown, [class*="prose"]')];
 const pick=parts.length?parts.at(-1):root;
 return (pick.innerText||pick.textContent||'').trim().slice(0,10000);
}
function update(force=false){
 const answer=extract();
 if(!answer)return;
 if(answer===last&&!force)return;
 last=answer;
 chrome.storage.local.set({latestAnswer:answer,latestAt:Date.now()},()=>void chrome.runtime.lastError);
}
const mo=new MutationObserver(()=>{clearTimeout(window.__connectDebounce);window.__connectDebounce=setTimeout(update,400);});
mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
chrome.runtime.onMessage.addListener((m,s,respond)=>{if(m?.type==='rescan-chatgpt'){update(true);respond({found:!!last,length:last.length});}});
setInterval(()=>update(),2500);
update(true);
})();
