// admin.js - admin management using Firebase Auth + Firestore
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const authMsg = document.getElementById('authMsg');
const adminArea = document.getElementById('adminArea');
const btnCreate = document.getElementById('btnCreate');
const createMsg = document.getElementById('createMsg');
const licensesList = document.getElementById('licensesList');
const btnSearch = document.getElementById('btnSearch');
const btnRefresh = document.getElementById('btnRefresh');

auth.onAuthStateChanged(user=>{
  if(user){
    adminArea.style.display = 'block';
    btnLogout.style.display = 'inline-block';
    document.getElementById('authCard').style.display = 'none';
    loadLicenses();
  } else {
    adminArea.style.display = 'none';
    btnLogout.style.display = 'none';
    document.getElementById('authCard').style.display = 'block';
  }
});

btnLogin.addEventListener('click', async ()=>{
  const email = document.getElementById('email').value;
  const pw = document.getElementById('password').value;
  try{
    await auth.signInWithEmailAndPassword(email, pw);
    authMsg.innerText = 'Login sukses';
  }catch(err){ authMsg.innerText = 'Login gagal: ' + err.message; }
});

btnLogout.addEventListener('click', ()=> auth.signOut());

btnCreate.addEventListener('click', async ()=>{
  const ownerEmail = document.getElementById('a_ownerEmail').value.trim();
  const productId = document.getElementById('a_productId').value.trim() || 'default';
  const duration = parseInt(document.getElementById('a_duration').value) || 30;
  if(!ownerEmail){ createMsg.innerText = 'Isi owner email'; return; }
  const key = 'LIC-' + Math.random().toString(36).substring(2,6).toUpperCase() + '-' + Math.random().toString(36).substring(2,6).toUpperCase();
  const id = 'lic_' + Math.random().toString(36).substring(2,9);
  const now = new Date();
  const expires = new Date(now.getTime() + duration*24*3600*1000);
  const doc = {
    licenseId: id,
    licenseKey: key,
    productId,
    userEmail: ownerEmail,
    expiryDate: expires.toISOString().split('T')[0],
    status: 'active',
    createdAt: firebase.firestore.Timestamp.now()
  };
  try{
    await db.collection('licenses').doc(id).set(doc);
    createMsg.innerText = 'License dibuat: ' + key;
    loadLicenses();
  }catch(err){ createMsg.innerText = 'Error: ' + err.message; }
});

async function loadLicenses(q){
  licensesList.innerHTML = '<div class="small">Loading...</div>';
  const snap = await db.collection('licenses').orderBy('createdAt','desc').limit(200).get();
  if(snap.empty){ licensesList.innerHTML = '<div class="small">Tidak ada lisensi</div>'; return; }
  let out = '<table class="table"><tr><th>Key</th><th>Product</th><th>Owner</th><th>Expiry</th><th>Aksi</th></tr>';
  snap.forEach(doc=>{
    const d = doc.data();
    out += `<tr><td>${d.licenseKey}</td><td>${d.productId||''}</td><td>${d.userEmail||''}</td><td>${d.expiryDate||''}</td><td><button data-id="${doc.id}" class="btnRevoke">Revoke</button></td></tr>`;
  });
  out += '</table>';
  licensesList.innerHTML = out;
  document.querySelectorAll('.btnRevoke').forEach(b=>b.addEventListener('click', async (e)=>{
    const id = e.target.getAttribute('data-id');
    if(!confirm('Revoke license '+id+'?')) return;
    await db.collection('licenses').doc(id).update({ status:'revoked' });
    loadLicenses();
  }));
}

btnSearch.addEventListener('click', ()=>{
  const q = document.getElementById('q').value.trim().toLowerCase();
  if(!q) return loadLicenses();
  db.collection('licenses').get().then(snap=>{
    let out = '<table class="table"><tr><th>Key</th><th>Product</th><th>Owner</th><th>Expiry</th><th>Aksi</th></tr>';
    snap.forEach(doc=>{
      const d = doc.data();
      if((d.userEmail||'').toLowerCase().includes(q) || (d.productId||'').toLowerCase().includes(q) || (d.licenseKey||'').toLowerCase().includes(q)){
        out += `<tr><td>${d.licenseKey}</td><td>${d.productId||''}</td><td>${d.userEmail||''}</td><td>${d.expiryDate||''}</td><td><button data-id="${doc.id}" class="btnRevoke">Revoke</button></td></tr>`;
      }
    });
    out += '</table>';
    licensesList.innerHTML = out;
    document.querySelectorAll('.btnRevoke').forEach(b=>b.addEventListener('click', async (e)=>{
      const id = e.target.getAttribute('data-id');
      if(!confirm('Revoke license '+id+'?')) return;
      await db.collection('licenses').doc(id).update({ status:'revoked' });
      loadLicenses();
    }));
  });
});

btnRefresh.addEventListener('click', ()=> loadLicenses());
