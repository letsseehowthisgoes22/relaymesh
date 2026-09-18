const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = b => btoa(String.fromCharCode(...b));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
export async function keyFromPhrase(phrase, salt){
  const base=await crypto.subtle.importKey('raw',enc.encode(phrase.trim().toLowerCase()),'PBKDF2',false,['deriveKey','deriveBits']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:120000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  const route=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:120000,hash:'SHA-256'},base,256));
  return {key,route};
}
export async function encryptAndFragment(message,phrase,count=5){
  if(!message.trim()||phrase.trim().split(/\s+/).length<4) throw new Error('Enter a message and a phrase of at least four words');
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const {key,route}=await keyFromPhrase(phrase,salt);
  const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(message)));
  const size=Math.ceil(cipher.length/count),fragments=[];
  for(let i=0;i<count;i++){const part=cipher.slice(i*size,(i+1)*size);if(part.length)fragments.push({index:i,data:b64(part)});}
  for(let i=fragments.length-1;i>0;i--){const j=route[i]%(i+1);[fragments[i],fragments[j]]=[fragments[j],fragments[i]];}
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',cipher));
  return {salt:b64(salt),iv:b64(iv),root:b64(digest),fragments};
}
export async function reconstructAndDecrypt(bundle,phrase){
  const joined=bundle.fragments.slice().sort((a,b)=>a.index-b.index).flatMap(f=>[...unb64(f.data)]);
  const cipher=new Uint8Array(joined),check=new Uint8Array(await crypto.subtle.digest('SHA-256',cipher));
  if(b64(check)!==bundle.root) throw new Error('Fragment integrity check failed');
  const {key}=await keyFromPhrase(phrase,unb64(bundle.salt));
  return dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(bundle.iv)},key,cipher));
}
