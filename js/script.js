// Accessibility & interaction helpers: nav toggle, TTS, font scaling, contrast, form
(function(){
  const readBtn = document.getElementById('readBtn');
  const stopBtn = document.getElementById('stopReadBtn');
  const increaseBtn = document.getElementById('increaseFont');
  const decreaseBtn = document.getElementById('decreaseFont');
  const contrastToggle = document.getElementById('contrastToggle');
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

  // Contrast toggle
  contrastToggle.addEventListener('click', ()=>{
    const pressed = contrastToggle.getAttribute('aria-pressed') === 'true';
    contrastToggle.setAttribute('aria-pressed', String(!pressed));
    const enabled = !pressed;
    document.body.classList.toggle('high-contrast', enabled);
    announce(enabled ? 'High contrast enabled' : 'High contrast disabled');
  });

  // Nav toggle for small screens
  if(navToggle && mainNav){
    navToggle.addEventListener('click', ()=>{
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      if(expanded){
        mainNav.hidden = true;
        announce('Menu closed');
      } else {
        mainNav.hidden = false;
        announce('Menu opened');
      }
    });

    // close nav when link clicked
    mainNav.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>{
      if(window.innerWidth <= 800){
        mainNav.hidden = true; navToggle.setAttribute('aria-expanded','false');
      }
    }));
  }

  // Keyboard shortcuts
  window.addEventListener('keydown', (e)=>{
    if(!e.altKey) return;
    if(e.key.toLowerCase() === 'r'){ e.preventDefault(); readBtn.focus(); readBtn.click(); }
    if(e.key.toLowerCase() === 'h'){ e.preventDefault(); contrastToggle.focus(); contrastToggle.click(); }
    if(e.key === '+'){ e.preventDefault(); increaseBtn.click(); }
    if(e.key === '-') { e.preventDefault(); decreaseBtn.click(); }
  });

  // Ensure main can be focused so skip link works well
  document.querySelector('.skip-link').addEventListener('click', ()=>{
    main.focus();
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
