(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const modal = $('#tryOnModal');
  const canvasHost = $('#tryOnCanvas');
  if (!modal || !canvasHost) return;

  let cart = (window.NBYN?.getCart?.() || []);
  let activeGender = 'men';
  let renderer, scene, camera, controls, avatar = {}, animationId;
  let selectedItem = cart.length ? cart[cart.length - 1] : null;
  let initialized = false;

  const palettes = [0x201015,0x24303b,0x5a1831,0x75634c,0x242020,0x233b32,0x4b2e58,0x8b6b55];
  const colorFor = item => {
    if (!item) return 0x24151c;
    const text = String(item.name || '') + String(item.id || '');
    let h = 0; for (let i=0;i<text.length;i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    return palettes[h % palettes.length];
  };
  const money = n => Number(n || 0).toLocaleString('fr-FR') + ' QAR';

  function showItem(item) {
    selectedItem = item || null;
    const box = $('#tryOnProduct');
    if (!box) return;
    if (!selectedItem) {
      box.innerHTML = '<div class="tryOnEmpty">أضف منتجًا إلى السلة لبدء التجربة.</div>';
      return;
    }
    const img = selectedItem.image_url ? `<img src="${safeUrl(selectedItem.image_url)}" alt="${escapeHtml(selectedItem.name || 'منتج')}" loading="lazy">` : '';
    box.innerHTML = `${img}<h4>${escapeHtml(selectedItem.name || 'منتج من N by N')}</h4><p>الكمية في السلة: ${Number(selectedItem.quantity || 1)}</p><p><strong>${money(Number(selectedItem.price || 0) * Number(selectedItem.quantity || 1))}</strong></p><p>تم تحديث معاينة المجسّم حسب آخر منتج أُضيف.</p>`;
    if (avatar.top?.material) avatar.top.material.color.setHex(colorFor(selectedItem));
    if (avatar.bottom?.material && /pant|trouser|jean|بنطال|سروال|جينز/i.test(selectedItem.name || '')) avatar.bottom.material.color.setHex(colorFor(selectedItem));
  }
  function safeUrl(v) { try { const u = new URL(v, location.href); return ['http:','https:'].includes(u.protocol) ? u.href : ''; } catch (_) { return ''; } }
  function escapeHtml(v) { return String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

  function mesh(geometry, material, x,y,z, sx=1,sy=1,sz=1) {
    const m = new THREE.Mesh(geometry, material); m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
  }
  function material(color, roughness=.72) { return new THREE.MeshStandardMaterial({color,roughness,metalness:.02}); }
  function buildAvatar(gender) {
    if (avatar.group) scene.remove(avatar.group);
    Object.values(avatar).forEach(v => { if (v?.isObject3D && v !== avatar.group) scene.remove(v); });
    avatar = {};
    // A lightweight interactive 3D mannequin is used until licensed, rigged fashion GLB assets are supplied.
    const skin = material(gender === 'women' ? 0xc88f70 : 0xb98162);
    const darkHair = material(0x211611);
    const topMat = material(selectedItem ? colorFor(selectedItem) : 0x24151c);
    const pantsMat = material(0x17171d);
    const shoeMat = material(0x111014,.48);
    const torsoGeo = new THREE.CylinderGeometry(gender==='women'?.24:.29, gender==='women'?.30:.32, .78, 24, 1, false);
    avatar.top = mesh(torsoGeo, topMat,0,1.42,0,1,1,0.60);
    avatar.neck = mesh(new THREE.CylinderGeometry(.075,.09,.18,16),skin,0,1.89,0,1,1,1);
    avatar.head = mesh(new THREE.SphereGeometry(.205,24,20),skin,0,2.15,0, gender==='women'?.92:1,1.12,.88);
    avatar.hair = mesh(new THREE.SphereGeometry(.213,24,16,0,Math.PI*2,0,Math.PI*.58),darkHair,0,2.22,-.008,1,1,1);
    // simple facial planes, intentionally subtle for a clean fashion-figure look
    const eyeMat = material(0x211b1a,.4);
    avatar.eyeL = mesh(new THREE.SphereGeometry(.018,10,8),eyeMat,-.065,2.17,.178,1,1,.45);
    avatar.eyeR = mesh(new THREE.SphereGeometry(.018,10,8),eyeMat,.065,2.17,.178,1,1,.45);
    avatar.bottom = mesh(new THREE.CylinderGeometry(.23,.27,.72,20),pantsMat,0,.69,0,1,1,.60);
    avatar.legL = mesh(new THREE.CylinderGeometry(.105,.085,.72,16),pantsMat,-.14,.29,0,1,1,.9);
    avatar.legR = mesh(new THREE.CylinderGeometry(.105,.085,.72,16),pantsMat,.14,.29,0,1,1,.9);
    avatar.shoeL = mesh(new THREE.BoxGeometry(.20,.10,.34),shoeMat,-.14,-.105,.055,1,1,1);
    avatar.shoeR = mesh(new THREE.BoxGeometry(.20,.10,.34),shoeMat,.14,-.105,.055,1,1,1);
    const armGeo = new THREE.CylinderGeometry(.085,.07,.65,16);
    avatar.armL = mesh(armGeo,skin,-.37,1.43,0,1,1,1); avatar.armL.rotation.z=-.16;
    avatar.armR = mesh(armGeo,skin,.37,1.43,0,1,1,1); avatar.armR.rotation.z=.16;
    avatar.sleeveL = mesh(new THREE.CylinderGeometry(.105,.082,.35,16),topMat,-.34,1.58,0,1,1,1); avatar.sleeveL.rotation.z=-.16;
    avatar.sleeveR = mesh(new THREE.CylinderGeometry(.105,.082,.35,16),topMat,.34,1.58,0,1,1,1); avatar.sleeveR.rotation.z=.16;
    // keep all avatar parts grouped for easy yaw rotation
    const group = new THREE.Group();
    const all = Object.values(avatar).filter(v=>v?.isObject3D);
    all.forEach(m=>{scene.remove(m); group.add(m);});
    scene.add(group); avatar.group = group;
    showItem(selectedItem);
  }
  function init() {
    if (initialized || !window.THREE) return;
    initialized = true;
    try {
      scene = new THREE.Scene(); scene.background = new THREE.Color(0x21131d); scene.fog = new THREE.Fog(0x21131d,5,11);
      camera = new THREE.PerspectiveCamera(34, canvasHost.clientWidth/Math.max(canvasHost.clientHeight,1), .1, 100); camera.position.set(0,1.55,5.7);
      renderer = new THREE.WebGLRenderer({antialias:true,alpha:false}); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,2)); renderer.setSize(canvasHost.clientWidth,canvasHost.clientHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; canvasHost.innerHTML=''; canvasHost.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight(0xffe9d7,0x35202c,2.1));
      const key = new THREE.DirectionalLight(0xffe2bd,3.0); key.position.set(2.5,4,3); key.castShadow=true; scene.add(key);
      const fill = new THREE.DirectionalLight(0xbda6ff,1.1); fill.position.set(-3,2,1); scene.add(fill);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(1.55,48),new THREE.MeshStandardMaterial({color:0x3b2430,roughness:.9})); floor.rotation.x=-Math.PI/2; floor.position.y=-.17; floor.receiveShadow=true; scene.add(floor);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15,.008,8,96),new THREE.MeshStandardMaterial({color:0xc7a15e,metalness:.6,roughness:.4})); ring.rotation.x=Math.PI/2; ring.position.y=-.155; scene.add(ring);
      buildAvatar(activeGender);
      let dragging = false, lastX = 0, lastY = 0;
      renderer.domElement.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; renderer.domElement.setPointerCapture?.(e.pointerId); });
      renderer.domElement.addEventListener('pointermove', e => { if (!dragging || !avatar.group) return; const dx = e.clientX-lastX; const dy = e.clientY-lastY; avatar.group.rotation.y += dx * .009; camera.position.y = Math.max(.7, Math.min(2.7, camera.position.y - dy * .006)); camera.lookAt(0,1.08,0); lastX=e.clientX; lastY=e.clientY; });
      const stopDrag = () => { dragging = false; };
      renderer.domElement.addEventListener('pointerup', stopDrag); renderer.domElement.addEventListener('pointercancel', stopDrag); renderer.domElement.addEventListener('pointerleave', stopDrag);
      renderer.domElement.addEventListener('wheel', e => { camera.position.z = Math.max(4.2, Math.min(7, camera.position.z + e.deltaY * .003)); camera.lookAt(0,1.08,0); }, {passive:true});
      const resize = () => { if(!renderer)return; const w=canvasHost.clientWidth||320,h=canvasHost.clientHeight||360; renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); };
      window.addEventListener('resize',resize);
      const render = () => { animationId=requestAnimationFrame(render); if (avatar.group && !dragging) avatar.group.rotation.y += .0015; renderer.render(scene,camera); };
      render();
    } catch (e) { console.error('N by N 3D viewer:',e); canvasHost.innerHTML='<div class="tryOnEmpty">تعذر تشغيل عرض 3D على هذا المتصفح. جرّب فتح الموقع في Safari أو Chrome مع تفعيل WebGL.</div>'; }
  }
  function setGender(g) { activeGender = g; document.querySelectorAll('.tryOnGender').forEach(b=>b.classList.toggle('active',b.dataset.avatar===g)); if (initialized) buildAvatar(g); }
  function updateCart(next) {
    cart = Array.isArray(next) ? next : (window.NBYN?.getCart?.() || []);
    const count = cart.reduce((n,p)=>n+Number(p.quantity||1),0);
    const label = $('#tryOnCount'); if(label) label.textContent = `${count} قطعة في السلة`;
    if (cart.length) {
      selectedItem = cart[cart.length-1];
      if (selectedItem.category === 'women') activeGender='women'; else if (selectedItem.category === 'men') activeGender='men';
      if (initialized) buildAvatar(activeGender);
      showItem(selectedItem);
      document.querySelectorAll('.tryOnGender').forEach(b=>b.classList.toggle('active',b.dataset.avatar===activeGender));
    } else { selectedItem=null; showItem(null); if(initialized) buildAvatar(activeGender); }
  }
  function openTryOn() {
    modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
    setTimeout(()=>{init(); if(renderer){renderer.setSize(canvasHost.clientWidth,canvasHost.clientHeight); camera.aspect=canvasHost.clientWidth/Math.max(canvasHost.clientHeight,1); camera.updateProjectionMatrix();}},80);
    updateCart(window.NBYN?.getCart?.() || cart);
  }
  window.addEventListener('nbyn:cart-updated',e=>updateCart(e.detail?.cart));
  window.addEventListener('nbyn:open-tryon',openTryOn);
  window.addEventListener('nbyn:item-added', e => { const item=e.detail?.item; if(!item)return; selectedItem=item; if(item.category==='women') activeGender='women'; else if(item.category==='men') activeGender='men'; if(initialized) buildAvatar(activeGender); showItem(selectedItem); document.querySelectorAll('.tryOnGender').forEach(b=>b.classList.toggle('active',b.dataset.avatar===activeGender)); });
  $('#tryOnBackToCart')?.addEventListener('click',()=>{modal.classList.remove('show');modal.setAttribute('aria-hidden','true');document.querySelector('#cart')?.classList.add('show');});
  document.querySelectorAll('.tryOnGender').forEach(b=>b.addEventListener('click',()=>setGender(b.dataset.avatar)));
  $('#tryOnReset')?.addEventListener('click',()=>{if(avatar.group) avatar.group.rotation.y=0;camera.position.set(0,1.55,5.7);camera.lookAt(0,1.08,0);});
  modal.addEventListener('click',e=>{if(e.target===modal){modal.classList.remove('show');modal.setAttribute('aria-hidden','true');}});
  updateCart(cart);
})();
