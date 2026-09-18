import {encryptAndFragment,reconstructAndDecrypt} from './protocol.mjs';
const $=s=>document.querySelector(s),log=$('#log'),state=$('#connection'),send=$('#send');let role='',socket,stored;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const line=(text,cls='')=>{const p=document.createElement('p');p.textContent=text;p.className=cls;log.appendChild(p);log.scrollTop=log.scrollHeight};
const clean=s=>s.toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,18);
const sendTo=(to,type,payload={})=>socket.send(JSON.stringify({...payload,to,from:role.toLowerCase(),type}));
function start(name){role=name;log.innerHTML='';state.textContent=`${name}: connecting`;document.querySelectorAll('.role-row button').forEach(b=>b.disabled=true);if(name==='Relay'){$('#phrase').value='';$('#phrase').disabled=true;$('#message').disabled=true}if(name==='Receiver')$('#message').disabled=true;const room=`rm-${clean($('#room').value)}`,scheme=location.protocol==='https:'?'wss':'ws';socket=new WebSocket(`${scheme}://${location.host}/relay?room=${room}`);socket.onopen=()=>{state.textContent=`${name}: connected`;line(`✓ ${name} client connected to transport room ${room}`,'good');if(name==='Sender')send.disabled=false};socket.onerror=()=>line('Transport connection failed. Run this MVP with npm start.');socket.onclose=e=>{state.textContent=`${name}: disconnected`;line(`Transport closed (${e.code}) ${e.reason||''}`);send.disabled=true};socket.onmessage=event=>{let msg;try{msg=JSON.parse(event.data)}catch{return}if(!msg.type||msg.from===role.toLowerCase()||(msg.to!==role.toLowerCase()&&msg.to!=='all'))return;handle(msg)}}
async function handle(msg){
  if(role==='Relay'){
    if(msg.from==='sender'&&msg.type==='manifest'){stored={...msg.bundle,fragments:[]};line(`Relay accepted manifest for ${msg.count} fragments`,'packet-line')}
    if(msg.from==='sender'&&msg.type==='fragment'){stored.fragments.push(msg.fragment);line(`Relay stored opaque fragment ${stored.fragments.length}/${msg.total}`,'packet-line')}
    if(msg.from==='sender'&&msg.type==='complete'){line('Relay has the ciphertext bundle; forwarding to receiver…');const parts=stored.fragments,manifest={...stored,fragments:undefined};sendTo('receiver','manifest',{bundle:manifest,count:parts.length});for(const fragment of parts){await sleep(220);sendTo('receiver','fragment',{fragment,total:parts.length});line(`Relay forwarded opaque fragment ${fragment.index+1}`,'packet-line')}sendTo('receiver','complete');sendTo('sender','relayReceipt',{count:parts.length,forwardedAt:Date.now()})}
    if(msg.from==='receiver'&&msg.type==='deliveryReceipt'){line('✓ Receiver receipt received; returning it to sender','good');sendTo('sender','deliveryReceipt',msg);state.textContent='Relay: receipt forwarded ✓'}
  }
  if(role==='Receiver'){
    if(msg.type==='manifest'){stored={...msg.bundle,fragments:[]};log.innerHTML='';line(`Manifest arrived from relay: ${msg.count} fragments expected`,'packet-line')}
    if(msg.type==='fragment'){stored.fragments.push(msg.fragment);line(`Receiver collected fragment ${stored.fragments.length}/${msg.total}`,'packet-line')}
    if(msg.type==='complete'){try{const plain=await reconstructAndDecrypt(stored,$('#phrase').value);line(`✓ Reconstructed and decrypted: ${plain}`,'good');state.textContent='Receiver: delivered ✓';sendTo('relay','deliveryReceipt',{count:stored.fragments.length,digest:stored.root,receivedAt:Date.now()})}catch(e){line(`Rejected: ${e.message}`)}}
  }
  if(role==='Sender'){
    if(msg.type==='relayReceipt')line(`Relay stored and forwarded ${msg.count} ciphertext fragments.`,'packet-line');
    if(msg.type==='deliveryReceipt'){line(`✓ Delivery receipt returned through relay. ${msg.count} fragments delivered; RLY settlement eligible.`,'good');state.textContent='Sender: delivered ✓'}
  }
}
$('#receiver').onclick=()=>start('Receiver');$('#relay').onclick=()=>start('Relay');$('#sender').onclick=()=>start('Sender');
send.onclick=async()=>{if(role!=='Sender'||socket?.readyState!==WebSocket.OPEN)return line('Sender transport is not ready');send.disabled=true;const bundle=await encryptAndFragment($('#message').value,$('#phrase').value,5),parts=bundle.fragments,manifest={...bundle,fragments:undefined};sendTo('relay','manifest',{bundle:manifest,count:parts.length});line(`Encrypted locally; sending ${parts.length} fragments to relay…`);for(const fragment of parts){sendTo('relay','fragment',{fragment,total:parts.length});line(`Sender transmitted fragment ${fragment.index+1}`,'packet-line');await sleep(220)}sendTo('relay','complete');line('Sender completed the first hop; waiting for two receipts.');send.disabled=false};
