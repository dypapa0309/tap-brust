export function clearVisuals(ui, state) {
  state.targets.forEach((target) => {
    clearTimeout(target.expireTimer);
    target.el.remove();
  });

  state.targets.clear();
  ui.targetsLayer.innerHTML = '';
  ui.effectsLayer.innerHTML = '';
  ui.board.classList.remove('impact', 'combo-flash', 'combo-break');
}

export function spawnPopup(ui, x, y, emoji, value) {
  const el = document.createElement('div');
  el.className = `popup ${value >= 0 ? 'good' : 'bad'}`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.innerHTML = `
    <div class="pemoji">${emoji}</div>
    <div class="pvalue">${value >= 0 ? `+${value}` : value}</div>
  `;

  ui.effectsLayer.appendChild(el);
  window.setTimeout(() => el.remove(), 720);
}

export function spawnParticles(ui, x, y, color, count, skinFx) {
  for (let i = 0; i < count; i += 1) {
    const p = document.createElement('div');
    const angle = Math.random() * Math.PI * 2;
    const distance = 22 + Math.random() * 66;
    const size = 8 + Math.random() * 10;

    p.className = `particle ${skinFx?.particleShape || 'orb'}`;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = color;
    p.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);

    ui.effectsLayer.appendChild(p);
    window.setTimeout(() => p.remove(), 650);
  }
}

export function triggerBoardImpact(ui, state, type) {
  clearTimeout(state.boardFxTimer);
  ui.board.classList.remove('impact', 'combo-flash', 'combo-break');
  void ui.board.offsetWidth;
  ui.board.classList.add(type === 'trap' ? 'combo-break' : 'impact');

  if (type === 'bonus') {
    ui.board.classList.add('combo-flash');
  }

  state.boardFxTimer = window.setTimeout(() => {
    ui.board.classList.remove('impact', 'combo-flash', 'combo-break');
    state.boardFxTimer = null;
  }, 260);
}

export function spawnBurstRing(ui, x, y, color, isTrap, skinFx) {
  const ring = document.createElement('div');
  ring.className = `burst-ring ${isTrap ? 'trap' : 'good'}`;
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  ring.style.borderColor = color;
  if (skinFx?.aura) {
    ring.style.boxShadow = `0 0 24px ${skinFx.aura}`;
  }

  ui.effectsLayer.appendChild(ring);
  window.setTimeout(() => ring.remove(), 520);
}

export function maybeShowComboEffect(ui, state, x, y) {
  const combo = state.combo;
  let label = '';

  if (combo > 0 && combo % 18 === 0) {
    label = `${combo} COMBO x3`;
  } else if (combo > 0 && combo % 10 === 0) {
    label = `${combo} COMBO x2`;
  } else if (combo >= 5 && combo % 5 === 0) {
    label = `${combo} COMBO`;
  }

  if (!label) return;

  clearTimeout(state.comboFxTimer);
  ui.board.classList.remove('combo-flash');
  void ui.board.offsetWidth;
  ui.board.classList.add('combo-flash');
  state.comboFxTimer = window.setTimeout(() => {
    ui.board.classList.remove('combo-flash');
    state.comboFxTimer = null;
  }, 520);

  const badge = document.createElement('div');
  badge.className = 'combo-badge';
  badge.style.left = `${x}px`;
  badge.style.top = `${Math.max(72, y - 44)}px`;
  badge.innerHTML = `
    <span class="combo-badge-label">FEVER</span>
    <strong>${label}</strong>
  `;

  ui.effectsLayer.appendChild(badge);
  window.setTimeout(() => badge.remove(), 900);
}

export function spawnComboBreak(ui, x, y) {
  const badge = document.createElement('div');
  badge.className = 'combo-break-badge';
  badge.style.left = `${x}px`;
  badge.style.top = `${Math.max(74, y - 36)}px`;
  badge.textContent = 'COMBO BREAK';

  ui.effectsLayer.appendChild(badge);
  window.setTimeout(() => badge.remove(), 760);
}
