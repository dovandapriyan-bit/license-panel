// main.js - user activation and listing
const btnCheck = document.getElementById('btnCheck');
const result = document.getElementById('result');
const listBox = document.getElementById('list');
const btnList = document.getElementById('btnList');

btnCheck.addEventListener('click', async ()=>{
  const key = document.getElementById('licenseKey').value.trim();
  const productId = document.getElementById('productId').value.trim();
  if(!key){ result.innerText = 'Masukkan license key'; return; }
  try{
    const q = await db.collection('licenses').where('licenseKey','==',key).limit(1).get();
    if(q.empty){ result.innerText = 'License tidak ditemukan'; return; }
    const doc = q.docs[0].data();
    // product check
    if(productId && doc.productId && doc.productId !== productId){ result.innerText = 'License tidak valid untuk product ini'; return; }
    // expiry check
    const exp = doc.expiryDate;
    if(exp){
      const now = new Date();
      const d = new Date(exp);
      if(d.getTime() < now.getTime()){ result.innerText = 'License sudah kadaluarsa: ' + exp; return; }
    }
    // success -> mark activation in users collection (append)
    result.innerText = 'License valid. Activated for ' + (doc.userEmail || doc.ownerEmail || 'owner');
    // write simple activation record
    await db.collection('activations').add({ licenseKey: key, productId: doc.productId || productId || '', activatedAt: firebase.firestore.Timestamp.now() });
  }catch(err){
    console.error(err);
    result.innerText = 'Error: ' + err.message;
  }
});

btnList.addEventListener('click', async ()=>{
  listBox.innerHTML = '<div class="small">Loading...</div>';
  const snap = await db.collection('licenses').orderBy('expiryDate').limit(100).get();
  if(snap.empty){ listBox.innerHTML = '<div class="small">Tidak ada lisensi</div>'; return; }
  let out = '<table class="table"><tr><th>Key</th><th>Product</th><th>Owner</th><th>Expiry</th></tr>';
  snap.forEach(doc=>{
    const d = doc.data();
    out += `<tr><td>${d.licenseKey||''}</td><td>${d.productId||''}</td><td>${d.userEmail||d.ownerEmail||''}</td><td>${d.expiryDate||''}</td></tr>`;
  });
  out += '</table>';
  listBox.innerHTML = out;
});
