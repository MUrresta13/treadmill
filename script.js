(() => {
  const boardEl = document.getElementById('puzzle');
  const movesEl = document.getElementById('moves');
  const newBtn = document.getElementById('newBtn');

  const winModal = document.getElementById('winModal');
  const closeWin = document.getElementById('closeWin');
  const copyBtn = document.getElementById('copyBtn');
  const passInput = document.getElementById('passcode');

  const IMG = boardEl.dataset.img;   // "Halloween Puzzle.PNG"
  const SIZE = 5;                     // hard: 5×5
  const COUNT = SIZE * SIZE;

  let tiles = [];     // array of index positions 0..COUNT-1 (last is empty)
  let emptyIndex;     // index within tiles[] that is the empty slot
  let moves = 0;
  let spriteURL = '';

  // Preload the image, then build once ready
  preloadImage(IMG).then(url => {
    spriteURL = url;
    build();
  });

  newBtn.addEventListener('click', build);
  closeWin.addEventListener('click', () => winModal.classList.add('hidden'));
  copyBtn.addEventListener('click', () => {
    passInput.select(); passInput.setSelectionRange(0, 999);
    try { document.execCommand('copy'); copyBtn.textContent = 'Copied!'; }
    catch { /* ignore */ }
    setTimeout(() => (copyBtn.textContent = 'Copy code'), 1200);
  });

  function build() {
    // Reset
    moves = 0; movesEl.textContent = '0';
    boardEl.innerHTML = '';

    // Ordered goal arrangement (0..COUNT-2, last empty marker COUNT-1)
    const goal = Array.from({length: COUNT}, (_, i) => i);
    // Shuffle to a solvable permutation (for odd grid, even inversions)
    let perm;
    do {
      perm = shuffle(goal.slice(0, COUNT - 1)); // leave out last; it’s the empty
      perm.push(COUNT - 1); // empty at the end
    } while (!isSolvableOdd(perm));

    tiles = perm;
    emptyIndex = tiles.indexOf(COUNT - 1);

    // Render tiles
    tiles.forEach((n, idx) => {
      const cell = document.createElement('div');
      cell.className = 'tile';
      cell.dataset.pos = idx;

      if (n === COUNT - 1) {
        cell.classList.add('empty');
      } else {
        // compute background position for tile n in a 5x5 sprite
        const x = n % SIZE;
        const y = Math.floor(n / SIZE);
        cell.style.backgroundImage = `url("${spriteURL}")`;
        cell.style.backgroundSize = `${SIZE * 100}% ${SIZE * 100}%`;
        cell.style.backgroundPosition = `${(x * 100) / (SIZE - 1)}% ${(y * 100) / (SIZE - 1)}%`;
      }

      cell.addEventListener('click', () => tryMove(idx));
      cell.addEventListener('touchstart', () => tryMove(idx), {passive: true});
      boardEl.appendChild(cell);
    });
  }

  function tryMove(idx) {
    if (!isAdjacent(idx, emptyIndex)) return;
    // swap positions
    [tiles[idx], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[idx]];
    // update DOM
    const a = boardEl.children[idx];
    const b = boardEl.children[emptyIndex];
    a.classList.toggle('empty');
    b.classList.toggle('empty');

    // also swap their background positions so they carry the right slice
    const aImg = a.style.backgroundImage; const aPos = a.style.backgroundPosition;
    const bImg = b.style.backgroundImage; const bPos = b.style.backgroundPosition;
    a.style.backgroundImage = bImg; a.style.backgroundPosition = bPos;
    b.style.backgroundImage = aImg; b.style.backgroundPosition = aPos;

    emptyIndex = idx;
    moves++; movesEl.textContent = moves;

    if (isSolved()) showWin();
  }

  function isAdjacent(i, j) {
    const ix = i % SIZE, iy = Math.floor(i / SIZE);
    const jx = j % SIZE, jy = Math.floor(j / SIZE);
    const dx = Math.abs(ix - jx), dy = Math.abs(iy - jy);
    return (dx + dy) === 1;
  }

  function isSolved() {
    // solved when tiles are in 0..COUNT-1 order
    for (let i = 0; i < COUNT; i++) if (tiles[i] !== i) return false;
    return true;
  }

  // ----- Solvability helpers for odd grid size (5x5) -----
  function isSolvableOdd(arr) {
    // treat last value (empty) as max, not counted
    const flat = arr.slice(0, COUNT - 1);
    const inv = countInversions(flat);
    // For odd grid, solvable iff inversions count is even
    return inv % 2 === 0;
  }
  function countInversions(a) {
    let inv = 0;
    for (let i=0;i<a.length;i++){
      for (let j=i+1;j<a.length;j++){
        if (a[i] > a[j]) inv++;
      }
    }
    return inv;
  }
  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = reject;
      img.src = src;
    });
  }

  function showWin() {
    winModal.classList.remove('hidden');
  }
})();
