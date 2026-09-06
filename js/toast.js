/* ===========================================================
   toast.js
   =========================================================== */

function showToast(message, options = {}) {
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  el.className = 'toast';
  const messageEl = document.createElement('span');
  messageEl.className = 'toast-msg';
  messageEl.textContent = message;
  el.appendChild(messageEl);

  if (options.action && typeof options.onAction === 'function') {
    const actionEl = document.createElement('button');
    actionEl.type = 'button';
    actionEl.className = 'toast-action';
    actionEl.textContent = options.action;
    el.appendChild(actionEl);
    actionEl.addEventListener('click', () => {
      options.onAction();
      el.remove();
    });
  }

  stack.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    el.style.transition = 'opacity 160ms ease, transform 160ms ease';
    setTimeout(() => el.remove(), 180);
  }, 2200);
}
