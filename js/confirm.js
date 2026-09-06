/* ===========================================================
   confirm.js
   Reusable confirmation dialog for destructive actions.
   Usage: confirmDialog({ title, desc, confirmLabel, danger }).then(ok => ...)
   =========================================================== */

function confirmDialog({ title, desc, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirm-overlay');
    const dialog = document.getElementById('confirm-dialog');

    dialog.innerHTML = `
      <h3 class="confirm-title">${escapeHtml(title)}</h3>
      <p class="confirm-desc">${escapeHtml(desc)}</p>
      <div class="confirm-actions">
        <button class="btn btn-secondary" id="confirm-cancel">${escapeHtml(cancelLabel)}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${escapeHtml(confirmLabel)}</button>
      </div>
    `;

    function close(result) {
      overlay.classList.remove('show');
      setTimeout(() => { overlay.hidden = true; }, 180);
      document.removeEventListener('keydown', onKey);
      resolve(result);
    }

    function onKey(e) {
      if (e.key === 'Escape') close(false);
    }

    dialog.querySelector('#confirm-cancel').addEventListener('click', () => close(false));
    dialog.querySelector('#confirm-ok').addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); }, { once: true });
    document.addEventListener('keydown', onKey);

    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
