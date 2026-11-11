(()=>{'use strict';
let busy=false,lastId='';
function dataFile(jpeg,id){const raw=atob(jpeg.split(',')[1]),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return new File([bytes],'star-camera-'+id+'.jpg',{type:'image/jpeg'});}
async function upload(m){
 if(busy||m.id===lastId)return {ok:false,message:'이전 사진 전송 중이거나 중복입니다.'};
 busy=true;
 try{
  const input=document.querySelector('input[type="file"][accept*="image"],input[type="file"]');
  if(!input)return {ok:false,message:'ChatGPT의 사진 첨부 입력창을 찾지 못했습니다. 브라우저 UI에 따라 자동 첨부가 제한될 수 있습니다.'};
  const dt=new DataTransfer();dt.items.add(dataFile(m.jpeg,m.id));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  lastId=m.id;
  return {ok:true,message:'사진을 ChatGPT 입력창에 첨부했습니다. 내용을 확인하고 전송 버튼을 눌러 분석하세요.'};
 }catch(e){return {ok:false,message:'사진 첨부 실패: '+e.message};}
 finally{busy=false;}
}
chrome.runtime.onMessage.addListener((m,s,reply)=>{if(m?.type==='ai-camera-upload'){upload(m).then(reply);return true;}});
})();