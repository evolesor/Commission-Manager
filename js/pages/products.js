/* ===========================================================
   products.js
   Manage Products page.
   =========================================================== */

const ProductsPage = (() => {
  const CATEGORIES = ['Commission', 'Other'];

  let state = {
    search: '',
    category: 'All',
    editingId: null, // null = closed, 'new' = add mode, else product id
  };

  let openMenuId = null;

  function currency(n) {
    return '\u0E3F' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function t(key, vars) { return I18n.t('products.' + key, vars); }
  function tc(key, vars) { return I18n.t('common.' + key, vars); }

  function render() {
    const root = document.getElementById('page-root');
    const products = Storage.getProducts();
    const hasAnyProducts = products.length > 0;

    root.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">${t('title')}</h1>
          <p class="page-subtitle">${t('subtitle')}</p>
        </div>
        ${hasAnyProducts ? `<button class="btn btn-primary" id="btn-add-product">${t('addProduct')}</button>` : ''}
      </div>

      ${hasAnyProducts ? renderToolbar() : ''}
      <div id="product-list-container"></div>
    `;

    if (hasAnyProducts) {
      bindToolbarEvents();
      document.getElementById('btn-add-product').addEventListener('click', () => openForm(null));
    }

    renderList();

    if (state.editingId !== null) {
      renderSlideOver();
    }
  }

  function renderToolbar() {
    return `
      <div class="toolbar">
        <div class="search-input">
          <span class="icon">&#128269;</span>
          <input type="text" id="product-search" placeholder="${t('searchPlaceholder')}" value="${escapeHtml(state.search)}" />
        </div>
        <div class="filter-pills">
          <button class="pill ${state.category === 'All' ? 'active' : ''}" data-cat="All">${t('filterAll')}</button>
          ${CATEGORIES.map(cat => `
            <button class="pill ${state.category === cat ? 'active' : ''}" data-cat="${cat}">${I18n.categoryLabel(cat)}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function bindToolbarEvents() {
    const searchInput = document.getElementById('product-search');
    searchInput.addEventListener('input', (e) => {
      state.search = e.target.value;
      renderList();
    });

    document.querySelectorAll('.pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.category = btn.dataset.cat;
        renderList();
        document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.cat === state.category));
      });
    });
  }

  function getFilteredProducts() {
    let list = Storage.getProducts();
    if (state.category !== 'All') {
      list = list.filter(p => p.category === state.category);
    }
    if (state.search.trim()) {
      const q = state.search.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list.sort((a, b) => {
      if (a.archived !== b.archived) return a.archived ? 1 : -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function renderList() {
    const container = document.getElementById('product-list-container');
    const all = Storage.getProducts();

    if (all.length === 0) {
      container.innerHTML = renderEmptyState();
      document.getElementById('empty-add-product')?.addEventListener('click', () => openForm(null));
      return;
    }

    const filtered = getFilteredProducts();

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
        ${filtered.map(p => renderCard(p)).join('')}
      </div>
    `;

    bindCardEvents();
  }

  function renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">&#9998;</div>
        <h3 class="empty-title">${t('emptyTitle')}</h3>
        <p class="empty-desc">${t('emptyDesc')}</p>
        <button class="btn btn-primary" id="empty-add-product">${t('addProduct')}</button>
      </div>
    `;
  }

  function renderCard(p) {
    const isAddon = p.category === 'Commission' && p.subType === 'addon';
    const isCustomAddon = isAddon && p.pricingType === 'custom';
    return `
      <div class="product-card ${p.archived ? 'is-archived' : ''}" data-id="${p.id}">
        <span class="status-dot ${p.status === 'active' ? 'active' : ''}"></span>
        <div class="product-main">
          <div class="product-row">
            <p class="product-name">${escapeHtml(p.name)}</p>
            <span class="product-price">${isCustomAddon ? `<span class="pricing-type-badge pricing-type-custom">${t('pricingTypeCustom')}</span>` : currency(p.price)}</span>
          </div>
          <div class="product-meta">
            <span class="category-tag">${escapeHtml(I18n.categoryLabel(p.category))}</span>
            ${isAddon ? `<span class="category-tag">${t('subTypeAddon')}</span>` : ''}
            ${isAddon ? `<span class="category-tag pricing-type-tag ${isCustomAddon ? 'is-custom' : 'is-fixed'}">${isCustomAddon ? t('pricingTypeCustom') : t('pricingTypeFixed')}</span>` : ''}
            ${p.archived
              ? `<span class="meta-dot">&middot;</span><span class="archived-label">${tc('archived')}</span>`
              : (p.status === 'inactive' ? `<span class="meta-dot">&middot;</span><span>${tc('inactive')}</span>` : '')}
          </div>
          ${p.description ? `<p class="product-desc">${escapeHtml(p.description)}</p>` : ''}
        </div>
        <div style="position:relative;">
          <button class="card-menu-btn" data-menu="${p.id}" aria-label="More actions">&#8942;</button>
        </div>
      </div>
    `;
  }

  function bindCardEvents() {
    document.querySelectorAll('.card-menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.menu;
        if (openMenuId === id) {
          closeMenu();
        } else {
          openMenu(id, btn);
        }
      });
    });
  }

  function openMenu(id, btn) {
    closeMenu();
    openMenuId = id;
    const product = Storage.getProducts().find(p => p.id === id);
    const wrapper = btn.parentElement;

    const menu = document.createElement('div');
    menu.className = 'card-menu';
    menu.innerHTML = `
      <button data-action="edit">${t('menuEdit')}</button>
      <button data-action="toggle">${product.status === 'active' ? t('menuSetInactive') : t('menuSetActive')}</button>
      <button data-action="archive">${product.archived ? t('menuUnarchive') : t('menuArchive')}</button>
      <button data-action="delete" class="danger">${t('menuDelete')}</button>
    `;
    wrapper.appendChild(menu);

    menu.querySelector('[data-action="edit"]').addEventListener('click', () => { closeMenu(); openForm(id); });
    menu.querySelector('[data-action="toggle"]').addEventListener('click', () => { closeMenu(); Storage.toggleActive(id); renderList(); });
    menu.querySelector('[data-action="archive"]').addEventListener('click', async () => {
      closeMenu();
      if (product.archived) {
        Storage.setArchived(id, false);
        renderList();
        showToast(t('toastUnarchived'));
      } else {
        const ok = await confirmDialog({
          title: t('confirmArchiveTitle'),
          desc: t('confirmArchiveDesc', { name: product.name }),
          confirmLabel: t('menuArchive').replace(/^\S+\s/, ''),
        });
        if (ok) {
          Storage.setArchived(id, true);
          renderList();
          showToast(t('toastArchived'));
        }
      }
    });
    menu.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      closeMenu();
      const ok = await confirmDialog({
        title: t('confirmDeleteTitle'),
        desc: t('confirmDeleteDesc', { name: product.name }),
        confirmLabel: tc('delete'),
        danger: true,
      });
      if (ok) {
        Storage.deleteProduct(id);
        renderList();
        showToast(t('toastDeleted'));
      }
    });

    setTimeout(() => document.addEventListener('click', closeMenuOnOutside), 0);
  }

  function closeMenuOnOutside(e) {
    if (!e.target.closest('.card-menu') && !e.target.closest('.card-menu-btn')) {
      closeMenu();
    }
  }

  function closeMenu() {
    document.querySelectorAll('.card-menu').forEach(m => m.remove());
    document.removeEventListener('click', closeMenuOnOutside);
    openMenuId = null;
  }

  // ---------- Add / Edit form (slide-over) ----------

  function openForm(id) {
    state.editingId = id === null ? 'new' : id;
    renderSlideOver();
  }

  function closeForm() {
    const overlay = document.getElementById('overlay');
    overlay.classList.remove('show');
    setTimeout(() => { overlay.hidden = true; }, 180);
    state.editingId = null;
  }

  function renderSlideOver() {
    const overlay = document.getElementById('overlay');
    const panel = document.getElementById('slide-over');
    const isNew = state.editingId === 'new';
    const product = isNew ? null : Storage.getProducts().find(p => p.id === state.editingId);

    panel.innerHTML = `
      <div class="slide-over-header">
        <h3 class="slide-over-title" id="slide-over-title">${isNew ? t('formAddTitle') : t('formEditTitle')}</h3>
        <button class="icon-btn" id="close-slide-over" aria-label="Close">&#10005;</button>
      </div>
      <form id="product-form" novalidate>
        <div class="slide-over-body">
          <div class="field">
            <label for="f-name">${t('fieldName')}</label>
            <input type="text" id="f-name" placeholder="${t('fieldNamePlaceholder')}" value="${escapeHtml(product?.name || '')}" />
            <span class="field-error" id="err-name" hidden>${t('errName')}</span>
          </div>

          <div class="field">
            <label>${t('fieldCategory')}</label>
            <div class="segmented" id="f-category">
              ${CATEGORIES.map(cat => `
                <button type="button" data-cat="${cat}" class="${(product?.category || 'Commission') === cat ? 'active' : ''}">${I18n.categoryLabel(cat)}</button>
              `).join('')}
            </div>
          </div>

          <div class="field" id="f-addon-field" style="display:${(product?.category || 'Commission') === 'Commission' ? '' : 'none'};">
            <div class="status-toggle-row">
              <div class="label-group">
                <span class="label-title">${t('fieldIsAddonLabel')}</span>
                <span class="label-sub">${t('fieldIsAddonSub')}</span>
              </div>
              <label class="switch">
                <input type="checkbox" id="f-is-addon" ${product?.subType === 'addon' ? 'checked' : ''} />
                <span class="switch-track"></span>
              </label>
            </div>
          </div>

          <div class="field" id="f-pricing-type-field" style="display:${product?.subType === 'addon' ? '' : 'none'};">
            <label>${t('fieldPricingType')}</label>
            <div class="segmented" id="f-pricing-type">
              <button type="button" data-type="fixed" class="${(product?.pricingType || 'fixed') === 'fixed' ? 'active' : ''}">${t('pricingTypeFixed')}</button>
              <button type="button" data-type="custom" class="${product?.pricingType === 'custom' ? 'active' : ''}">${t('pricingTypeCustom')}</button>
            </div>
            <span class="hint" id="pricing-type-hint">${(product?.pricingType || 'fixed') === 'custom' ? t('pricingTypeCustomHint') : t('pricingTypeFixedHint')}</span>
          </div>

          <div class="field" id="f-price-field">
            <label for="f-price">${t('fieldPrice')}</label>
            <div class="price-input">
              <span class="currency">&#3647;</span>
              <input type="number" id="f-price" min="0" step="1" placeholder="0" value="${product?.price ?? ''}" />
            </div>
            <span class="field-error" id="err-price" hidden>${t('errPrice')}</span>
          </div>

          <div class="field">
            <label for="f-desc">${t('fieldDescription')} <span class="hint">(${tc('optional')})</span></label>
            <textarea id="f-desc" placeholder="${t('fieldDescPlaceholder')}">${escapeHtml(product?.description || '')}</textarea>
          </div>

          <div class="status-toggle-row">
            <div class="label-group">
              <span class="label-title">${t('fieldActiveLabel')}</span>
              <span class="label-sub">${t('fieldActiveSub')}</span>
            </div>
            <label class="switch">
              <input type="checkbox" id="f-status" ${((product?.status || 'active') === 'active') ? 'checked' : ''} />
              <span class="switch-track"></span>
            </label>
          </div>
        </div>

        <div class="slide-over-footer">
          <button type="button" class="btn btn-secondary" id="cancel-form">${tc('cancel')}</button>
          <button type="submit" class="btn btn-primary">${tc('save')}</button>
        </div>
      </form>
    `;

    let selectedCategory = product?.category || 'Commission';
    let isAddon = product?.subType === 'addon';
    let pricingType = product?.pricingType === 'custom' ? 'custom' : 'fixed';

    function updatePriceFieldVisibility() {
      const isCustomAddon = selectedCategory === 'Commission' && isAddon && pricingType === 'custom';
      document.getElementById('f-price-field').style.display = isCustomAddon ? 'none' : '';
    }

    function updatePricingTypeFieldVisibility() {
      const show = selectedCategory === 'Commission' && isAddon;
      document.getElementById('f-pricing-type-field').style.display = show ? '' : 'none';
    }

    panel.querySelectorAll('#f-category button').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCategory = btn.dataset.cat;
        panel.querySelectorAll('#f-category button').forEach(b => b.classList.toggle('active', b.dataset.cat === selectedCategory));
        document.getElementById('f-addon-field').style.display = selectedCategory === 'Commission' ? '' : 'none';
        if (selectedCategory !== 'Commission') isAddon = false;
        document.getElementById('f-is-addon').checked = isAddon;
        updatePricingTypeFieldVisibility();
        updatePriceFieldVisibility();
      });
    });

    document.getElementById('f-is-addon').addEventListener('change', (e) => {
      isAddon = e.target.checked;
      updatePricingTypeFieldVisibility();
      updatePriceFieldVisibility();
    });

    panel.querySelectorAll('#f-pricing-type button').forEach(btn => {
      btn.addEventListener('click', () => {
        pricingType = btn.dataset.type;
        panel.querySelectorAll('#f-pricing-type button').forEach(b => b.classList.toggle('active', b.dataset.type === pricingType));
        document.getElementById('pricing-type-hint').textContent = pricingType === 'custom' ? t('pricingTypeCustomHint') : t('pricingTypeFixedHint');
        updatePriceFieldVisibility();
      });
    });

    const form = document.getElementById('product-form');
    let dirty = false;
    form.addEventListener('input', () => { dirty = true; });

    document.getElementById('close-slide-over').addEventListener('click', () => attemptClose(dirty));
    document.getElementById('cancel-form').addEventListener('click', () => attemptClose(dirty));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) attemptClose(dirty); }, { once: true });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('f-name').value;
      const price = document.getElementById('f-price').value;
      const desc = document.getElementById('f-desc').value;
      const status = document.getElementById('f-status').checked ? 'active' : 'inactive';
      const isCustomAddon = selectedCategory === 'Commission' && isAddon && pricingType === 'custom';

      let valid = true;
      const nameInput = document.getElementById('f-name');
      const priceInput = document.getElementById('f-price');
      const errName = document.getElementById('err-name');
      const errPrice = document.getElementById('err-price');

      if (!name.trim()) {
        nameInput.classList.add('has-error');
        errName.hidden = false;
        valid = false;
      } else {
        nameInput.classList.remove('has-error');
        errName.hidden = true;
      }

      // Custom-price add-ons deliberately have no default price — the price
      // is entered per-commission later, so skip the price requirement here.
      if (!isCustomAddon && (price === '' || isNaN(price) || Number(price) < 0)) {
        priceInput.classList.add('has-error');
        errPrice.hidden = false;
        valid = false;
      } else {
        priceInput.classList.remove('has-error');
        errPrice.hidden = true;
      }

      if (!valid) return;

      const data = {
        name, category: selectedCategory, price, description: desc, status,
        subType: selectedCategory === 'Commission' && isAddon ? 'addon' : 'main',
        pricingType: selectedCategory === 'Commission' && isAddon ? pricingType : null,
      };

      if (isNew) {
        Storage.addProduct(data);
        showToast(t('toastAdded'));
      } else {
        Storage.updateProduct(product.id, data);
        showToast(t('toastSaved'));
      }

      closeForm();
      render();
    });

    overlay.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add('show');
      document.getElementById('f-name').focus();
    });
  }

  async function attemptClose(dirty) {
    if (dirty) {
      const ok = await confirmDialog({
        title: t('confirmDiscardTitle'),
        desc: t('confirmDiscardDesc'),
        confirmLabel: tc('discard'),
        danger: true,
      });
      if (!ok) return;
    }
    closeForm();
  }

  return { render };
})();
