/* ===========================================================
   dashboard.js
   Simple overview: product count, invoice count, outstanding
   vs paid totals, and the 5 most recent invoices. Intentionally
   kept lightweight — no charts, no complex analytics.
   =========================================================== */

const DashboardPage = (() => {
  function t(key, vars) { return I18n.t('dashboard.' + key, vars); }

  function currency(n) {
    return '\u0E3F' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function statusLabel(s) {
    return I18n.t('invoices.status' + s.charAt(0).toUpperCase() + s.slice(1));
  }

  function render() {
    const root = document.getElementById('page-root');
    const products = Storage.getProducts();
    const invoices = Storage.getInvoices();

    if (products.length === 0 && invoices.length === 0) {
      root.innerHTML = `
        <div class="empty-state" style="margin-top:24px;">
          <div class="empty-icon">&#10024;</div>
          <h3 class="empty-title">${t('emptyTitle')}</h3>
          <p class="empty-desc">${t('emptyDesc')}</p>
          <button class="btn btn-primary" id="dash-add-product">${t('emptyCta')}</button>
        </div>
      `;
      document.getElementById('dash-add-product').addEventListener('click', () => {
        window.location.hash = '#/products';
      });
      return;
    }

    const outstanding = invoices
      .filter(i => i.status === 'unpaid')
      .reduce((sum, i) => sum + i.total, 0);
    const paid = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0);

    const recent = [...invoices]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    root.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">${t('title')}</h1>
          <p class="page-subtitle">${t('subtitle')}</p>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <span class="stat-label">${t('statProducts')}</span>
          <span class="stat-value">${products.length}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">${t('statInvoices')}</span>
          <span class="stat-value">${invoices.length}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">${t('statOutstanding')}</span>
          <span class="stat-value">${currency(outstanding)}</span>
        </div>
        <div class="stat-card stat-card-accent">
          <span class="stat-label">${t('statPaid')}</span>
          <span class="stat-value">${currency(paid)}</span>
        </div>
      </div>

      <div class="dashboard-recent-header">
        <h2 class="editor-card-title" style="margin:0;">${t('recentInvoicesTitle')}</h2>
        ${invoices.length > 0 ? `<a href="#/invoices" class="back-link" style="margin:0;">${t('viewAll')}</a>` : ''}
      </div>

      <div id="dash-recent-list"></div>
    `;

    const listEl = document.getElementById('dash-recent-list');
    if (recent.length === 0) {
      listEl.innerHTML = `<p class="items-empty">${t('noInvoicesYet')}</p>`;
    } else {
      listEl.innerHTML = `
        <div class="product-list">
          ${recent.map(inv => `
            <div class="product-card invoice-row" data-id="${inv.id}" style="cursor:pointer;">
              <div class="product-main">
                <div class="product-row">
                  <p class="product-name">${escapeHtml(inv.clientName || '(No client name)')}</p>
                  <span class="product-price">${currency(inv.total)}</span>
                </div>
                <div class="product-meta">
                  <span class="category-tag">${escapeHtml(inv.invoiceNumber)}</span>
                  <span class="meta-dot">&middot;</span>
                  <span>${inv.issueDate || ''}</span>
                  <span class="meta-dot">&middot;</span>
                  <span class="status-badge status-${inv.status}">${statusLabel(inv.status)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      listEl.querySelectorAll('.invoice-row').forEach(el => {
        el.addEventListener('click', () => {
          window.location.hash = `#/invoices/edit/${el.dataset.id}`;
        });
      });
    }
  }

  return { render };
})();
