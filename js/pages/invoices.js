/* ===========================================================
   invoices.js
   Invoice list: search, filter by status, open/duplicate/delete.
   =========================================================== */

const InvoicesPage = (() => {
  let state = { search: '', status: 'All' };
  let openMenuId = null;

  function t(key, vars) { return I18n.t('invoices.' + key, vars); }

  function currency(n) {
    return '\u0E3F' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function statusLabel(s) {
    return t('status' + s.charAt(0).toUpperCase() + s.slice(1));
  }

  function render() {
    const root = document.getElementById('page-root');
    const invoices = Storage.getInvoices();
    const products = Storage.getProducts().filter(p => !p.archived && p.status === 'active');
    const hasInvoices = invoices.length > 0;

    root.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">${t('title')}</h1>
          <p class="page-subtitle">${t('subtitle')}</p>
        </div>
        ${hasInvoices ? `<button class="btn btn-primary" id="btn-new-invoice">${t('newInvoice')}</button>` : ''}
      </div>

      ${hasInvoices ? renderToolbar() : ''}
      <div id="invoice-list-container"></div>
    `;

    if (hasInvoices) {
      bindToolbarEvents();
      document.getElementById('btn-new-invoice').addEventListener('click', () => handleNewInvoice(products));
    }

    renderList(products);
  }

  function renderToolbar() {
    const statuses = ['draft', 'unpaid', 'paid', 'cancelled'];
    return `
      <div class="toolbar">
        <div class="search-input">
          <span class="icon">&#128269;</span>
          <input type="text" id="invoice-search" placeholder="${t('searchPlaceholder')}" value="${escapeHtml(state.search)}" />
        </div>
        <div class="filter-pills">
          <button class="pill ${state.status === 'All' ? 'active' : ''}" data-status="All">${t('filterAll')}</button>
          ${statuses.map(s => `
            <button class="pill ${state.status === s ? 'active' : ''}" data-status="${s}">${statusLabel(s)}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function bindToolbarEvents() {
    document.getElementById('invoice-search').addEventListener('input', (e) => {
      state.search = e.target.value;
      renderList(Storage.getProducts().filter(p => !p.archived && p.status === 'active'));
    });
    document.querySelectorAll('.pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.status = btn.dataset.status;
        document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.status === state.status));
        renderList(Storage.getProducts().filter(p => !p.archived && p.status === 'active'));
      });
    });
  }

  function getFiltered() {
    let list = Storage.getInvoices();
    if (state.status !== 'All') list = list.filter(i => i.status === state.status);
    if (state.search.trim()) {
      const q = state.search.trim().toLowerCase();
      list = list.filter(i => i.clientName.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function renderList(activeProducts) {
    const container = document.getElementById('invoice-list-container');
    const all = Storage.getInvoices();

    if (all.length === 0) {
      container.innerHTML = renderEmptyState();
      document.getElementById('empty-new-invoice')?.addEventListener('click', () => handleNewInvoice(activeProducts));
      return;
    }

    const filtered = getFiltered();
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">&#128269;</div>
          <h3 class="empty-title">${t('emptySearchTitle')}</h3>
          <p class="empty-desc">${t('emptySearchDesc')}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="product-list">
        ${filtered.map(inv => renderRow(inv)).join('')}
      </div>
    `;
    bindRowEvents();
  }

  function renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">&#128203;</div>
        <h3 class="empty-title">${t('emptyTitle')}</h3>
        <p class="empty-desc">${t('emptyDesc')}</p>
        <button class="btn btn-primary" id="empty-new-invoice">${t('newInvoice')}</button>
      </div>
    `;
  }

  function renderRow(inv) {
    return `
      <div class="product-card invoice-row" data-id="${inv.id}">
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
        <div style="position:relative;">
          <button class="card-menu-btn" data-menu="${inv.id}" aria-label="More actions">&#8942;</button>
        </div>
      </div>
    `;
  }

  function bindRowEvents() {
    document.querySelectorAll('.invoice-row .product-main').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        const id = el.closest('.invoice-row').dataset.id;
        window.location.hash = `#/invoices/edit/${id}`;
      });
    });

    document.querySelectorAll('.card-menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.menu;
        if (openMenuId === id) { closeMenu(); } else { openMenu(id, btn); }
      });
    });
  }

  function openMenu(id, btn) {
    closeMenu();
    openMenuId = id;
    const inv = Storage.getInvoices().find(i => i.id === id);
    const wrapper = btn.parentElement;

    const menu = document.createElement('div');
    menu.className = 'card-menu';
    menu.innerHTML = `
      <button data-action="open">&#128065; ${t('menuOpen')}</button>
      <button data-action="duplicate">&#10063; ${t('menuDuplicate')}</button>
      <button data-action="delete" class="danger">&#128465; ${t('menuDelete')}</button>
    `;
    wrapper.appendChild(menu);

    menu.querySelector('[data-action="open"]').addEventListener('click', (e) => {
      e.stopPropagation(); closeMenu();
      window.location.hash = `#/invoices/edit/${id}`;
    });
    menu.querySelector('[data-action="duplicate"]').addEventListener('click', (e) => {
      e.stopPropagation(); closeMenu();
      Storage.duplicateInvoice(id);
      showToast(t('toastDuplicated'));
      render();
    });
    menu.querySelector('[data-action="delete"]').addEventListener('click', async (e) => {
      e.stopPropagation(); closeMenu();
      const ok = await confirmDialog({
        title: t('confirmDeleteTitle'),
        desc: t('confirmDeleteDesc', { number: inv.invoiceNumber }),
        confirmLabel: I18n.t('common.delete'),
        danger: true,
      });
      if (ok) {
        Storage.deleteInvoice(id);
        showToast(t('toastDeleted'));
        render();
      }
    });

    setTimeout(() => document.addEventListener('click', closeMenuOnOutside), 0);
  }

  function closeMenuOnOutside(e) {
    if (!e.target.closest('.card-menu') && !e.target.closest('.card-menu-btn')) closeMenu();
  }

  function closeMenu() {
    document.querySelectorAll('.card-menu').forEach(m => m.remove());
    document.removeEventListener('click', closeMenuOnOutside);
    openMenuId = null;
  }

  function handleNewInvoice(activeProducts) {
    if (!activeProducts || activeProducts.length === 0) {
      showNoProductsState();
      return;
    }
    window.location.hash = '#/invoices/new';
  }

  function showNoProductsState() {
    const container = document.getElementById('invoice-list-container');
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">&#9998;</div>
        <h3 class="empty-title">${t('emptyNoProductsTitle')}</h3>
        <p class="empty-desc">${t('emptyNoProductsDesc')}</p>
        <button class="btn btn-primary" id="empty-goto-products">${I18n.t('products.addProduct')}</button>
      </div>
    `;
    document.getElementById('empty-goto-products').addEventListener('click', () => {
      window.location.hash = '#/products';
    });
  }

  return { render };
})();
