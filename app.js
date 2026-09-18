const $ = s => document.querySelector(s);
const ABI = ['function anchor(bytes32 fingerprint,string label)','function verify(bytes32 fingerprint) view returns (bool,address,uint64,string)'];
let createBytes = null, verifyBytes = null, currentHash = '';

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab,.pane').forEach(el => el.classList.remove('active'));
  tab.classList.add('active'); $(`#${tab.dataset.tab}`).classList.add('active');
}));

async function fileBytes(input, nameEl, target) {
  const file = input.files[0]; if (!file) return;
  const bytes = new Uint8Array(await file.arrayBuffer());
  $(nameEl).textContent = `${file.name} · ${formatBytes(file.size)}`;
  if (target === 'create') createBytes = bytes; else verifyBytes = bytes;
}
$('#createFile').onchange = e => fileBytes(e.target, '#createFileName', 'create');
$('#verifyFile').onchange = e => fileBytes(e.target, '#verifyFileName', 'verify');
function formatBytes(n){return n<1024?`${n} B`:`${(n/1024).toFixed(1)} KB`}
async function digest(bytes){const hash=await crypto.subtle.digest('SHA-256',bytes);return '0x'+[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function bytesFor(text, file){return file || new TextEncoder().encode(text)}
function toast(message='Copied to clipboard'){const el=$('#toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}

$('#generate').onclick = async () => {
  const bytes=bytesFor($('#createText').value,createBytes); if(!bytes.length) return toast('Add a record first');
  currentHash=await digest(bytes); $('#fingerprint').textContent=currentHash; $('#proofResult').classList.remove('hidden');
};
$('#copyHash').onclick=async()=>{await navigator.clipboard.writeText(currentHash);toast()};

async function connect(){
  if(!window.ethereum) throw new Error('Install a Web3 wallet such as MetaMask');
  const provider=new ethers.BrowserProvider(window.ethereum); await provider.send('eth_requestAccounts',[]);
  const network=await provider.getNetwork(); $('#network').textContent=`Chain ${network.chainId}`; return provider;
}
function contractAddress(){return localStorage.getItem('prooflineContract')||''}
$('#anchor').onclick=async()=>{
  try{const address=contractAddress()||prompt('Enter the deployed ProofRegistry contract address:');if(!ethers.isAddress(address))throw new Error('A valid contract address is required');localStorage.setItem('prooflineContract',address);const provider=await connect(),contract=new ethers.Contract(address,ABI,await provider.getSigner());$('#anchor').textContent='Confirm in wallet…';const tx=await contract.anchor(currentHash,$('#label').value.trim());$('#anchor').textContent='Anchoring…';await tx.wait();$('#anchor').textContent='Anchored ✓';toast('Proof anchored on-chain')}catch(e){$('#anchor').textContent='Connect wallet & anchor';toast(e.shortMessage||e.message)}
};
$('#verifyBtn').onclick=async()=>{
  const bytes=bytesFor($('#verifyText').value,verifyBytes);if(!bytes.length)return toast('Add a record first');const hash=await digest(bytes),box=$('#verifyResult');
  try{const address=contractAddress();if(!ethers.isAddress(address))throw new Error('No registry configured yet');const provider=await connect(),contract=new ethers.Contract(address,ABI,provider),[exists,owner,time,label]=await contract.verify(hash);box.className=`verify-result ${exists?'good':'bad'}`;box.innerHTML=exists?`<strong>Verified — record unchanged</strong><p>Anchored ${new Date(Number(time)*1000).toLocaleString()} by ${owner}</p><small>${label||'No public label'}</small>`:`<strong>No matching proof found</strong><p>This record was not anchored in the configured registry, or its contents have changed.</p>`}catch(e){box.className='verify-result bad';box.innerHTML=`<strong>Local fingerprint</strong><p><code>${hash}</code></p><small>${e.message}. You can still compare this fingerprint manually.</small>`}box.classList.remove('hidden')
};
