
// --- Wire Protocol (single-player, medium difficulty) ---
const COLORS = ['RED','BLUE','GREEN','YELLOW','WHITE','BLACK'];

// Elements
const wiresEl = document.getElementById('wires');
const rulesEl  = document.getElementById('rules');
const timerEl  = document.getElementById('timer');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const boom = document.getElementById('boom');
const tryAgain = document.getElementById('tryAgain');
const success = document.getElementById('success');
const playAgain = document.getElementById('playAgain');
const copyBtn = document.getElementById('copy');

// Start overlay
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');

let state = {
  timer: 120,
  tickId: null,
  layout: [],        // [{color, id}]
  solutionIds: [],   // array of ids in order
  nextIndex: 0,
  started: false
};

function sample(arr){return arr[Math.floor(Math.random()*arr.length)];}
function shuffle(arr){return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]);}
function pad(n){return n.toString().padStart(2,'0');}

function renderTimer(){
  const m = Math.floor(state.timer/60), s = state.timer%60;
  timerEl.textContent = `${pad(m)}:${pad(s)}`;
}

function startTimer(){
  state.tickId = setInterval(()=>{
    if(!state.started) return;
    state.timer--;
    renderTimer();
    if(state.timer<=0){ fail('Time ran out.'); }
  },1000);
}

function stopTimer(){ clearInterval(state.tickId); state.tickId=null; }

// Build a fresh bomb
function newBomb(){
  // 5–7 wires, with duplicates allowed
  const count = 5 + Math.floor(Math.random()*3); // 5,6,7
  const layout = [];
  for(let i=0;i<count;i++){
    layout.push({color: sample(COLORS), id: cryptoRandom()});
  }
  state.layout = layout;
  renderWires();

  // Choose 3–5 TARGET wires to cut in order, then generate readable rules
  const ids = layout.map(w=>w.id);
  state.solutionIds = shuffle(ids).slice(0, 4); // exactly 4 cuts for medium
  state.nextIndex = 0;

  generateRules();
  statusEl.textContent = 'Follow the steps. Tap a wire to cut it.';
}

// Crypto-ish id
function cryptoRandom(){
  return Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
}

function renderWires(){
  wiresEl.innerHTML = '';
  state.layout.forEach((w, idx)=>{
    const li = document.createElement('li');
    li.className = `wire wire-${w.color}`;
    li.textContent = w.color;
    li.dataset.id = w.id;
    li.dataset.index = idx;
    li.addEventListener('click', onCut);
    wiresEl.appendChild(li);
  });
}

// Helper lookups on current layout
function indexOfId(id){
  return state.layout.findIndex(w=>w.id===id);
}
function neighbors(idx){
  return {up: idx>0?state.layout[idx-1]:null, down: idx<state.layout.length-1?state.layout[idx+1]:null};
}
function colorPositions(color){
  return state.layout.map((w,i)=>(w.color===color?i:-1)).filter(i=>i!==-1);
}
function ordinal(n){
  const map={1:'1st',2:'2nd',3:'3rd'}; return map[n]||`${n}th`;
}

// Create clear, unambiguous steps that correspond to chosen solutionIds
function generateRules(){
  rulesEl.innerHTML = '';
  const usedDescriptions = new Set();

  state.solutionIds.forEach((id, stepIdx)=>{
    const pos = indexOfId(id);
    const w = state.layout[pos];
    const same = colorPositions(w.color);

    let desc = '';

    // Prefer unique, deterministic descriptions
    if(same.length===1){
      desc = `Cut the only ${w.color} wire.`;
    }else if(pos === same[0]){
      desc = `Cut the leftmost ${w.color} wire.`;
    }else if(pos === same[same.length-1]){
      desc = `Cut the rightmost ${w.color} wire.`;
    }else{
      const k = same.indexOf(pos)+1;
      desc = `Cut the ${ordinal(k)} ${w.color} wire from the top.`;
    }

    // Add a neighbor-based cue if available (extra clarity / flavor)
    const nb = neighbors(pos);
    if(nb.up && nb.down && Math.random()<0.5){
      desc += ` (It sits between ${nb.up.color} and ${nb.down.color}.)`;
    }else if(nb.up && Math.random()<0.25){
      desc += ` (It is directly below ${nb.up.color}.)`;
    }else if(nb.down && Math.random()<0.25){
      desc += ` (It is directly above ${nb.down.color}.)`;
    }

    // Deduplicate wording just in case
    let attempt=0;
    while(usedDescriptions.has(desc) && attempt<5){
      // slightly tweak
      if(same.length>1){
        const k = same.indexOf(pos)+1;
        desc = `Cut the ${ordinal(k)} ${w.color} wire (counting from top).`;
      }else{
        desc = `Cut the ${w.color} wire.`;
      }
      attempt++;
    }
    usedDescriptions.add(desc);

    const li = document.createElement('li');
    li.textContent = `Step ${stepIdx+1}: ${desc}`;
    rulesEl.appendChild(li);
  });
}

function onCut(e){
  if(!state.started) return;
  const id = e.currentTarget.dataset.id;

  // already cut?
  if(e.currentTarget.classList.contains('cut')) return;

  const expected = state.solutionIds[state.nextIndex];
  if(id === expected){
    // Correct
    e.currentTarget.classList.add('cut');
    state.nextIndex++;
    flashLamp('green');
    if(state.nextIndex >= state.solutionIds.length){
      // Disarmed!
      state.started = false;
      stopTimer();
      document.getElementById('lamp1').classList.add('on');
      document.getElementById('lamp2').classList.add('on');
      document.getElementById('lamp3').classList.add('on');
      showSuccess();
    }
  }else{
    fail('Wrong wire.');
  }
}

function fail(reason){
  state.started = false;
  stopTimer();
  statusEl.textContent = `FAIL · ${reason}`;
  boom.classList.remove('hidden');
}

function showSuccess(){
  success.classList.remove('hidden');
}

function flashLamp(color){
  // simple visual feedback (reuse one lamp)
  const l = document.getElementById('lamp2');
  l.classList.add('on');
  setTimeout(()=>l.classList.remove('on'),200);
}

function resetGame(){
  // Reset state
  state.timer = 120;
  renderTimer();
  state.started = true;
  document.querySelectorAll('.lamp').forEach(l=>l.classList.remove('on'));
  boom.classList.add('hidden'); success.classList.add('hidden');
  newBomb();
  statusEl.textContent = 'Follow the steps. Tap a wire to cut it.';
}

// Clipboard
copyBtn.addEventListener('click', async ()=>{
  try{ await navigator.clipboard.writeText('RAVENPROTOCOL'); copyBtn.textContent='Copied!'; setTimeout(()=>copyBtn.textContent='Copy Code',1200);}catch{}
});

// Buttons
resetBtn.addEventListener('click', resetGame);
tryAgain?.addEventListener('click', ()=>{boom.classList.add('hidden'); resetGame();});
playAgain?.addEventListener('click', ()=>{success.classList.add('hidden'); resetGame();});

// Start overlay logic
startBtn.addEventListener('click', ()=>{
  startOverlay.remove();
  state.started = true;
  resetGame();
  if(!state.tickId) startTimer();
});

// Prepare initial renders
renderTimer();
