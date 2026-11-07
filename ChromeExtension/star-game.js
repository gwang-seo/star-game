(()=>{'use strict';
function status(text){
 const el=document.getElementById('extensionStatus');
 if(el)el.textContent=text;
}
function deliver(text,at){
 const area=document.getElementById('speechText');
 if(!area)return false;
 if(!text){status('확장 프로그램 연결됨 · ChatGPT 답변 저장 안 됨 (ChatGPT 탭에서 답변을 생성하거나 새로고침)');return false;}
 area.value=text.slice(0,10000);
 area.dispatchEvent(new Event('input',{bubbles:true}));
 status('확장 프로그램 연결됨 · 답변 수신 성공 ('+text.length+'글자)');
 const label=document.getElementById('speechStatus');
 if(label)label.textContent='최신 ChatGPT 답변 준비 완료 · A1 버튼을 누르세요.';
 return true;
}
function sync(){
 chrome.storage.local.get(['latestAnswer','latestAt'],r=>{
  if(chrome.runtime.lastError){status('확장 저장소 오류: '+chrome.runtime.lastError.message);return;}
  deliver(r.latestAnswer||'',r.latestAt||0);
 });
}
function requestFresh(){
 status('ChatGPT 탭에서 최신 답변 찾는 중…');
 chrome.runtime.sendMessage({type:'rescan-chatgpt'},()=>{
  setTimeout(sync,700);
  void chrome.runtime.lastError;
 });
}
function wire(){
 const refresh=document.getElementById('refreshAnswer');
 if(refresh)refresh.addEventListener('click',requestFresh);
 status('확장 프로그램 v1.2 연결됨 · 답변 확인 중…');
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});else wire();
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&(changes.latestAnswer||changes.latestAt))sync();});
setInterval(sync,3000);
})();
