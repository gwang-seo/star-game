(()=>{'use strict';
let lastAt=0,lastText='';
function status(t){const el=document.getElementById('extensionStatus');if(el)el.textContent=t;}
function sync(){
 chrome.storage.local.get(['latestAnswer','latestAt','connectDiagnostic'],r=>{
  if(chrome.runtime.lastError){status('확장 저장소 오류: '+chrome.runtime.lastError.message);return;}
  const t=r.latestAnswer||'',at=r.latestAt||0;
  if(t){
   const box=document.getElementById('speechText');
   if(box&&(at!==lastAt||t!==lastText)){box.value=t.slice(0,10000);box.dispatchEvent(new Event('input',{bubbles:true}));lastAt=at;lastText=t;}
   status('확장 연결됨 · ChatGPT 답변 '+t.length+'글자 수신 완료');
   const s=document.getElementById('speechStatus');if(s)s.textContent='A1 버튼을 누르면 최신 답변을 읽습니다.';
  }else status('확장 연결됨 · '+(r.connectDiagnostic||'ChatGPT 답변 탐색 중'));
 });
}
let busy=false;
function scan(){
 if(busy)return;
 busy=true;
 chrome.runtime.sendMessage({type:'rescan-chatgpt'},res=>{
  busy=false;
  if(chrome.runtime.lastError){status('확장 통신 오류: '+chrome.runtime.lastError.message);return;}
  if(res?.state==='no-tabs')status('ChatGPT 탭을 찾지 못했습니다. 크롬에서 ChatGPT를 열어주세요.');
  else if(res?.state==='not-found')status('ChatGPT 탭 발견 · 답변 본문 탐색 실패');
  else if(res?.state==='error')status('답변 탐색 오류: '+res.error);
  sync();
 });
}
function init(){
 status('CONNECT 확장 v1.5 연결됨 · 자동 전달 대기');
 const b=document.getElementById('refreshAnswer');if(b)b.addEventListener('click',()=>scan());
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
chrome.storage.onChanged.addListener((ch,area)=>{if(area==='local'&&(ch.latestAnswer||ch.connectDiagnostic))sync();});
setInterval(sync,1500);
})();
