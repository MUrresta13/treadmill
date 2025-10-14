/* The Reverse Puzzle – sliding tiles with guaranteed-solvable shuffle */

const boardEl = document.getElementById('puzzle');
const movesEl = document.getElementById('moves');
const timeEl  = document.getElementById('time');
const reshuffleBtn = document.getElementById('reshuffleBtn');

const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const sizeSel = document.getElementById('size');

const modal = document.getElementById('modal');
const copyBtn = document.getElementById('copy');
const closeBtn = document.getElementById('close');
const againBtn = document.getElementById('playAgain');

let N = 4;                         // grid size
let tiles = [];                    // 0..(N*N-1), where 0 = blank
let blankIndex = 0;
let moves = 0;
let startTs = null;
let tickTimer = null;
let IMG = null;

// ——— helpers
const idx = (r,c)=> r*N + c;
const rc  = (i)=> [Math.floor(i/N), i%N];

function fmtTime(sec){
  const m = Math.floor(sec/60), s = sec%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// inversion count to test solvability
function inversions(arr){
  const flat = arr.filter(v=>v!==0);
  let inv = 0;
  for (let i=0;i<flat.length;i++)
    for (let j=i+1;j<flat.length;j++)
      if (flat[i] > flat[j]) inv++;
  return inv;
}
function isSolvable(arr){
  const inv = inversions(arr);
  if (N % 2 === 1) return inv % 2 === 0;                // odd grid
  const [rBlank] = rc(arr.indexOf(0));                   // row from 0 top
  const rowFromBottom = N - rBlank;                      // 1..N
  // even grid: (blank on even row from bottom & inversions odd) OR (odd row & inversions even)
  return (rowFromBottom % 2 === 0) ? (inv % 2 === 1) : (inv % 2 === 0);
}

function makeGoal(){
  // goal = [1,2,3,...,N*N-1,0]
  return Array.from({length:N*N}, (_,i)=> (i+1)%(N*N));
}

function shuffleSolvable(){
  let arr;
  do{
    arr = makeGoal()
      .sort(()=>Math.random()-0.5);
  } while(!isSolvable(arr) || isSolved(arr));
  return arr;
}

function isSolved(a = tiles){
  for (let i=0;i<a.length-1;i++) if (a[i] !== i+1) return false;
  return a[a.length-1] === 0;
}

function buildBoard(){
  boardEl.style.setProperty('grid-template-columns', `repeat(${N}, 1fr)`);
  boardEl.innerHTML = '';

  tiles.forEach((val, i)=>{
    const t = document.createElement('button');
    t.className = 'tile';
    t.tabIndex = 0;

    if (val === 0){
      t.classList.add('blank');
      t.setAttribute('aria-label', 'Blank');
    } else {
      // background slice
      const [r,c] = rc(val-1);
      t.style.backgroundImage = `url("${IMG}")`;
      t.style.backgroundSize = `${N*100}% ${N*100}%`;
      t.style.backgroundPosition = `${(c/(N-1))*100}% ${(r/(N-1))*100}%`;
      t.textContent = ''; // or show numbers for debugging
      t.setAttribute('aria-label', `Tile ${val}`);
    }

    t.addEventListener('click', ()=>tryMove(i));
    boardEl.appendChild(t);
  });
}

function tryMove(i){
  const can = neighbors(blankIndex).includes(i);
  if (!can) return;
  // swap
  [tiles[blankIndex], tiles[i]] = [tiles[i], tiles[blankIndex]];
  blankIndex = i;
  moves++;
  movesEl.textContent = moves;
  buildBoard();
  if (isSolved()){
    stopTimer();
    setTimeout(()=> showWin(), 120);
  }
}

function neighbors(i){
  const [r,c] = rc(i);
  const list = [];
  if (r>0) list.push(idx(r-1,c));
  if (r<N-1) list.push(idx(r+1,c));
  if (c>0) list.push(idx(r,c-1));
  if (c<N-1) list.push(idx(r,c+1));
  return list;
}

function startGame(){
  N = Number(sizeSel.value || 4);
  IMG = boardEl.dataset.img || 'Jigsaw Face.png';
  tiles = shuffleSolvable();
  blankIndex = tiles.indexOf(0);
  moves = 0;
  movesEl.textContent = moves;
  buildBoard();

  // timer
  startTs = Date.now();
  stopTimer();
  tickTimer = setInterval(()=>{
    const sec = Math.floor((Date.now() - startTs)/1000);
    timeEl.textContent = fmtTime(sec);
  }, 250);

  // focus first tile for keyboard play
  const firstTile = boardEl.querySelector('.tile:not(.blank)');
  if (firstTile) firstTile.focus();
}

function stopTimer(){ if (tickTimer) { clearInterval(tickTimer); tickTimer = null; } }

function showWin(){
  modal.classList.remove('hidden');
}

function closeWin(){
  modal.classList.add('hidden');
}

// keyboard controls
window.addEventListener('keydown', (e)=>{
  const key = e.key;
  if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) return;

  // move blank by simulating the opposite direction swap
  const [r,c] = rc(blankIndex);
  let target = null;
  if (key === 'ArrowUp'    && r < N-1) target = idx(r+1,c);
  if (key === 'ArrowDown'  && r > 0)   target = idx(r-1,c);
  if (key === 'ArrowLeft'  && c < N-1) target = idx(r,c+1);
  if (key === 'ArrowRight' && c > 0)   target = idx(r,c-1);
  if (target !== null) tryMove(target);
});

// UI events
startBtn.addEventListener('click', ()=>{
  overlay.classList.add('hidden');
  startGame();
});
reshuffleBtn.addEventListener('click', startGame);
copyBtn.addEventListener('click', ()=>{
  const v = document.getElementById('code').value;
  navigator.clipboard.writeText(v).then(()=>{
    copyBtn.textContent = 'Copied!';
    setTimeout(()=>copyBtn.textContent='Copy code', 900);
  });
});
againBtn.addEventListener('click', ()=>{
  closeWin();
  startGame();
});
closeBtn.addEventListener('click', closeWin);

// If image 404s, keep game playable with a pattern
function handleImageFallback(){
  const test = new Image();
  test.src = boardEl.dataset.img || 'Jigsaw Face.png';
  test.onload = ()=>{};        // all good
  test.onerror = ()=>{
    // swap to a subtle pattern if missing
    boardEl.dataset.img = '';
    document.querySelectorAll('.tile:not(.blank)').forEach(t=>{
      t.style.backgroundImage = 'radial-gradient(#202738, #0f172a)';
      t.style.backgroundSize = 'auto';
      t.style.backgroundPosition = 'center';
    });
  };
}
document.addEventListener('DOMContentLoaded', handleImageFallback);
