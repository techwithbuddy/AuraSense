// Accessibility & interaction helpers: nav toggle, TTS, font scaling, contrast, form
(function(){
  // Authentication: redirect visitors to login page until they sign in (front-end demo)
  try{
    const path = window.location.pathname.split('/').pop();
    const isLogged = localStorage.getItem('aurasense_logged_in') === 'true';
    if(!isLogged && path !== 'login.html'){
      window.location.replace('login.html');
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
          logoutBtn.addEventListener('click', ()=>{ localStorage.removeItem('aurasense_logged_in'); localStorage.removeItem('aurasense_user'); window.location.replace('login.html'); });
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
          signInLink.href = 'login.html';
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

  // Gradient background toggle (persisted)
  (function initGradientToggle(){
    try{
      const KEY = 'aurasense_gradient_disabled';
      const btn = document.createElement('button');
      btn.id = 'gradientToggle';
      btn.className = 'gradient-toggle';
      btn.type = 'button';
      btn.setAttribute('aria-pressed','false');
      btn.setAttribute('aria-label','Toggle animated background');

      function updateState(disabled){
        document.body.classList.toggle('no-gradient', !!disabled);
        btn.setAttribute('aria-pressed', String(!!disabled));
        btn.title = disabled ? 'Enable animated background' : 'Disable animated background';
        btn.textContent = disabled ? '✨ Off' : '✨ On';
      }

      btn.addEventListener('click', ()=>{
        const was = localStorage.getItem(KEY) === 'true';
        const now = !was;
        localStorage.setItem(KEY, String(now));
        updateState(now);
        if(typeof announce === 'function') announce(now ? 'Animated background disabled' : 'Animated background enabled');
      });

      // initialize
      const saved = localStorage.getItem(KEY) === 'true';
      updateState(saved);
      document.body.appendChild(btn);
    }catch(e){/* ignore */}
  })();

})();
