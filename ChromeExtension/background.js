'use strict';
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
  if(txt&&txt.length>=1)return txt.slice(0,10000);
 }
 return '';
}
let scanning=false;
async function scan(){
 if(scanning)return {state:'busy'};
 scanning=true;
 try{
  const tabs=await chrome.tabs.query({url:['https://chatgpt.com/*','https://chat.openai.com/*']});
  if(!tabs.length){await chrome.storage.local.set({connectDiagnostic:'ChatGPT 브라우저 탭을 찾지 못했습니다.',connectAt:Date.now()});return {state:'no-tabs',tabs:0};}
  let inspected=0;const errors=[];
  for(const tab of tabs.sort((a,b)=>(Number(b.active)-Number(a.active)))){
   if(!tab.id)continue;
   try{
    const result=await chrome.scripting.executeScript({target:{tabId:tab.id},func:extractLastAssistant});
    inspected++;
    const text=result?.[0]?.result?.trim()||'';
    if(text){
     await chrome.storage.local.set({latestAnswer:text,latestAt:Date.now(),connectDiagnostic:'ChatGPT 답변 '+text.length+'글자 가져오기 성공',connectAt:Date.now()});
     return {state:'ok',tabs:tabs.length,length:text.length};
    }
   }catch(e){errors.push(e.message);}
  }
  const reason=errors.length?'ChatGPT 접근 오류: '+errors[0]:'ChatGPT 탭은 있지만 답변 본문을 찾지 못했습니다. ChatGPT에서 새 답변을 생성한 뒤 재시도하세요.';
  await chrome.storage.local.set({connectDiagnostic:reason,connectAt:Date.now()});
  return {state:'not-found',tabs:tabs.length,inspected,error:errors[0]||''};
 }finally{scanning=false;}
}
chrome.runtime.onMessage.addListener((m,s,reply)=>{
 if(m?.type==='rescan-chatgpt'){scan().then(reply).catch(e=>reply({state:'error',error:e.message}));return true;}
 if(m?.type==='answer'&&/^https:\/\/(chatgpt\.com|chat\.openai\.com)\//.test(s.url||s.origin||'')){
  chrome.storage.local.set({latestAnswer:m.text,latestAt:Date.now(),connectDiagnostic:'ChatGPT 새 답변 감지 성공',connectAt:Date.now()},()=>reply({ok:!chrome.runtime.lastError}));return true;
 }
 if(m?.type==='get-answer'){chrome.storage.local.get(['latestAnswer','latestAt','connectDiagnostic'],r=>reply({text:r.latestAnswer||'',at:r.latestAt||0,diagnostic:r.connectDiagnostic||''}));return true;}
});


// Camera sharing occurs only after the user activates AI state checking.
chrome.runtime.onMessage.addListener((m,s,reply)=>{
 if(m?.type!=='ai-camera-frame')return false;
 if(!/^https:\/\/(gwang-seo\.github\.io\/star-game|star-game1234\.netlify\.app)\//.test(s.url||'')){reply({ok:false,message:'카메라 주소 확인 실패'});return false;}
 (async()=>{
  const tabs=await chrome.tabs.query({url:['https://chatgpt.com/*','https://chat.openai.com/*']});
  const tab=tabs.find(t=>t.active)||tabs[0];
  if(!tab?.id)return {ok:false,message:'ChatGPT 브라우저 탭을 열어 주세요.'};
  return await chrome.tabs.sendMessage(tab.id,{type:'ai-camera-upload',id:m.id,jpeg:m.jpeg});
 })().then(reply).catch(e=>reply({ok:false,message:'공유 실패: '+e.message}));
 return true;
});