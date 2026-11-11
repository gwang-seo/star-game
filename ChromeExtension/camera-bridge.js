(()=>{'use strict';
window.addEventListener('message',async e=>{
 if(e.source!==window||e.origin!==location.origin||e.data?.source!=='star-game-camera'||e.data.type!=='AI_FRAME')return;
 const {jpeg,id}=e.data;
 if(typeof jpeg!=='string'||!jpeg.startsWith('data:image/jpeg;base64,')||jpeg.length>4500000)return;
 const report=message=>window.postMessage({source:'star-game-extension',type:'AI_FRAME_STATUS',message},location.origin);
 try{const r=await chrome.runtime.sendMessage({type:'ai-camera-frame',jpeg,id});report(r?.message||(r?.ok?'사진 공유 OK':'공유 실패'));}
 catch(err){report('확장 오류: '+err.message);}
});
})();