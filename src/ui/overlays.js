export function hideOverlay(el) {
  el.classList.remove('show');
  el.classList.add('hidden');
}

export function showOverlay(el) {
  el.classList.remove('hidden');
  el.classList.add('show');
}
