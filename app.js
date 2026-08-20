(() => {
  'use strict';
  const STORAGE = 'mamma58_stato_v1';
  const app = document.querySelector('#app');
  const toast = document.querySelector('#toast');
  const debugDialog = document.querySelector('#debug-dialog');
  const games = [
    { id:'sequenza', icon:'✨', title:'Formazione lampo', note:'Memoria visiva' },
    { id:'coppie', icon:'🃏', title:'Il derby delle coppie', note:'Attenzione e memoria' },
    { id:'passaggi', icon:'⚽', title:'Passaggio perfetto', note:'Ricorda lo schema' },
    { id:'ritmo', icon:'🎵', title:'Il ritmo del cuore', note:'Ascolta e riconosci' },
    { id:'logica', icon:'🔢', title:'La scala del 58', note:'Numeri e intuizione' },
    { id:'quiz', icon:'🏟️', title:'Quiz nerazzurro', note:'Cinque domande sull’Inter' }
  ];
  const initial = { completed:[], sound:true, gifts:[], confirmed:false, welcomed:false };
  let state = load();
  let timers = [];
  let titleTaps = 0;
  let audio;

  function load() { try { return {...initial, ...JSON.parse(localStorage.getItem(STORAGE)||'{}')}; } catch { return {...initial}; } }
  function save() { localStorage.setItem(STORAGE, JSON.stringify(state)); }
  function clearTimers() { timers.forEach(clearTimeout); timers=[]; }
  function later(fn,ms) { const id=setTimeout(fn,ms); timers.push(id); return id; }
  function showToast(message) { toast.textContent=message; toast.classList.add('show'); later(()=>toast.classList.remove('show'),2200); }
  function tone(freq=440,duration=.09,type='sine') {
    if (!state.sound) return;
    audio ||= new (window.AudioContext||window.webkitAudioContext)();
    const o=audio.createOscillator(), g=audio.createGain(); o.type=type; o.frequency.value=freq; g.gain.setValueAtTime(.07,audio.currentTime); g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration); o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime+duration);
  }
  function finish(id) { if(!state.completed.includes(id)) state.completed.push(id); save(); tone(740,.15); later(()=>{ confetti(); renderCup(); },650); }
  function confetti() { for(let i=0;i<35;i++){ const e=document.createElement('i'); e.className='confetti'; e.style.left=Math.random()*100+'vw'; e.style.background=['#0879f9','#05070c','#f4c95d','#fff'][i%4]; e.style.animationDelay=Math.random()*.5+'s'; document.body.append(e); later(()=>e.remove(),3200); } }
  function progress() { return Math.round(state.completed.length/games.length*100); }
  function shell(game, content, instruction) { app.innerHTML=`<section class="panel"><div class="game-head"><div class="challenge-icon">${game.icon}</div><div><div class="eyebrow">SFIDA ${games.indexOf(game)+1} DI 6</div><h2>${game.title}</h2></div></div><p class="instruction">${instruction}</p>${content}<div id="game-status" class="status" aria-live="polite"></div></section>`; app.focus(); }
  function status(text) { const e=document.querySelector('#game-status'); if(e)e.textContent=text; }

  function renderWelcome() {
    clearTimers(); app.innerHTML=`<section class="hero"><div class="eyebrow">20 AGOSTO 2026 · UNA GIORNATA SPECIALE</div><h1>Buon <span class="age">58°</span><br>compleanno!</h1><p class="lead">Sei convocata per la più importante sfida nerazzurra dell’anno: sei prove di memoria, musica, logica e passione interista.</p><div class="actions"><button id="start" class="button gold">Entra in campo</button></div><p class="instruction">Niente paura: puoi riprovare ogni sfida e il regalo non dipende dal punteggio.</p></section>`;
    document.querySelector('#start').onclick=()=>{state.welcomed=true;save();renderCup();};
  }
  function renderCup() {
    clearTimers(); const unlocked=state.completed.length===games.length;
    app.innerHTML=`<section><div class="eyebrow">COPPA DELLA MAMMA NERAZZURRA</div><h1>La sfida della mente</h1><div class="progress-wrap"><div class="progress-copy"><span>${state.completed.length} sfide completate</span><span>${progress()}%</span></div><div class="progress"><span style="width:${progress()}%"></span></div></div><div class="cup-grid">${games.map(g=>`<button class="challenge ${state.completed.includes(g.id)?'done':''}" data-game="${g.id}"><span class="challenge-icon">${g.icon}</span><span><strong>${g.title}</strong><small>${g.note}</small></span><span class="challenge-state">${state.completed.includes(g.id)?'★':'›'}</span></button>`).join('')}</div><div class="actions"><button id="reward" class="button gold" ${unlocked?'':'disabled'}>${unlocked?'Apri la sala dei regali':'Completa le 6 sfide'}</button></div></section>`;
    app.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>startGame(b.dataset.game)); document.querySelector('#reward').onclick=()=>renderCelebration();
  }
  function startGame(id) { clearTimers(); ({sequenza:gameSequence,coppie:gamePairs,passaggi:gamePasses,ritmo:gameRhythm,logica:gameLogic,quiz:gameQuiz})[id](); }

  function gameSequence() {
    const game=games[0], sequence=Array.from({length:5},()=>Math.floor(Math.random()*4)); let input=[], locked=true;
    shell(game,`<div class="pads">${[0,1,2,3].map(i=>`<button class="pad" data-pad="${i}" aria-label="Tasto ${i+1}"></button>`).join('')}</div><div class="actions"><button id="show-sequence" class="button">Mostra la sequenza</button></div>`,'Osserva i cinque lampi, poi tocca i colori nello stesso ordine.');
    const pads=[...app.querySelectorAll('.pad')];
    function flash(i,delay){later(()=>{pads[i].classList.add('lit');tone([330,440,550,660][i]);later(()=>pads[i].classList.remove('lit'),280);},delay);}
    document.querySelector('#show-sequence').onclick=()=>{locked=true;input=[];status('Guarda bene…');sequence.forEach((n,i)=>flash(n,500+i*650));later(()=>{locked=false;status('Ora tocca a te!');},500+sequence.length*650);};
    pads.forEach((p,i)=>p.onclick=()=>{if(locked)return;flash(i,0);input.push(i);if(sequence[input.length-1]!==i){locked=true;status('Quasi! Riproviamo con una nuova occhiata.');later(()=>document.querySelector('#show-sequence').click(),1000);}else if(input.length===sequence.length){locked=true;status('Memoria da fuoriclasse! ★');finish(game.id);}});
  }
  function gamePairs() {
    const game=games[1], icons=['⚽','🏆','🎵','💙']; const deck=[...icons,...icons].sort(()=>Math.random()-.5); let first=null,lock=false,found=0;
    shell(game,`<div class="memory-grid">${deck.map((x,i)=>`<button class="memory-card" data-i="${i}" data-icon="${x}" aria-label="Carta coperta">${x}</button>`).join('')}</div>`,'Trova tutte le quattro coppie. Le carte che indovini rimangono scoperte.');
    app.querySelectorAll('.memory-card').forEach(card=>card.onclick=()=>{if(lock||card.classList.contains('matched')||card===first)return;card.classList.add('open');tone(480,.06);if(!first){first=card;return;}if(card.dataset.icon===first.dataset.icon){card.classList.add('matched');first.classList.add('matched');first=null;found++;status(`Coppie trovate: ${found} su 4`);if(found===4){status('Derby vinto! ★');finish(game.id);}}else{lock=true;const prev=first;first=null;later(()=>{card.classList.remove('open');prev.classList.remove('open');lock=false;},700);}});
  }
  function gamePasses() {
    const game=games[2], pos=[[18,20],[76,18],[30,48],[72,52],[48,79]]; let seq=[0,2,4,3],input=[],locked=true;
    shell(game,`<div class="pitch">${pos.map((p,i)=>`<button class="player" data-player="${i}" style="left:${p[0]}%;top:${p[1]}%">${i+1}</button>`).join('')}</div><div class="actions"><button id="show-passes" class="button">Mostra lo schema</button></div>`,'Segui il pallone, poi ricrea i quattro passaggi toccando le giocatrici.');
    const players=[...app.querySelectorAll('.player')];
    function flash(i,d){later(()=>{players[i].classList.add('flash');tone(380+i*55);later(()=>players[i].classList.remove('flash'),300);},d);}
    document.querySelector('#show-passes').onclick=()=>{locked=true;input=[];status('Segui il pallone…');seq.forEach((n,i)=>flash(n,450+i*650));later(()=>{locked=false;status('Ricrea lo schema!');},450+seq.length*650);};
    players.forEach((p,i)=>p.onclick=()=>{if(locked)return;flash(i,0);input.push(i);if(seq[input.length-1]!==i){locked=true;status('Passaggio intercettato. Riguardiamo lo schema!');later(()=>document.querySelector('#show-passes').click(),850);}else if(input.length===seq.length){locked=true;status('Azione perfetta! ★');finish(game.id);}});
  }
  function gameRhythm() {
    const game=games[3], patterns=[[1,1,2,1],[2,1,1,2],[1,2,2,1]], answer=Math.floor(Math.random()*3); let played=false;
    shell(game,`<div class="rhythm-stage"><div class="record">♫</div></div><div class="actions"><button id="listen" class="button">Ascolta il ritmo</button></div><div class="choices">${patterns.map((p,i)=>`<button class="choice" data-rhythm="${i}">${p.map(n=>n===1?'TA':'TAA').join(' · ')}</button>`).join('')}</div>`,'Ascolta il ritmo originale e scegli la sequenza che gli corrisponde.');
    const record=document.querySelector('.record');
    document.querySelector('#listen').onclick=()=>{played=true;status('Ascolta…');let t=250;patterns[answer].forEach(n=>{later(()=>{record.classList.add('beat');tone(n===1?520:360,n===1?.12:.28);later(()=>record.classList.remove('beat'),150);},t);t+=n===1?430:680;});later(()=>status('Qual era il ritmo?'),t);};
    app.querySelectorAll('[data-rhythm]').forEach(b=>b.onclick=()=>{if(!played){showToast('Prima ascolta il ritmo');return;}if(+b.dataset.rhythm===answer){b.classList.add('correct');status('Hai il ritmo nel cuore! ★');finish(game.id);}else{b.classList.add('wrong');status('Non proprio: puoi riascoltarlo e riprovare.');later(()=>b.classList.remove('wrong'),700);}});
  }
  function gameLogic() {
    const game=games[4], qs=[
      {q:'20 + 8 + 19 + 11 = ?',a:['56','58','60'],ok:1},
      {q:'2 · 5 · 8 · 11 · ?',a:['13','14','15'],ok:1},
      {q:'Quante stelle servono per arrivare da 50 a 58?',a:['6','8','10'],ok:1}
    ]; let index=0,score=0;
    function draw(){const x=qs[index];shell(game,`<div class="quiz-meta"><span>Enigma ${index+1} di ${qs.length}</span><span>${score} punti</span></div><div class="logic-box">${x.q}</div><div class="choices">${x.a.map((a,i)=>`<button class="choice" data-answer="${i}">${a}</button>`).join('')}</div>`,'Tre piccoli enigmi conducono al numero speciale di oggi.');app.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(+b.dataset.answer===x.ok){score++;b.classList.add('correct');tone(680,.12);status('Esatto!');}else{b.classList.add('wrong');app.querySelector(`[data-answer="${x.ok}"]`).classList.add('correct');status('La soluzione era '+x.a[x.ok]+'.');}app.querySelectorAll('[data-answer]').forEach(z=>z.disabled=true);later(()=>{index++;if(index<qs.length)draw();else{status('La scala porta proprio a 58! ★');finish(game.id);}},850);});} draw();
  }
  function gameQuiz() {
    const game=games[5]; let index=0,correct=0,usedHelp=false;
    const qs=[
      {q:'In quale anno è nata l’Inter?',a:['1899','1908','1927'],ok:1,e:'L’Inter fu fondata a Milano il 9 marzo 1908.'},
      {q:'Quali sono i colori storici dell’Inter?',a:['Nero e azzurro','Rosso e nero','Bianco e celeste'],ok:0,e:'Il nero e l’azzurro rappresentano la notte e il cielo.'},
      {q:'Chi segnò entrambi i gol nella finale europea del 2010?',a:['Javier Zanetti','Diego Milito','Samuel Eto’o'],ok:1,e:'Diego Milito firmò il 2–0 contro il Bayern Monaco.'},
      {q:'Come viene chiamata l’impresa dell’Inter nel 2010?',a:['La doppietta','Il Triplete','La rimonta'],ok:1,e:'Scudetto, Coppa Italia e Champions League: il celebre Triplete.'},
      {q:'Chi detiene il record di presenze con la maglia dell’Inter?',a:['Javier Zanetti','Giuseppe Meazza','Giacinto Facchetti'],ok:0,e:'Javier Zanetti ha disputato 858 partite con l’Inter.'}
    ];
    function draw(){const x=qs[index];shell(game,`<div class="quiz-meta"><span>Domanda ${index+1} di ${qs.length}</span><span>${correct} risposte esatte</span></div><h2>${x.q}</h2><div class="choices">${x.a.map((a,i)=>`<button class="choice" data-answer="${i}">${a}</button>`).join('')}</div><div class="actions"><button id="fifty" class="button secondary" ${usedHelp?'disabled':''}>Aiuto 50:50</button></div><div id="explanation"></div>`,'Rispondi alle domande. Puoi sbagliare e continuare: qui si gioca per divertirsi.');
      document.querySelector('#fifty').onclick=()=>{usedHelp=true;const wrong=[0,1,2].filter(i=>i!==x.ok);app.querySelector(`[data-answer="${wrong[Math.floor(Math.random()*wrong.length)]}"]`).disabled=true;document.querySelector('#fifty').disabled=true;};
      app.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const ok=+b.dataset.answer===x.ok;if(ok){correct++;b.classList.add('correct');tone(720,.12);}else{b.classList.add('wrong');app.querySelector(`[data-answer="${x.ok}"]`).classList.add('correct');}app.querySelectorAll('[data-answer]').forEach(z=>z.disabled=true);document.querySelector('#explanation').innerHTML=`<p class="explanation"><strong>${ok?'Esatto!':'La risposta giusta era '+x.a[x.ok]+'.'}</strong><br>${x.e}</p>`;later(()=>{index++;if(index<qs.length)draw();else{status(`${correct} su ${qs.length}: passione nerazzurra! ★`);finish(game.id);}},1500);});
    } draw();
  }
  function renderCelebration(){clearTimers();app.innerHTML=`<section class="celebration"><div class="eyebrow">TUTTE LE SFIDE SUPERATE</div><div class="trophy">🏆</div><h1>Campionessa!</h1><p class="lead">Buon 58° compleanno! Questa coppa è per te, con tutto il nostro amore.</p><p><strong>Bruno, Alessandro e Christian</strong><br>con la partecipazione di Carmen e Helene</p><div class="actions"><button id="choose" class="button gold">Scegli due regali</button></div></section>`;confetti();document.querySelector('#choose').onclick=renderGifts;}
  const giftOptions=[['cornice','🖼️','Cornice digitale'],['maglia','👕','Maglia Inter ufficiale'],['camomilla','🛍️','Buono per il negozio Camomilla'],['viaggio','✈️','Viaggio + biglietto partita Inter']];
  function renderGifts(){clearTimers();app.innerHTML=`<section><div class="eyebrow">SALA DEI REGALI</div><h1>Scegline due</h1><p class="lead">Oggi sei tu a decidere. Tocca due regali, controlla la scelta e poi conferma.</p><div class="gift-grid">${giftOptions.map(([id,icon,name])=>`<button class="gift ${state.gifts.includes(id)?'selected':''}" data-gift="${id}"><span class="gift-icon">${icon}</span><strong>${name}</strong><span class="gift-check">${state.gifts.includes(id)?'✓':''}</span></button>`).join('')}</div><div class="selection-count">Hai scelto <span id="gift-count">${state.gifts.length}</span> regali su 2</div><div class="actions"><button id="confirm-gifts" class="button gold" ${state.gifts.length===2?'':'disabled'}>Conferma la scelta</button></div></section>`;
    app.querySelectorAll('[data-gift]').forEach(b=>b.onclick=()=>{const id=b.dataset.gift,idx=state.gifts.indexOf(id);if(idx>=0)state.gifts.splice(idx,1);else if(state.gifts.length<2)state.gifts.push(id);else{showToast('Hai già scelto due regali');return;}save();renderGifts();});document.querySelector('#confirm-gifts').onclick=()=>{state.confirmed=true;save();renderFinal();};
  }
  function renderFinal(){clearTimers();const names=state.gifts.map(id=>giftOptions.find(g=>g[0]===id)[2]);app.innerHTML=`<section class="panel final-card"><div class="eyebrow">SCELTA UFFICIALE</div><h1>Affare fatto!</h1><p>La campionessa ha scelto:</p><div class="final-gifts">${names.map(n=>`★ ${n}`).join('<br>')}</div><p>Mostra questa schermata a Bruno, Alessandro e Christian. La dirigenza provvederà!</p><div class="actions"><button id="share" class="button gold">Condividi la scelta</button><button id="edit" class="button secondary">Modifica</button></div></section>`;confetti();document.querySelector('#edit').onclick=()=>{state.confirmed=false;save();renderGifts();};document.querySelector('#share').onclick=async()=>{const text=`Per il mio 58° compleanno ho scelto: ${names.join(' e ')}! 💙🖤`;try{if(navigator.share)await navigator.share({title:'La mia scelta nerazzurra',text});else{await navigator.clipboard.writeText(text);showToast('Scelta copiata negli appunti');}}catch{}};}

  function openDebug(){const box=document.querySelector('#debug-actions');box.innerHTML=games.map(g=>`<button type="button" class="button secondary" data-debug-game="${g.id}">${g.icon} ${g.title}</button>`).join('')+`<button type="button" class="button gold" data-debug="reward">Sala regali</button><button type="button" class="button secondary" data-debug="complete">Completa tutto</button><button type="button" class="button secondary" data-debug="reset">Azzera dati</button>`;box.querySelectorAll('[data-debug-game]').forEach(b=>b.onclick=()=>{debugDialog.close();startGame(b.dataset.debugGame);});box.querySelector('[data-debug="reward"]').onclick=()=>{debugDialog.close();renderGifts();};box.querySelector('[data-debug="complete"]').onclick=()=>{state.completed=games.map(g=>g.id);save();debugDialog.close();renderCup();};box.querySelector('[data-debug="reset"]').onclick=()=>{state={...initial};save();debugDialog.close();renderWelcome();};debugDialog.showModal();}
  document.querySelector('.brand').addEventListener('click',()=>{titleTaps++;if(titleTaps>=7){titleTaps=0;openDebug();}later(()=>titleTaps=0,2500);});
  document.querySelector('#home-button').onclick=renderCup;
  document.querySelector('#sound-button').onclick=()=>{state.sound=!state.sound;save();document.querySelector('#sound-button').textContent=state.sound?'♪':'×';showToast(state.sound?'Suoni attivi':'Suoni disattivati');if(state.sound)tone(520);};
  if(new URLSearchParams(location.search).get('debug')==='58') later(openDebug,200);
  document.querySelector('#sound-button').textContent=state.sound?'♪':'×';
  if(state.confirmed&&state.gifts.length===2)renderFinal();else if(state.welcomed)renderCup();else renderWelcome();
})();
