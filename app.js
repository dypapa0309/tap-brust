(() => {
  const GAME_TIME = 30;
  const TARGET_SIZE = 84;
  const STORAGE_KEY = "tap-burst-best-html";

  const el = {
    bestScore: document.getElementById("bestScore"),
    timeValue: document.getElementById("timeValue"),
    scoreValue: document.getElementById("scoreValue"),
    comboValue: document.getElementById("comboValue"),
    comboSub: document.getElementById("comboSub"),
    board: document.getElementById("board"),
    readyOverlay: document.getElementById("readyOverlay"),
    resultOverlay: document.getElementById("resultOverlay"),
    startBtn: document.getElementById("startBtn"),
    restartBtn: document.getElementById("restartBtn"),
    shareBtn: document.getElementById("shareBtn"),
    targetsLayer: document.getElementById("targetsLayer"),
    burstsLayer: document.getElementById("burstsLayer"),
    particlesLayer: document.getElementById("particlesLayer"),
    finalWarning: document.getElementById("finalWarning"),
    warningSeconds: document.getElementById("warningSeconds"),
    resultScore: document.getElementById("resultScore"),
    resultRank: document.getElementById("resultRank"),
    resultComment: document.getElementById("resultComment"),
    resultBest: document.getElementById("resultBest"),
  };

  const state = {
    phase: "ready",
    secondsLeft: GAME_TIME,
    score: 0,
    combo: 0,
    multiplier: 1,
    bestScore: Number(localStorage.getItem(STORAGE_KEY) || 0),
    clockTimer: null,
    spawnTimer: null,
    targets: new Map(),
  };

  const targetTypes = {
    normal: { emoji: "🫧", label: "+1", points: 1, particle: "#7ad8ff" },
    bonus: { emoji: "⭐", label: "+2", points: 2, particle: "#ffd25f" },
    trap: { emoji: "💣", label: "-3", points: -3, particle: "#ff6e8e" },
  };

  function makeComment(score) {
    if (score <= 10) return "이건… 연습이 조금 필요해 보여 😅";
    if (score <= 40) return "손은 있는데 아직 폭주 단계는 아니야.";
    if (score <= 70) return "오, 이 정도면 꽤 빠르다. 상위권 냄새 난다.";
    return "이건 거의 인간이 아니다. 손가락에 엔진 달았네.";
  }

  function getRank(score) {
    if (score <= 10) return "입문자";
    if (score <= 25) return "예열 완료";
    if (score <= 45) return "고속 손가락";
    if (score <= 70) return "상위권";
    return "괴물";
  }

  function pickTargetType(secondsLeft) {
    const elapsed = GAME_TIME - secondsLeft;
    const roll = Math.random();

    if (elapsed < 10) {
      if (roll < 0.78) return "normal";
      if (roll < 0.94) return "bonus";
      return "trap";
    }
    if (elapsed < 20) {
      if (roll < 0.68) return "normal";
      if (roll < 0.88) return "bonus";
      return "trap";
    }
    if (roll < 0.58) return "normal";
    if (roll < 0.82) return "bonus";
    return "trap";
  }

  function getSpawnInterval(secondsLeft) {
    const elapsed = GAME_TIME - secondsLeft;
    if (elapsed < 10) return 720;
    if (elapsed < 20) return 520;
    return 340;
  }

  function getLifetime(secondsLeft) {
    const elapsed = GAME_TIME - secondsLeft;
    if (elapsed < 10) return 900;
    if (elapsed < 20) return 700;
    return 480;
  }

  function getMultiplier(combo) {
    if (combo >= 18) return 3;
    if (combo >= 10) return 2;
    return 1;
  }

  function updateHud() {
    state.multiplier = getMultiplier(state.combo);
    el.bestScore.textContent = `${state.bestScore}점`;
    el.timeValue.textContent = `${state.secondsLeft}s`;
    el.scoreValue.textContent = `${state.score}`;
    el.comboValue.textContent = `x${state.multiplier}`;
    el.comboSub.textContent = `연속 ${state.combo}회`;

    if (state.secondsLeft <= 5 && state.phase === "playing") {
      el.finalWarning.classList.remove("hidden");
      el.warningSeconds.textContent = state.secondsLeft;
      el.board.classList.add("warning");
    } else {
      el.finalWarning.classList.add("hidden");
      el.board.classList.remove("warning");
    }
  }

  function clearGameVisuals() {
    el.targetsLayer.innerHTML = "";
    el.burstsLayer.innerHTML = "";
    el.particlesLayer.innerHTML = "";
    state.targets.clear();
  }

  function resetGame() {
    clearTimeout(state.spawnTimer);
    clearInterval(state.clockTimer);
    clearGameVisuals();
    state.phase = "playing";
    state.secondsLeft = GAME_TIME;
    state.score = 0;
    state.combo = 0;
    updateHud();
    el.readyOverlay.classList.remove("overlay-visible");
    el.readyOverlay.classList.add("hidden");
    el.resultOverlay.classList.add("hidden");
  }

  function startGame() {
    resetGame();

    state.clockTimer = setInterval(() => {
      state.secondsLeft -= 1;
      if (state.secondsLeft <= 0) {
        state.secondsLeft = 0;
        updateHud();
        endGame();
        return;
      }
      updateHud();
    }, 1000);

    scheduleSpawn(100);
  }

  function endGame() {
    clearInterval(state.clockTimer);
    clearTimeout(state.spawnTimer);
    state.phase = "result";

    state.targets.forEach((value) => {
      clearTimeout(value.expireTimer);
    });
    clearGameVisuals();

    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      localStorage.setItem(STORAGE_KEY, String(state.bestScore));
    }

    updateHud();

    el.resultScore.textContent = `${state.score}점`;
    el.resultRank.textContent = `등급: ${getRank(state.score)}`;
    el.resultComment.textContent = makeComment(state.score);
    el.resultBest.textContent = `${state.bestScore}점`;

    el.resultOverlay.classList.remove("hidden");
    el.resultOverlay.classList.add("overlay-visible");
  }

  function scheduleSpawn(delay) {
    clearTimeout(state.spawnTimer);
    state.spawnTimer = setTimeout(() => {
      if (state.phase !== "playing") return;
      spawnTarget();
      scheduleSpawn(getSpawnInterval(state.secondsLeft));
    }, delay);
  }

  function spawnTarget() {
    const rect = el.board.getBoundingClientRect();
    const maxX = Math.max(16, rect.width - TARGET_SIZE - 16);
    const maxY = Math.max(16, rect.height - TARGET_SIZE - 16);

    const type = pickTargetType(state.secondsLeft);
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const left = Math.random() * maxX + 8;
    const top = Math.random() * maxY + 8;
    const lifetime = getLifetime(state.secondsLeft);

    const btn = document.createElement("button");
    btn.className = `target ${type}`;
    btn.style.left = `${left}px`;
    btn.style.top = `${top}px`;
    btn.setAttribute("type", "button");
    btn.innerHTML = `
      <span class="target-face">
        <span class="target-emoji">${targetTypes[type].emoji}</span>
        <span class="target-label">${targetTypes[type].label}</span>
      </span>
    `;

    const handleTap = (e) => {
      e.preventDefault();
      hitTarget(id, left + TARGET_SIZE / 2, top + TARGET_SIZE / 2);
    };

    btn.addEventListener("pointerdown", handleTap, { passive: false });
    btn.addEventListener("click", (e) => e.preventDefault());

    el.targetsLayer.appendChild(btn);
    requestAnimationFrame(() => btn.classList.add("show"));

    const expireTimer = setTimeout(() => {
      const target = state.targets.get(id);
      if (!target || state.phase !== "playing") return;
      removeTarget(id);
      state.combo = 0;
      updateHud();
    }, lifetime + 20);

    state.targets.set(id, { id, type, left, top, button: btn, expireTimer });
  }

  function removeTarget(id) {
    const target = state.targets.get(id);
    if (!target) return;
    clearTimeout(target.expireTimer);
    target.button.classList.remove("show");
    setTimeout(() => {
      target.button.remove();
    }, 120);
    state.targets.delete(id);
  }

  function hitTarget(id, x, y) {
    if (state.phase !== "playing") return;
    const target = state.targets.get(id);
    if (!target) return;

    const meta = targetTypes[target.type];
    removeTarget(id);

    let gained = meta.points;
    if (target.type === "trap") {
      state.combo = 0;
      state.score = Math.max(0, state.score + meta.points);
    } else {
      state.combo += 1;
      const mult = getMultiplier(state.combo);
      gained = meta.points * mult;
      state.score += gained;
    }

    makeBurst(x, y, meta.emoji, gained);
    makeParticles(x, y, meta.particle, target.type === "trap" ? 12 : 18);
    updateHud();
  }

  function makeBurst(x, y, emoji, value) {
    const div = document.createElement("div");
    div.className = `burst-text ${value >= 0 ? "good" : "bad"}`;
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    div.innerHTML = `
      <div class="emoji">${emoji}</div>
      <div class="value">${value >= 0 ? `+${value}` : value}</div>
    `;
    el.burstsLayer.appendChild(div);
    setTimeout(() => div.remove(), 720);
  }

  function makeParticles(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const p = document.createElement("div");
      const angle = Math.random() * Math.PI * 2;
      const distance = 22 + Math.random() * 68;
      const dx = `${Math.cos(angle) * distance}px`;
      const dy = `${Math.sin(angle) * distance}px`;

      p.className = "particle";
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.background = color;
      p.style.setProperty("--dx", dx);
      p.style.setProperty("--dy", dy);
      p.style.width = `${8 + Math.random() * 12}px`;
      p.style.height = p.style.width;
      el.particlesLayer.appendChild(p);

      setTimeout(() => p.remove(), 640);
    }
  }

  async function shareResult() {
    const text = `나 방금 30초 광클 챌린지에서 ${state.score}점 찍음. ${makeComment(state.score)} 너도 해봐.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "30초 광클 챌린지",
          text,
          url: window.location.href,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        alert("공유 문구가 복사됐어.");
        return;
      }

      prompt("이 문구를 복사해줘.", `${text} ${window.location.href}`);
    } catch (err) {
      console.error(err);
    }
  }

  function bindEvents() {
    el.startBtn.addEventListener("click", startGame);
    el.restartBtn.addEventListener("click", startGame);
    el.shareBtn.addEventListener("click", shareResult);
  }

  bindEvents();
  updateHud();
})();
