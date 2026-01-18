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

  // Tab key navigation voice announcement
  function getFocusedElementText(element) {
    if (!element) return '';
    
    // Get the visible text content
    let text = '';
    
    // Check for aria-label (most descriptive)
    if (element.getAttribute('aria-label')) {
      text = element.getAttribute('aria-label');
    }
    // Check for alt text (images)
    else if (element.tagName === 'IMG' && element.alt) {
      text = 'Image: ' + element.alt;
    }
    // Check for placeholder (inputs)
    else if (element.placeholder) {
      text = element.placeholder;
    }
    // Check for value (inputs with values)
    else if (element.value && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
      text = element.value;
    }
    // Check for title attribute
    else if (element.title) {
      text = element.title;
    }
    // Get visible text content
    else if (element.textContent && element.textContent.trim()) {
      text = element.textContent.trim();
    }
    // Check for role
    else if (element.getAttribute('role')) {
      text = element.getAttribute('role') + ' element';
    }
    // Fall back to tag name
    else {
      text = element.tagName.toLowerCase();
    }
    
    // Add element type info for form elements
    if (element.tagName === 'INPUT') {
      const type = element.type || 'text';
      text = type + ' input: ' + text;
    } else if (element.tagName === 'BUTTON') {
      text = 'Button: ' + text;
    } else if (element.tagName === 'A') {
      text = 'Link: ' + text;
    } else if (element.tagName === 'SELECT') {
      text = 'Dropdown: ' + text;
    }
    
    // Limit length to avoid very long announcements
    if (text.length > 150) {
      text = text.substring(0, 147) + '...';
    }
    
    return text;
  }

  // Listen for Tab key press and announce focused element
  let lastFocusedElement = null;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      // Wait a moment for focus to change
      setTimeout(() => {
        const focused = document.activeElement;
        if (focused && focused !== document.body && focused !== lastFocusedElement) {
          lastFocusedElement = focused;
          const text = getFocusedElementText(focused);
          if (text && 'speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            // Speak the focused element
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.2; // Slightly faster for better navigation experience
            utterance.volume = 1.0;
            window.speechSynthesis.speak(utterance);
          }
        }
      }, 50);
    }
  });


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
        document.getElementById("output").textContent  = 'this is alphabet A';
      } else if (greyCards.length === 2 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[2])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet B');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent =  'this is alphabet B';
      } else if (greyCards.length === 2 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[1])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet C');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet C';
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet D');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet D';
      } else if (greyCards.length === 2 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[3])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet E');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet E';
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[2])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet F');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet F';
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[3])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet G');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet G';
      }  else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet H');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet H';
      } else if (greyCards.length === 2 && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[3])) {
        const utterance = new SpeechSynthesisUtterance('this is letter I');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is letter I';
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[3])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet J');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet J';
      } else if (greyCards.length === 2 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet K');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet K';
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet L');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet L';
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[5]) && greyCards.includes(circularCards[3])) {
        const utterance = new SpeechSynthesisUtterance('this is letter M');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is letter M';
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is letter N');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is letter N';
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[5]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is letter O');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is letter O';
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is letter P');
        window.speechSynthesis.speak(utterance);  
        document.getElementById("output").textContent = 'this is letter P';
      } else if (greyCards.length === 5 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet Q');
        window.speechSynthesis.speak(utterance); 
        document.getElementById("output").textContent = 'this is alphabet Q';
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is letter R');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is letter R';
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is letter S');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is letter S';
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet T');
        window.speechSynthesis.speak(utterance);   
        document.getElementById("output").textContent = 'this is alphabet T';
      } else if (greyCards.length === 3 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet U');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet U';
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet V');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet V';
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[2]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet W');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet W';
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet X');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet X';
      } else if (greyCards.length === 5 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[1]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is letter Y');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is letter Y';
      } else if (greyCards.length === 4 && greyCards.includes(circularCards[0]) && greyCards.includes(circularCards[3]) && greyCards.includes(circularCards[4]) && greyCards.includes(circularCards[5])) {
        const utterance = new SpeechSynthesisUtterance('this is alphabet Z');
        window.speechSynthesis.speak(utterance);
        document.getElementById("output").textContent = 'this is alphabet Z';
      }
    });
  }

 

  // Reset button
  const resetBtn = document.getElementById('reset-dots');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      circularCards.forEach(card => {
        card.classList.remove('grey');
        document.getElementById("output").textContent = '';
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

   fetch("https://aurasense-1.onrender.com")
  .then(response => response.json())   // convert response to JSON
  .then(data => {
    console.log(data);                 // do something with the data
  })
  .catch(error => {
    console.error("Error:", error);    // handle errors
  });

})();
