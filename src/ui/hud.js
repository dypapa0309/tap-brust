export function updateHUD(ui, state, getMultiplier) {
  const multiplier = getMultiplier(state.combo);
  ui.bestScore.textContent = `${state.bestScore}점`;
  ui.timeValue.textContent = `${state.secondsLeft}s`;
  ui.scoreValue.textContent = String(state.score);
  ui.comboValue.textContent = `x${multiplier}`;
  ui.comboSub.textContent = `연속 ${state.combo}회`;

  if (state.phase === 'playing' && state.secondsLeft <= 5) {
    ui.warningBar.classList.remove('hidden');
    ui.warningSec.textContent = String(state.secondsLeft);
    ui.board.classList.add('danger');
  } else {
    ui.warningBar.classList.add('hidden');
    ui.board.classList.remove('danger');
  }
}
