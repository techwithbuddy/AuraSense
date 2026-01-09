// Accessibility & interaction helpers: nav toggle, TTS, font scaling, contrast, form
(function(){
  // Authentication: redirect visitors to login page until they sign in (front-end demo)
  try{
    const path = window.location.pathname.split('/').pop();
    const isLogged = localStorage.getItem('aurasense_logged_in') === 'true';
    if(!isLogged && path !== 'index.html' && path !== 'login.html' && path !== ''){
      window.location.replace('index.html');
    }
  } catch(e){ /* ignore storage failures */ }

  const readBtn = document.getElementById('readBtn');
  const stopBtn = document.getElementById('stopReadBtn');
  const increaseBtn = document.getElementById('increaseFont');
  const decreaseBtn = document.getElementById('decreaseFont');
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('main-nav');
  const announcer = document.createElement('div');
  announcer.id = 'announcer';
  announcer.className = 'sr-only';
  announcer.setAttribute('aria-live','polite');
  document.body.appendChild(announcer);

  // Track elements currently being highlighted during speech
  let highlightedElements = [];

  function addReadingHighlight(element) {
    if (element && !element.classList.contains('reading-highlight')) {
      element.classList.add('reading-highlight');
      highlightedElements.push(element);
    }
  }

  function removeReadingHighlights() {
    highlightedElements.forEach(element => {
      element.classList.remove('reading-highlight');
    });
    highlightedElements = [];
  }

  //backend test
  fetch("https://aurasense-1.onrender.com/", {
  method: "POST",
  body: formData
})

  // add a small logout button to header when signed in
  function ensureAuthUI(){
    try{
      const logged = localStorage.getItem('aurasense_logged_in') === 'true';
      const headerInner = document.querySelector('.header-inner');
      const headerActions = document.querySelector('.header-actions');
      if(!headerInner) return;

      // logout button for signed-in users
      let logoutBtn = document.getElementById('logoutBtn');
      // sign-in link for signed-out users
      let signInLink = document.getElementById('signinLink');

      if(logged){
        // ensure logout button exists
        if(!logoutBtn){
          logoutBtn = document.createElement('button');
          logoutBtn.id = 'logoutBtn';
          logoutBtn.className = 'cta ghost';
          logoutBtn.textContent = 'Log out';
          logoutBtn.addEventListener('click', ()=>{ localStorage.removeItem('aurasense_logged_in'); localStorage.removeItem('aurasense_user'); window.location.replace('index.html'); });
          // append into header-actions if available for consistent layout
          if(headerActions) headerActions.appendChild(logoutBtn); else headerInner.appendChild(logoutBtn);
        }
        // remove sign-in link if present
        if(signInLink) signInLink.remove();
      } else {
        // remove logout button if present
        if(logoutBtn) logoutBtn.remove();
        // ensure sign-in link exists
        if(!signInLink){
          signInLink = document.createElement('a');
          signInLink.id = 'signinLink';
          signInLink.className = 'cta';
          signInLink.href = 'index.html';
          signInLink.setAttribute('aria-label','Sign in to AuraSense');
          signInLink.textContent = 'Sign in';
          if(headerActions) headerActions.appendChild(signInLink); else headerInner.appendChild(signInLink);
        }
      }
    }catch(e){/* ignore */}
  }
  ensureAuthUI();

  const contactForm = document.getElementById('contactForm');
  const formMessage = document.getElementById('formMessage');
  const main = document.getElementById('main');
  const year = document.getElementById('year');

  if(year) year.textContent = new Date().getFullYear();

  // dynamically set CSS variable for header offset so fixed header doesn't cover content
  const siteHeader = document.querySelector('.site-header');
  function updateHeaderOffset(){
    if(!siteHeader) return;
    const h = siteHeader.offsetHeight;
    document.documentElement.style.setProperty('--header-offset', h + 'px');
  }
  window.addEventListener('resize', ()=>{ setTimeout(updateHeaderOffset, 60); });
  // initial set after layout
  setTimeout(updateHeaderOffset, 80);

  function announce(msg){
    if(!announcer) return;
    announcer.textContent = msg;
  }

   function speakSequential(elements) {
    if(!('speechSynthesis' in window)){
      announce('Text-to-speech not supported in this browser');
      return;
    }
    window.speechSynthesis.cancel();
    removeReadingHighlights();
    
    let currentIndex = 0;
    
    function speakNext() {
      if (currentIndex >= elements.length) {
        removeReadingHighlights();
        announce('Finished reading page content');
        return;
      }
      
      const element = elements[currentIndex];
      if (!element) {
        currentIndex++;
        speakNext();
        return;
      }
      
      removeReadingHighlights(); // Clear previous highlights
      addReadingHighlight(element); // Highlight current element
      
      const text = element.innerText;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 1;
      
      u.onend = function() {
        currentIndex++;
        speakNext();
      };
      
      window.speechSynthesis.speak(u);
    }
    
    speakNext();
  }

  function readPageSummary(){
    const elementsToRead = [
      document.getElementById('hero-heading'),
      document.getElementById('intro'),
      document.getElementById('assistive-demo-heading'),
      document.getElementById('how-heading')
    ].filter(el => el); // Filter out any null elements
    
    speakSequential(elementsToRead);
  }

  if(readBtn) {
    readBtn.addEventListener('click', ()=>{ 
      readPageSummary(); 
      announce('Reading page content');
    });
  }

  // Assistive demo: voice-guided navigation and high-contrast preview
  const assistantBtn = document.getElementById('startAssistant');
  const contrastBtn = document.getElementById('contrastDemoBtn');
  let assistantRecognition = null;
  let assistantListening = false;

  function handleAssistantCommand(text){
    const t = text.toLowerCase();
    announce('Heard: ' + text);
    if(t.includes('read')){ readPageSummary(); return; }
    if(t.includes('stop')){ if('speechSynthesis' in window) window.speechSynthesis.cancel(); announce('Stopped reading'); return; }
    if(t.includes('increase font') || t.includes('bigger')){ setBaseFontSize(Math.min(32, getBaseFontSize()+2)); return; }
    if(t.includes('decrease font') || t.includes('smaller')){ setBaseFontSize(Math.max(12, getBaseFontSize()-2)); return; }
    if(t.includes('contact') || t.includes('go to contact')){ const el = document.getElementById('contact'); if(el){ el.scrollIntoView({behavior:'smooth'}); announce('Going to contact section'); } return; }
    if(t.includes('open menu')){ if(navToggle){ navToggle.click(); announce('Toggling menu'); } return; }
    if(t.includes('high contrast')){ const now = document.documentElement.classList.toggle('high-contrast'); announce(now ? 'High contrast enabled' : 'High contrast disabled'); if(contrastBtn) contrastBtn.setAttribute('aria-pressed', String(now)); return; }
    // fallback help
    if('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Sorry, I did not understand. Try: read the page, stop, increase font, decrease font, go to contact, open menu, or high contrast.');
      window.speechSynthesis.speak(u);
    }
  }

  if(assistantBtn){
    assistantBtn.addEventListener('click', ()=>{
      if(!window.SpeechRecognition && !window.webkitSpeechRecognition){ announce('Speech recognition not supported'); assistantBtn.setAttribute('aria-disabled','true'); return; }
      if(!assistantRecognition){
        const AR = window.SpeechRecognition || window.webkitSpeechRecognition;
        assistantRecognition = new AR();
        assistantRecognition.continuous = false;
        assistantRecognition.interimResults = false;
        assistantRecognition.lang = 'en-US';
        assistantRecognition.onresult = (ev)=>{ const transcript = Array.from(ev.results).map(r=>r[0].transcript).join(' '); handleAssistantCommand(transcript); };
        assistantRecognition.onend = ()=>{ assistantListening=false; assistantBtn.setAttribute('aria-pressed','false'); assistantBtn.textContent = 'Start assistant'; announce('Voice assistant stopped'); };
        assistantRecognition.onerror = (err)=>{ console.error(err); announce('Voice assistant error'); assistantListening=false; assistantBtn.setAttribute('aria-pressed','false'); assistantBtn.textContent='Start assistant'; };
      }
      if(!assistantListening){ try{ assistantRecognition.start(); assistantListening=true; assistantBtn.setAttribute('aria-pressed','true'); assistantBtn.textContent='Listening…'; announce('Voice assistant listening'); }catch(e){ console.error(e); } }
      else { try{ assistantRecognition.stop(); }catch(e){} }
    });
  }

  /*if(contrastBtn){
    contrastBtn.addEventListener('click', ()=>{ const now = document.documentElement.classList.toggle('high-contrast');
      siteHeader.classList.toggle('high-contrast', now);
      Section.classList.toggle('high-contrast', now);
      contrastBtn.setAttribute('aria-pressed', String(now)); announce(now ? 'High contrast enabled' : 'High contrast disabled'); });
  }*/

      if (contrastBtn) {
  contrastBtn.addEventListener('click', () => {
    const now = document.documentElement.classList.toggle('high-contrast');
    siteHeader.classList.toggle('high-contrast', now);
    Section.classList.toggle('high-contrast', now);
    contrastBtn.setAttribute('aria-pressed', String(now));
    localStorage.setItem('contrast', now ? 'on' : 'off'); // save choice
    announce(now ? 'High contrast enabled' : 'High contrast disabled');
    

  });
}

if (localStorage.getItem('contrast') === 'on') {
  document.documentElement.classList.add('high-contrast');
  siteHeader.classList.add('high-contrast');
  Section.classList.add('high-contrast');
  if (contrastBtn) {
    contrastBtn.setAttribute('aria-pressed', 'true');
  }
}


  
  // --- AI Image Description ---
  const imageInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');
  const describeBtn = document.getElementById('describeBtn');
  const speakDescBtn = document.getElementById('speakDescBtn');
  const imageDescText = document.getElementById('imageDescText');
  let lastDescription = '';
  let lastFile = null;

  function showPreview(file){
    if(!imagePreview) return;
    imagePreview.innerHTML = '';
    if(!file) return; const url = URL.createObjectURL(file); const img = document.createElement('img'); img.onload = ()=>{ URL.revokeObjectURL(url); }; img.src = url; imagePreview.appendChild(img); imagePreview.setAttribute('aria-hidden','false'); }

  imageInput && imageInput.addEventListener('change', (e)=>{ const f = e.target.files && e.target.files[0]; lastFile = f || null; showPreview(lastFile); if(!lastFile){ if(speakDescBtn) speakDescBtn.disabled=true; if(imageDescText) imageDescText.textContent=''; lastDescription=''; } });

  async function tryServerDescribe(file){
    try{
      const controller = new AbortController();
      const t = setTimeout(()=>controller.abort(), 11000);
      const fd = new FormData(); fd.append('image', file);
      const res = await fetch('/api/describe', {method:'POST',body:fd,signal:controller.signal}); clearTimeout(t);
      if(!res.ok) return null; const j = await res.json(); if(j && j.description) return j.description; return null;
    }catch(e){ return null; }
  }

  function rgbToColorName(r,g,b){
    const colors = {red:[220,20,60],orange:[255,140,0],yellow:[255,215,0],green:[34,139,34],blue:[30,144,255],purple:[148,0,211],brown:[160,82,45],gray:[128,128,128],black:[8,8,8],white:[245,245,245]};
    let best='colorful'; let bestD=Infinity;
    for(const [name,vals] of Object.entries(colors)){
      const d = Math.hypot(r-vals[0],g-vals[1],b-vals[2]); if(d<bestD){ bestD=d; best=name; }}
    return best;
  }

  function localDescribe(file){
    return new Promise((resolve)=>{
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = ()=>{
        const w = img.naturalWidth, h = img.naturalHeight; const orientation = w>=h ? 'landscape' : 'portrait';
        // draw small canvas to sample colors
        const canvas = document.createElement('canvas'); const sw = 160; canvas.width = sw; canvas.height = Math.round(sw * (h/w)); const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0,canvas.width,canvas.height);
        try{
          const data = ctx.getImageData(0,0,canvas.width,canvas.height).data; let r=0,g=0,b=0,count=0; for(let i=0;i<data.length;i+=16){ r+=data[i]; g+=data[i+1]; b+=data[i+2]; count++; }
          r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count); const color = rgbToColorName(r,g,b);
          URL.revokeObjectURL(url);
          resolve(`A ${orientation} photo, ${w} by ${h} pixels, mostly ${color} in tone.`);
        }catch(e){ URL.revokeObjectURL(url); resolve(`A photo, ${w} by ${h} pixels.`); }
      };
      img.onerror = ()=>{ URL.revokeObjectURL(url); resolve('An image was selected but could not be loaded.'); };
      img.src = url;
    });
  }

  describeBtn && describeBtn.addEventListener('click', async ()=>{
    if(!lastFile){ announce('Please select an image to describe.'); return; }
    announce('Describing image…'); describeBtn.disabled=true; let desc = null;
    // try server first
    desc = await tryServerDescribe(lastFile);
    if(!desc){ desc = await localDescribe(lastFile); desc = desc + ' (local description)'; }
    lastDescription = desc; if(imageDescText) imageDescText.textContent = desc; 
    if('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(desc);
      window.speechSynthesis.speak(u);
    }
    if(speakDescBtn) speakDescBtn.disabled=false; describeBtn.disabled=false; announce('Description ready');
  });

  speakDescBtn && speakDescBtn.addEventListener('click', ()=>{ 
    if(lastDescription && 'speechSynthesis' in window){ 
      const u = new SpeechSynthesisUtterance(lastDescription);
      window.speechSynthesis.speak(u);
      announce('Speaking description'); 
    } 
  });

  if(stopBtn) {
    stopBtn.addEventListener('click', ()=>{
      if('speechSynthesis' in window) window.speechSynthesis.cancel();
      removeReadingHighlights(); // Remove any active highlights
      announce('Stopped reading');
    });
  }

  function setBaseFontSize(size){
    document.documentElement.style.setProperty('--base-font-size', size + 'px');
    announce('Font size set to ' + size + ' pixels');
  }

  function getBaseFontSize(){
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--base-font-size')) || 18;
  }

  if(increaseBtn) {
    increaseBtn.addEventListener('click', ()=>{
      setBaseFontSize(Math.min(32, getBaseFontSize()+2));
    });
  }
  if(decreaseBtn) {
    decreaseBtn.addEventListener('click', ()=>{
      setBaseFontSize(Math.max(12, getBaseFontSize()-2));
    });
  }

  // Nav toggle for small screens + animated open/close and underline positioning
  const navUnderline = mainNav ? mainNav.querySelector('.nav-underline') : null;
  function updateNavIndicator(){
    if(!navUnderline || !mainNav) return;
    // find the active link
    const active = mainNav.querySelector('a[aria-current="page"]') || mainNav.querySelector('a');
    if(!active) { navUnderline.style.opacity = '0'; return; }
    const aRect = active.getBoundingClientRect();
    const navInner = mainNav.querySelector('.nav-inner') || mainNav;
    const navRect = navInner.getBoundingClientRect();
    const left = aRect.left - navRect.left + (navInner.scrollLeft || 0);
    navUnderline.style.width = aRect.width + 'px';
    navUnderline.style.left = left + 'px';
    navUnderline.style.opacity = '1';
  }

  if(navToggle && mainNav){
    navToggle.addEventListener('click', ()=>{
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      if(expanded){
        // close
        mainNav.classList.remove('open');
        setTimeout(()=>{ mainNav.hidden = true; }, 220);
        announce('Menu closed');
      } else {
        // open
        mainNav.hidden = false;
        // small delay to allow transitions
        setTimeout(()=>{ mainNav.classList.add('open'); updateNavIndicator(); }, 10);
        announce('Menu opened');
      }
    });

    // set active on click and close nav on small screens
    mainNav.querySelectorAll('a').forEach(a=>a.addEventListener('click', (ev)=>{
      // set aria-current
      mainNav.querySelectorAll('a').forEach(x=>x.removeAttribute('aria-current'));
      a.setAttribute('aria-current','page');
      updateNavIndicator();
      if(window.innerWidth <= 800){
        mainNav.classList.remove('open'); mainNav.hidden = true; navToggle.setAttribute('aria-expanded','false');
      }
    }));

    // position underline on load and resize
    window.addEventListener('resize', ()=>{ setTimeout(updateNavIndicator, 60); });
    // initial position once DOM is stable
    setTimeout(updateNavIndicator, 80);
  }

  // Keyboard shortcuts
  window.addEventListener('keydown', (e)=>{
    if(!e.altKey) return;
    if(e.key.toLowerCase() === 'r' && readBtn){ e.preventDefault(); readBtn.focus(); readBtn.click(); }
    if(e.key === '+' && increaseBtn){ e.preventDefault(); increaseBtn.click(); }
    if(e.key === '-' && decreaseBtn) { e.preventDefault(); decreaseBtn.click(); }
  });



  // Contact form handler (demo)
  if(contactForm){
    contactForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = contactForm.querySelector('#name').value.trim();
      const email = contactForm.querySelector('#email').value.trim();
      const message = contactForm.querySelector('#message').value.trim();
      if(!name || !email || !message){
        formMessage.textContent = 'Please fill in all fields';
        announce('Please fill in all fields');
        return;
      }
      // Simulate send
      formMessage.textContent = 'Thanks — your message was sent.';
      announce('Message sent. We will get back to you soon.');
      contactForm.reset();
    });
  }

  // --- Emergency SOS floating button ---
  function getSavedEmergency(){
    try{ return localStorage.getItem('aurasense_emergency'); } catch(e){ return null; }
  }

  function ensureSosButton(){
    let sos = document.getElementById('sosButton');
    const saved = getSavedEmergency();
    // default emergency number if user hasn't set one
    const fallback = '112';
    const phone = saved || fallback;
    const href = 'tel:'+phone;

    if(!sos){
      sos = document.createElement('a');
      sos.id = 'sosButton';
      sos.className = 'emergency-btn';
      sos.href = href;
      sos.setAttribute('role','button');
      sos.setAttribute('aria-label','Call emergency contact');
      sos.title = 'Call emergency contact';
      sos.setAttribute('tabindex','0');
      sos.innerHTML = '<span style="font-weight:900;letter-spacing:0.5px">SOS</span>';
      // Immediately initiate the tel: navigation on click (no confirmation)
      sos.addEventListener('click', (ev)=>{ ev.preventDefault(); announce('Calling emergency contact'); window.location.href = href; });
      // support keyboard activation (Enter / Space)
      sos.addEventListener('keydown', (ev)=>{ if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); announce('Calling emergency contact'); window.location.href = href; } });
      document.body.appendChild(sos);
    } else {
      sos.href = href;
    }
  }

  // update across tabs when localStorage changes
  window.addEventListener('storage', (ev)=>{
    if(ev.key === 'aurasense_emergency') ensureSosButton();
  });

  // ensure button on load
  ensureSosButton();

  // Card hover functionality for reading aloud
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      // Clear any existing highlights and speech
      removeReadingHighlights();
      if('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      // Get the text content from the card
      const cardLink = card.querySelector('.card-link');
      const title = card.querySelector('h4') ? card.querySelector('h4').textContent : '';
      const description = card.querySelector('p') ? card.querySelector('p').textContent : '';

      // Add highlight to the card
      addReadingHighlight(card);

      // Speak the card content
      const textToSpeak = title + '. ' + description;
      if('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(textToSpeak);
        u.lang = 'en-US';
        u.rate = 1;
        window.speechSynthesis.speak(u);
      }
    });

    card.addEventListener('mouseleave', () => {
      // Stop speech and remove highlight
      if('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      removeReadingHighlights();
    });
  });

  // Hover to speak aria-label for circular cards
  const circularCards = document.querySelectorAll('.circular-card');
  circularCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      const text = card.textContent.trim();
      if (text && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
    });
  });

  // Click to toggle grey for circular cards
  circularCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent link navigation
      card.classList.toggle('grey');
    });
  });

  //identify alphabet button
  const idAlphaBtn = document.getElementById('id-alpha');
  if (idAlphaBtn) {
    idAlphaBtn.addEventListener('mouseenter', () => {
      const text = idAlphaBtn.textContent.trim();
      if (text && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
    });
    idAlphaBtn.addEventListener('click', () => {
      const greyCards = Array.from(circularCards).filter(card => card.classList.contains('grey'));
      if (greyCards.length === 1 && greyCards[0] === circularCards[0]) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet A');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 2 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[2])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet B');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 2 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[1])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet C');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet D');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 2 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[3])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet E');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[2])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet F');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[3])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet G');
        window.speechSynthesis.speak(utterance);
      }  else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet H');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 2 && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[3])) {
        const utterance = new SpeechSynthesisUtterance('this is letter I');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[3])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet J');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 2 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet K');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet L');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[5]) && greyCards.includes(circularCards[3])) {
        const utterance = new SpeechSynthesisUtterance('this is letter M');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is letter N');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[5]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is letter O');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is letter P');
        window.speechSynthesis.speak(utterance);      } else if (greyCards.length === 5 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet Q');
        window.speechSynthesis.speak(utterance);      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is letter R');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is letter S');
        window.speechSynthesis.speak(utterance);      } else if (greyCards.length === 4 && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet T');
        window.speechSynthesis.speak(utterance);      } else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet U');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet V');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet W');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet X');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 5 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is letter Y');
        window.speechSynthesis.speak(utterance);
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet Z');
        window.speechSynthesis.speak(utterance);
      }
    });
  }

  // Reset button
  const resetBtn = document.getElementById('reset-dots');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      circularCards.forEach(card => {
        card.classList.remove('grey');
      });
    });
    // Hover to speak text
    resetBtn.addEventListener('mouseenter', () => {
      const text = resetBtn.textContent.trim();
      if (text && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
    });
  }

})();
