(()=>{'use strict';
const KEY='connect-send-now';
function extract(){
 const selectors=['[data-message-author-role="assistant"]','[data-testid="assistant-message"]','[data-role="assistant"]','article[data-testid*="assistant"]','main [class*="markdown"]','main .prose'];
 for(const sel of selectors){
  const nodes=[...document.querySelectorAll(sel)];
  if(!nodes.length)continue;
  let el=nodes.at(-1);
  const parts=[...el.querySelectorAll('.markdown,.prose,[data-testid="message-text"]')];
  if(parts.length&&sel!=='main [class*="markdown"]'&&sel!=='main .prose')el=parts.at(-1);
  const text=(el.innerText||el.textContent||'').trim();
  if(text.length>1)return text.slice(0,10000);
 }
 return '';
}
let last='',lastManualAt=0;
function save(text,reason){
 if(!text||text.length<2)return false;
 last=text.slice(0,10000);
 if(reason.includes('직접 전송'))lastManualAt=Date.now();
 chrome.storage.local.set({latestAnswer:last,latestAt:Date.now(),connectDiagnostic:reason},()=>void chrome.runtime.lastError);
 const hint=document.getElementById('connect-hint');
 if(hint){hint.textContent='전송 OK ('+last.length+'글자)';setTimeout(()=>hint.remove(),3500);}
 return true;
}
function refresh(force=false){
 if(Date.now()-lastManualAt<12000&&!force)return;
 const t=extract();
 if(t&&(force||t!==last))save(t,'ChatGPT 답변 자동 감지 OK');
}
function manual(){
 const selected=window.getSelection()?.toString().trim()||'';
 const t=selected||extract();
 if(!t){alert('ChatGPT 답변 글을 마우스로 드래그하여 선택한 뒤 다시 눌러 주세요.');return;}
 save(t,selected?'선택한 답변 직접 전송 OK':'ChatGPT 답변 직접 전송 OK');
}
function addButton(){
 if(document.getElementById(KEY)||!document.body)return;
 const b=document.createElement('button');b.id=KEY;b.type='button';b.textContent='🔊 커넥트로 답변 보내기';b.title='선택한 글이 있으면 그 글을, 없으면 최신 답변을 스타게임으로 보냅니다.';
 Object.assign(b.style,{position:'fixed',bottom:'88px',right:'18px',zIndex:'2147483647',background:'#1756af',color:'#fff',padding:'11px 15px',fontSize:'14px',borderRadius:'12px',border:'1px solid #b4cbf7',boxShadow:'0 3px 12px #0004',cursor:'pointer'});
 b.addEventListener('click',manual);document.body.appendChild(b);
}
new MutationObserver(()=>{clearTimeout(window.__connectRetry);window.__connectRetry=setTimeout(()=>{refresh();addButton();},700);}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
chrome.runtime.onMessage.addListener((m,s,reply)=>{if(m?.type==='rescan-chatgpt'){refresh(true);reply({found:!!last,length:last.length});}});
setInterval(()=>{refresh();addButton();},3500);addButton();refresh(true);
})();
