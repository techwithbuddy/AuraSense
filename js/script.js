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
})();
