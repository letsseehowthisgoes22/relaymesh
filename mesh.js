import {encryptAndFragment,reconstructAndDecrypt} from './protocol.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const button=document.querySelector('#runMesh'),holder=document.querySelector('#packets'),status=document.querySelector('#meshStatus');
button.onclick=async()=>{
  try{
    button.disabled=true;holder.innerHTML='';document.querySelectorAll('.relays small').forEach(n=>n.textContent='0 RLY');status.textContent='Deriving keys from phrase…';
    const phrase=document.querySelector('#meshPhrase').value,bundle=await encryptAndFragment(document.querySelector('#meshMessage').value,phrase,5);
    status.textContent=`Encrypted + split into ${bundle.fragments.length} packets`;await sleep(550);
    const relayPoints=[[46,17],[40,48],[52,78]];
    for(const [i,fragment] of bundle.fragments.entries()){
      const p=document.createElement('i');p.className='packet';p.title=`Fragment ${fragment.index+1}`;p.style.left='12%';p.style.top=`${42+i*3}%`;holder.appendChild(p);
      await sleep(120);const point=relayPoints[i%3];p.style.left=`${point[0]}%`;p.style.top=`${point[1]}%`;await sleep(720);p.style.left='88%';p.style.top=`${42+i*3}%`;
    }
    status.textContent='Receiver found via rotating rendezvous tag…';await sleep(900);
    const plaintext=await reconstructAndDecrypt(bundle,phrase);
    document.querySelectorAll('.relays small').forEach((n,i)=>n.textContent=`+${i===1?'1.5':'1.0'} RLY`);
    status.textContent=`Delivered ✓ ${plaintext}`;status.title=`Cipher root: ${bundle.root}`;
  }catch(e){status.textContent=e.message}finally{button.disabled=false;}
};
