(()=>{'use strict';
function extractLastAssistant(){
 const candidates=[...document.querySelectorAll('[data-message-author-role="assistant"],[data-testid="assistant-message"],[data-role="assistant"]')];
 let nodes=candidates;
 if(!nodes.length){
  const turns=[...document.querySelectorAll('[data-testid^="conversation-turn-"],article')];
  nodes=turns.filter(n=>n.querySelector('[data-message-author-role="assistant"],[data-testid="assistant-message"]'));
 }
 if(!nodes.length){
  nodes=[...document.querySelectorAll('main .markdown, main .prose, main [class*="markdown"]')];
 }
 const clean=node=>{
  const clone=node.cloneNode(true);
  clone.querySelectorAll('button,nav,footer,form,textarea,script,style,[aria-hidden="true"],[role="toolbar"]').forEach(e=>e.remove());
  return (clone.innerText||clone.textContent||'').trim();
 };
 for(let i=nodes.length-1;i>=0;i--){
  const root=nodes[i];
  const messages=[...root.querySelectorAll('.markdown, .prose, [data-testid="message-text"]')];
  let txt=messages.length?messages.map(clean).filter(Boolean).join('\n'):clean(root);
  if(txt&&txt.length>1)return txt.slice(0,10000);
 }
 return '';
}
let last='',timer;
function push(force=false){
 const text=extractLastAssistant();
 if(!text||(!force&&text===last))return;
 last=text;
 chrome.storage.local.set({latestAnswer:text,latestAt:Date.now(),connectDiagnostic:'ChatGPT 답변 '+text.length+'글자 자동 감지'},()=>void chrome.runtime.lastError);
}
new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(push,600);}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
chrome.runtime.onMessage.addListener((m,s,reply)=>{if(m?.type==='rescan-chatgpt'){push(true);reply({found:!!last,length:last.length});}});
setInterval(push,3000);push(true);
})();
