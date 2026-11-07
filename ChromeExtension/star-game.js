(()=>{'use strict';
let last='';
function send(text,at=0){
 if(typeof text!=='string'||!text.trim())return;
 if(text!==last||at){last=text;window.postMessage({source:'connect-speech-extension',text,at},location.origin);}
}
function sync(){
 chrome.runtime.sendMessage({type:'get-answer'},response=>{
  if(chrome.runtime.lastError)return;
  send(response?.text,response?.at||0);
 });
}
chrome.storage.onChanged.addListener((changes,area)=>{
 if(area==='local'&&changes.latestAnswer)send(changes.latestAnswer.newValue,Date.now());
});
window.addEventListener('message',event=>{
 if(event.source!==window||event.origin!==location.origin)return;
 if(event.data?.source==='connect-speech-page-ready'){
  sync();
  if(event.data?.rescan)chrome.runtime.sendMessage({type:'rescan-chatgpt'},()=>void chrome.runtime.lastError);
 }
});
sync();setInterval(sync,3000);
window.postMessage({source:'connect-speech-extension-status',installed:true},location.origin);
})();
