chrome.runtime.onMessage.addListener((m,s,reply)=>{
 if(m?.type==='answer'&&/^https:\/\/(chatgpt\.com|chat\.openai\.com)\//.test(s.url||s.origin||'')){
  chrome.storage.local.set({latestAnswer:m.text,latestAt:Date.now()},()=>reply({ok:!chrome.runtime.lastError}));
  return true;
 }
 if(m?.type==='get-answer'){
  chrome.storage.local.get(['latestAnswer','latestAt'],r=>reply({text:r.latestAnswer||'',at:r.latestAt||0}));
  return true;
 }
 if(m?.type==='rescan-chatgpt'){
  chrome.tabs.query({url:['https://chatgpt.com/*','https://chat.openai.com/*']},tabs=>{
   for(const t of tabs){if(t.id)chrome.tabs.sendMessage(t.id,{type:'rescan-chatgpt'},()=>void chrome.runtime.lastError);}
   reply({tabs:tabs.length});
  });
  return true;
 }
});
