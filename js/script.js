// Simple accessibility helpers: text-to-speech, font scaling, contrast toggle
(function(){
  const readBtn = document.getElementById('readBtn');
  const stopBtn = document.getElementById('stopReadBtn');
  const increaseBtn = document.getElementById('increaseFont');
  const decreaseBtn = document.getElementById('decreaseFont');
  const contrastToggle = document.getElementById('contrastToggle');
  const main = document.getElementById('main');
  const year = document.getElementById('year');

  year.textContent = new Date().getFullYear();

  function speak(text){
    if(!('speechSynthesis' in window)){
      alert('Text-to-speech is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 1;
    window.speechSynthesis.speak(u);
  }

  readBtn.addEventListener('click', ()=>{
    // read main textual content (concise)
    const text = document.getElementById('intro').innerText + '\n' + document.getElementById('features-heading').innerText;
    speak(text);
  });

  stopBtn.addEventListener('click', ()=>{
    if('speechSynthesis' in window) window.speechSynthesis.cancel();
  });

  function setBaseFontSize(size){
    document.documentElement.style.setProperty('--base-font-size', size + 'px');
  }

  function getBaseFontSize(){
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--base-font-size')) || 18;
  }

  increaseBtn.addEventListener('click', ()=>{
    setBaseFontSize(Math.min(28, getBaseFontSize()+2));
  });
  decreaseBtn.addEventListener('click', ()=>{
    setBaseFontSize(Math.max(12, getBaseFontSize()-2));
  });

  // Contrast toggle
  contrastToggle.addEventListener('click', ()=>{
    const pressed = contrastToggle.getAttribute('aria-pressed') === 'true';
    contrastToggle.setAttribute('aria-pressed', String(!pressed));
    document.body.classList.toggle('high-contrast');
  });

  // Keyboard shortcuts: Alt+R read, Alt+H high contrast, Alt+Plus/Minus font
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
})();
