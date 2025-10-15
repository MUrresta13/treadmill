(() => {
  // MEDIUM difficulty: 4×4
  const SIZE = 4;
  const COUNT = SIZE * SIZE;

  const startOverlay = document.getElementById('startOverlay');
  const startBtn     = document.getElementById('startBtn');
  const gameRoot     = document.getElementById('game');

  const boardEl = document.getElementById('puzzle');
  const movesEl = document.getElementById('moves');
  const newBtn  = document.getElementById('newBtn');
  const gridLabel = document.getElementById('gridLabel');

  const refImg  = document.getElementById('refImg');

  const winModal = document.getElementById('winModal');
  const closeWin = document.getElementById('closeWin');
  const copyBtn  = document.getElementById('copyBtn');
  const passInput= document.getElementById('passcode');

  let tiles = [];
  let emptyIndex = 0;
  let moves = 0;
  let spriteURL = '';

  gridLabel.textContent = `${SIZE}×${SIZE}`;

  startBtn.addEventListener('click', async () => {
    startOverlay.style.display = 'none';
    gameRoot.classList.remove('hidden');

    const imgSrc = boardEl.dataset.img || 'Halloween Puzzle.PNG';
    spriteURL = await preloadImage(imgSrc);
    refImg.src = spriteURL;

    // set board grid to SIZE × SIZE (overrides CSS)
    boardEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${SIZE}, 1fr)`;

    build();
  });

  newBtn.addEventListener('click', build);
  closeWin.addEventListener('click', () => winModal.classList.add('hidden'));
  copyBtn.addEventListener('click', () => {
    passInput.select(); passInput.setSelectionRange(0, 999);
    try { document.execCommand('copy'); copyBtn.textContent = 'Copied!'; } catch {}
    setTimeout(() => (copyBtn.textContent = 'Copy code'), 1100);
  });

  // keep swipes from scrolling the page
  boardEl.addEventListener('touchmove', (e) => e.preventDefault(), {passive:false});

  function build() {
    moves = 0; movesEl.textContent = '0';
    boardEl.innerHTML = '';

    const goal = Array.from({length: COUNT}, (_, i) => i);
    let perm;
    do {
      perm = shuffle(goal.slice(0, COUNT - 1));
      perm.push(COUNT - 1);
    } while (!isSolvableOdd(perm));      // 4×4 uses “odd inversion” rule like 5×5

    tiles = perm;
    emptyIndex = tiles.indexOf(COUNT - 1);

    tiles.forEach((n, idx) => {
      const cell = document.createElement('div');
      cell.className = 'tile';
      cell.dataset.pos = idx;

      if (n === COUNT - 1) {
        cell.classList.add('empty');
      } else {
        const x = n % SIZE;
        const y = Math.floor(n / SIZE);
        cell.style.backgroundImage = `url("${spriteURL}")`;
        cell.style.backgroundSize = `${SIZE*100}% ${SIZE*100}%`;
        cell.style.backgroundPosition = `${(x/(SIZE-1))*100}% ${(y/(SIZE-1))*100}%`;
      }

      cell.addEventListener('click', () => tryMove(idx));
      cell.addEventListener('touchstart', () => tryMove(idx), {passive:true});
      boardEl.appendChild(cell);
    });
  }

  function tryMove(idx) {
    if (!isAdjacent(idx, emptyIndex)) return;
    swapTiles(idx, emptyIndex);
    emptyIndex = idx;
    moves++; movesEl.textContent = moves;
    if (isSolved()) winModal.classList.remove('hidden');
  }

  function swapTiles(i, j){
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    const a = boardEl.children[i], b = boardEl.children[j];
    a.classList.toggle('empty'); b.classList.toggle('empty');

    const ai=a.style.backgroundImage, ap=a.style.backgroundPosition;
    const bi=b.style.backgroundImage, bp=b.style.backgroundPosition;
    a.style.backgroundImage=bi; a.style.backgroundPosition=bp;
    b.style.backgroundImage=ai; b.style.backgroundPosition=ap;
  }

  function isAdjacent(i, j){
    const ix=i%SIZE, iy=Math.floor(i/SIZE);
    const jx=j%SIZE, jy=Math.floor(j/SIZE);
    return Math.abs(ix-jx)+Math.abs(iy-jy)===1;
  }
  function isSolved(){
    for(let i=0;i<COUNT;i++) if(tiles[i]!==i) return false;
    return true;
  }
  function isSolvableOdd(arr){
    const flat = arr.slice(0, COUNT-1);
    let inv=0;
    for(let i=0;i<flat.length;i++)
      for(let j=i+1;j<flat.length;j++)
        if(flat[i]>flat[j]) inv++;
    return inv%2===0;
  }
  function shuffle(a){
    const arr=a.slice();
    for(let i=arr.length-1;i>0;i--){
      const j=(Math.random()*(i+1))|0; [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }
  function preloadImage(src){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(encodeURI(src));
      img.onerror=reject;
      img.src=encodeURI(src);
    });
  }
})();
