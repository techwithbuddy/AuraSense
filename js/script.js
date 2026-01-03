// Accessibility & interaction helpers: nav toggle, TTS, font scaling, contrast, form
(function(){
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

  const contactForm = document.getElementById('contactForm');
  const formMessage = document.getElementById('formMessage');
  const main = document.getElementById('main');
  const year = document.getElementById('year');

  year.textContent = new Date().getFullYear();

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

  function speak(text){
    if(!('speechSynthesis' in window)){
      announce('Text-to-speech not supported in this browser');
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 1;
    window.speechSynthesis.speak(u);
  }

  readBtn.addEventListener('click', ()=>{
    // read a concise summary of the page
    const parts = [document.getElementById('hero-heading').innerText, document.getElementById('intro').innerText, document.getElementById('features-heading').innerText, document.getElementById('how-heading').innerText];
    speak(parts.join('. '));
    announce('Reading page content');
  });

  stopBtn.addEventListener('click', ()=>{
    if('speechSynthesis' in window) window.speechSynthesis.cancel();
    announce('Stopped reading');
  });

  function setBaseFontSize(size){
    document.documentElement.style.setProperty('--base-font-size', size + 'px');
    announce('Font size set to ' + size + ' pixels');
  }

  function getBaseFontSize(){
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--base-font-size')) || 18;
  }

  increaseBtn.addEventListener('click', ()=>{
    setBaseFontSize(Math.min(32, getBaseFontSize()+2));
  });
  decreaseBtn.addEventListener('click', ()=>{
    setBaseFontSize(Math.max(12, getBaseFontSize()-2));
  });

  // Nav toggle for small screens + animated open/close and underline positioning
  const navUnderline = mainNav ? mainNav.querySelector('.nav-underline') : null;
  function updateNavIndicator(){
    if(!navUnderline) return;
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
    if(e.key.toLowerCase() === 'r'){ e.preventDefault(); readBtn.focus(); readBtn.click(); }
    if(e.key === '+'){ e.preventDefault(); increaseBtn.click(); }
    if(e.key === '-') { e.preventDefault(); decreaseBtn.click(); }
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

  // --- Emergency feature: call contact, share location, and support voice-trigger "I need help" ---
  const EM_KEY = 'aura_emergency_contact';
  const emergencyBtn = document.getElementById('emergencyBtn');
  const emergencyModal = document.getElementById('emergencyModal');
  const saveEmergencyBtn = document.getElementById('saveEmergencyBtn');
  const closeEmergencyBtn = document.getElementById('closeEmergencyBtn');
  const emergencyNameInput = document.getElementById('emergencyName');
  const emergencyPhoneInput = document.getElementById('emergencyPhone');
  const voiceToggle = document.getElementById('voiceToggle');

  function loadEmergencyContact(){
    try{ return JSON.parse(localStorage.getItem(EM_KEY)) || null }catch(e){ return null }
  }
  function saveEmergencyContact(c){ localStorage.setItem(EM_KEY, JSON.stringify(c)); }

  function openModal(){
    if(!emergencyModal) return;
    const c = loadEmergencyContact();
    emergencyNameInput.value = (c && c.name) ? c.name : '';
    emergencyPhoneInput.value = (c && c.phone) ? c.phone : '';
    emergencyModal.setAttribute('aria-hidden','false');
    emergencyNameInput.focus();
  }
  function closeModal(){ if(!emergencyModal) return; emergencyModal.setAttribute('aria-hidden','true'); emergencyBtn.focus(); }

  if(emergencyBtn){
    emergencyBtn.addEventListener('click', async ()=>{
      const contact = loadEmergencyContact();
      if(!contact || !contact.phone){
        announce('No emergency contact saved. Opening settings.');
        openModal();
        return;
      }

      announce('Triggering emergency: calling ' + (contact.name || contact.phone));

      // Try to get location (with timeout)
      function getLocation(timeout=8000){
        return new Promise((resolve)=>{
          if(!('geolocation' in navigator)){ return resolve(null); }
          let done=false;
          const timer = setTimeout(()=>{ if(!done){ done=true; resolve(null); } }, timeout);
          navigator.geolocation.getCurrentPosition((pos)=>{
            if(done) return; done=true; clearTimeout(timer);
            resolve({latitude: pos.coords.latitude, longitude: pos.coords.longitude});
          }, (err)=>{ if(done) return; done=true; clearTimeout(timer); resolve(null); }, {enableHighAccuracy:true,maximumAge:0,timeout:timeout});
        });
      }

      const coords = await getLocation();
      const locMsg = coords ? `https://maps.google.com/?q=${coords.latitude},${coords.longitude}` : 'Location not available';
      const text = `Emergency! I need help. ${locMsg}`;

      // Try Web Share if available (gives user option to send via installed apps)
      if(navigator.share){
        try{ await navigator.share({title:'Emergency',text:text,url: coords ? locMsg : undefined}); announce('Shared emergency details'); }catch(e){ /* user cancelled or not available */ }
      }

      // Try SMS first (pre-fill message), then attempt call
      try{
        const smsBody = encodeURIComponent(text);
        // note: different platforms use different separators - most use ?body= but iOS uses & after number in some contexts
        const smsLink = `sms:${contact.phone}?body=${smsBody}`;
        // open SMS; this may navigate away on mobile
        window.location.href = smsLink;
      }catch(e){ console.error(e); }

      // After a short delay, open tel: to call
      setTimeout(()=>{ try{ window.location.href = `tel:${contact.phone}`; }catch(e){ console.error(e); } }, 1200);
    });

    // keyboard shortcut Alt+H for quick emergency
    window.addEventListener('keydown', (e)=>{ if(e.altKey && e.key.toLowerCase() === 'h'){ e.preventDefault(); emergencyBtn.click(); } });
  }

  // Modal save/close handlers
  if(saveEmergencyBtn){
    saveEmergencyBtn.addEventListener('click', ()=>{
      const name = emergencyNameInput.value.trim();
      const phone = emergencyPhoneInput.value.trim();
      if(!phone){ announce('Please enter a phone number'); emergencyPhoneInput.focus(); return; }
      saveEmergencyContact({name, phone});
      announce('Emergency contact saved: ' + (name || phone));
      closeModal();
    });
  }
  if(closeEmergencyBtn){ closeEmergencyBtn.addEventListener('click', ()=>{ closeModal(); }); }

  // Close modal when clicking outside
  if(emergencyModal){
    emergencyModal.addEventListener('click', (ev)=>{ if(ev.target === emergencyModal){ closeModal(); } });
  }

  // Voice trigger: listen for phrase "I need help"
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  let recognition = null; let listening = false;
  if(SpeechRec){
    recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (ev)=>{
      const transcript = Array.from(ev.results).map(r=>r[0].transcript).join(' ').toLowerCase();
      if(transcript.includes('i need help')){
        announce('Voice trigger detected. Triggering emergency.');
        emergencyBtn.click();
      }
    };
    recognition.onstart = ()=>{ voiceToggle.setAttribute('aria-pressed','true'); announce('Voice detection enabled'); };
    recognition.onend = ()=>{ voiceToggle.setAttribute('aria-pressed','false'); announce('Voice detection stopped'); if(listening){ /* attempt to restart */ try{ recognition.start(); }catch(e){} } };
    recognition.onerror = (err)=>{ console.error('Speech recognition error', err); announce('Voice recognition error'); };
  } else {
    // If not supported, disable control
    if(voiceToggle){ voiceToggle.setAttribute('aria-disabled','true'); voiceToggle.title = 'Speech recognition not supported'; }
  }

  if(voiceToggle){
    voiceToggle.addEventListener('click', ()=>{
      if(!recognition) { announce('Voice detection not supported in this browser'); return; }
      listening = !listening;
      if(listening){ try{ recognition.start(); }catch(e){ announce('Unable to start voice detection'); listening = false; voiceToggle.setAttribute('aria-pressed','false'); } } else { try{ recognition.stop(); }catch(e){} }
    });
  }

})();
