/* ===========================================================
   invoice-editor.js
   Create / edit an invoice. Two-column layout: form + live
   preview. Selecting a product snapshots its current name,
   category, and price onto the invoice line item — later
   edits to the product will never change saved invoices.
   =========================================================== */

const InvoiceEditorPage = (() => {
  let draft = null;       // working copy of the invoice being edited
  let originalId = null;  // null = new invoice
  let dirty = false;

  function t(key, vars) { return I18n.t('invoiceEditor.' + key, vars); }
  function tc(key) { return I18n.t('common.' + key); }
  function currency(n) {
    return '\u0E3F' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  function statusLabel(s) { return I18n.t('invoices.status' + s.charAt(0).toUpperCase() + s.slice(1)); }

  function render(id) {
    originalId = id;
    const settings = Storage.getSettings();

    if (id) {
      const existing = Storage.getInvoices().find(i => i.id === id);
      if (!existing) { window.location.hash = '#/invoices'; return; }
      draft = JSON.parse(JSON.stringify(existing));
      if (!draft.template) draft.template = settings.appearance.invoiceTemplate || 'minimal';
    } else {
      draft = {
        invoiceNumber: Storage.nextInvoiceNumber(),
        clientName: '',
        clientContact: '',
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: '',
        items: [],
        status: 'draft',
        notes: settings.invoiceDefaults.defaultNotes || '',
        paymentTerms: settings.invoiceDefaults.paymentTerms || '',
        template: settings.appearance.invoiceTemplate || 'minimal',
      };
    }

    dirty = false;
    draw();
  }

  function draw() {
    const root = document.getElementById('page-root');
    const isNew = !originalId;

    root.innerHTML = `
      <button class="back-link" id="back-to-list">${t('backToList')}</button>
      <div class="invoice-editor-header">
        <h1 class="page-title" style="margin:0;">${isNew ? t('newTitle') : t('editTitle')}</h1>
        <select class="status-select" id="f-status">
          ${['draft', 'unpaid', 'paid', 'cancelled'].map(s => `
            <option value="${s}" ${draft.status === s ? 'selected' : ''}>${statusLabel(s)}</option>
          `).join('')}
        </select>
      </div>

      <div class="invoice-editor-grid">
        <div class="editor-col">

          <div class="editor-card">
            <h2 class="editor-card-title">${t('sectionClient')}</h2>
            <div class="field-row">
              <div class="field">
                <label for="f-client-name">${t('fieldClientName')}</label>
                <input type="text" id="f-client-name" value="${escapeHtml(draft.clientName)}" />
                <span class="field-error" id="err-client-name" hidden>${t('errClientName')}</span>
              </div>
              <div class="field">
                <label for="f-client-contact">${t('fieldClientContact')} <span class="hint">(${tc('optional')})</span></label>
                <input type="text" id="f-client-contact" value="${escapeHtml(draft.clientContact)}" />
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="f-invoice-number">${t('fieldInvoiceNumber')}</label>
                <input type="text" id="f-invoice-number" value="${escapeHtml(draft.invoiceNumber)}" />
              </div>
              <div class="field">
                <label for="f-issue-date">${t('fieldIssueDate')}</label>
                <input type="text" id="f-issue-date" value="${escapeHtml(draft.issueDate)}" placeholder="YYYY-MM-DD" />
              </div>
            </div>
            <div class="field">
              <label for="f-due-date">${t('fieldDueDate')} <span class="hint">(${tc('optional')})</span></label>
              <input type="text" id="f-due-date" value="${escapeHtml(draft.dueDate)}" placeholder="YYYY-MM-DD" />
            </div>
          </div>

          <div class="editor-card">
            <h2 class="editor-card-title">
              ${t('sectionItems')}
              <button type="button" class="btn btn-secondary btn-sm" id="btn-add-item">${t('addItemButton')}</button>
            </h2>
            <div id="items-table-container"></div>
            <span class="field-error" id="err-items" hidden>${t('errNoItems')}</span>
            <div class="summary-total-row">
              <span>${t('summaryTotal')}</span>
              <span id="items-total-display">${currency(Storage.computeInvoiceTotal(draft.items))}</span>
            </div>
          </div>

          <div class="editor-card">
            <h2 class="editor-card-title">${t('sectionNotes')}</h2>
            <div class="field">
              <label for="f-notes">${t('fieldNotes')} <span class="hint">(${tc('optional')})</span></label>
              <textarea id="f-notes">${escapeHtml(draft.notes)}</textarea>
            </div>
            <div class="field">
              <label for="f-payment-terms">${t('fieldPaymentTerms')} <span class="hint">(${tc('optional')})</span></label>
              <input type="text" id="f-payment-terms" value="${escapeHtml(draft.paymentTerms)}" />
            </div>
          </div>

          <div class="editor-actions">
            <button type="button" class="btn btn-secondary" id="btn-cancel-editor">${t('btnCancel')}</button>
            ${!isNew ? `<button type="button" class="btn btn-danger" id="btn-delete-invoice">${t('btnDelete')}</button>` : ''}
            <button type="button" class="btn btn-primary" id="btn-save-invoice">${t('btnSave')}</button>
          </div>
        </div>

        <div class="editor-col">
          <div class="editor-card">
            <div class="preview-controls-row">
              <label class="preview-controls-label">${t('templateLabel')}</label>
              <div class="segmented" id="f-template">
                ${['minimal', 'classic', 'receipt'].map(tpl => `
                  <button type="button" data-template="${tpl}" class="${draft.template === tpl ? 'active' : ''}">${I18n.t('settings.template' + tpl.charAt(0).toUpperCase() + tpl.slice(1))}</button>
                `).join('')}
              </div>
            </div>
            <div class="export-actions-row">
              <button type="button" class="btn btn-secondary btn-block" id="btn-export">${t('btnExport')}</button>
              <button type="button" class="btn btn-secondary btn-block" id="btn-export-png">${t('btnExportPng')}</button>
            </div>
          </div>
          <div id="invoice-preview-panel"></div>
        </div>
      </div>
    `;

    renderItemsTable();
    renderPreview();
    bindEvents();
  }

  function renderItemsTable() {
    const container = document.getElementById('items-table-container');
    if (draft.items.length === 0) {
      container.innerHTML = `<p class="items-empty">${t('noItemsYet')}</p>`;
      return;
    }
    container.innerHTML = `
      <table class="item-table">
        <thead>
          <tr>
            <th>${t('colProduct')}</th>
            <th>${t('colQty')}</th>
            <th>${t('colUnitPrice')}</th>
            <th class="num">${t('colSubtotal')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${draft.items.map((it, idx) => `
            <tr data-idx="${idx}">
              <td class="item-name-cell">${escapeHtml(it.name)}<span class="item-cat">${escapeHtml(I18n.categoryLabel(it.category))}${it.category === 'Commission' && it.subType === 'addon' ? ' · ' + escapeHtml(I18n.t('products.subTypeAddon')) : ''}</span>${renderAddonBreakdown(it)}</td>
              <td><input type="number" min="1" step="1" class="item-qty-input" data-idx="${idx}" value="${it.quantity}" /></td>
              <td><input type="number" min="0" step="1" class="item-price-input" data-idx="${idx}" value="${it.unitPrice}" /></td>
              <td class="num">${currency(Storage.computeItemSubtotal(it))}</td>
              <td><button type="button" class="item-remove-btn" data-idx="${idx}" aria-label="Remove">&#10005;</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('.item-qty-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = Number(inp.dataset.idx);
        draft.items[idx].quantity = Math.max(1, Number(inp.value) || 1);
        dirty = true;
        refreshTotals();
      });
    });
    container.querySelectorAll('.item-price-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = Number(inp.dataset.idx);
        draft.items[idx].unitPrice = Math.max(0, Number(inp.value) || 0);
        dirty = true;
        refreshTotals();
      });
    });
    container.querySelectorAll('.item-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        draft.items.splice(idx, 1);
        dirty = true;
        renderItemsTable();
        renderPreview();
      });
    });
  }

  function renderAddonBreakdown(it) {
    const hasAddons = it.addons && it.addons.length > 0;
    const isCommercial = it.usageType === 'commercial';
    if (!hasAddons && !isCommercial) return '';
    // Order required: Commission (base) -> Add-ons -> Subtotal -> Commercial Use -> (Total is
    // the row's own "Subtotal" column in the outer table, which already equals unitPrice × qty).
    const rows = [];
    rows.push(`<li class="breakdown-base-row"><span>${t('breakdownCommissionLabel')}</span><span>${currency(it.basePrice)}</span></li>`);
    if (hasAddons) {
      it.addons.forEach(a => rows.push(`<li><span>+ ${escapeHtml(a.name)}</span><span>${currency(a.price)}</span></li>`));
    }
    rows.push(`<li class="breakdown-subtotal-row"><span>${t('breakdownSubtotalLabel')}</span><span>${currency(it.preUsageSubtotal ?? it.basePrice)}</span></li>`);
    if (isCommercial) {
      rows.push(`<li class="breakdown-commercial-row"><span>${t('breakdownCommercialLabel', { multiplier: it.commercialMultiplier })}</span><span>+${currency(it.commercialFee)}</span></li>`);
    }
    return `<ul class="item-addon-list">${rows.join('')}</ul>`;
  }

  function refreshTotals() {
    document.getElementById('items-total-display').textContent = currency(Storage.computeInvoiceTotal(draft.items));
    draft.items.forEach((it, idx) => {
      const row = document.querySelector(`.item-table tr[data-idx="${idx}"] td.num`);
      if (row) row.textContent = currency(Storage.computeItemSubtotal(it));
    });
    renderPreview();
  }

  function renderPreview() {
    const panel = document.getElementById('invoice-preview-panel');
    const settings = Storage.getSettings();
    const template = draft.template || settings.appearance.invoiceTemplate || 'minimal';

    if (template === 'classic') {
      panel.innerHTML = renderTemplateClassic(settings);
    } else if (template === 'receipt') {
      panel.innerHTML = renderTemplateReceipt(settings);
    } else {
      panel.innerHTML = renderTemplateMinimal(settings);
    }
    panel.id = 'invoice-preview-panel';
  }

  function renderTemplateMinimal(settings) {
    const artist = settings.artist;
    const total = Storage.computeInvoiceTotal(draft.items);

    return `
      <div class="preview-panel tpl-minimal">
        <div class="preview-header">
          <div>
            <div class="preview-brand">${escapeHtml(artist.artistName || artist.displayName || I18n.t('appName'))}</div>
            ${artist.contact ? `<div class="preview-brand-sub">${escapeHtml(artist.contact)}</div>` : ''}
          </div>
          <div class="preview-invoice-meta">
            <div class="num">${escapeHtml(draft.invoiceNumber)}</div>
            <div>${t('previewIssueDate')}: ${escapeHtml(draft.issueDate || '—')}</div>
            ${draft.dueDate ? `<div>${t('previewDueDate')}: ${escapeHtml(draft.dueDate)}</div>` : ''}
          </div>
        </div>

        <div class="preview-parties">
          <div>
            <div class="preview-party-label">${t('previewBillTo')}</div>
            <div class="preview-party-value">${escapeHtml(draft.clientName || '—')}</div>
            ${draft.clientContact ? `<div class="preview-party-sub">${escapeHtml(draft.clientContact)}</div>` : ''}
          </div>
        </div>

        ${itemsTableHtml('preview-items-table')}

        <div class="preview-total-row">
          <span>${t('previewTotal')}</span>
          <span>${currency(total)}</span>
        </div>

        ${footerHtml(settings)}
      </div>
    `;
  }

  function renderTemplateClassic(settings) {
    const artist = settings.artist;
    const total = Storage.computeInvoiceTotal(draft.items);

    return `
      <div class="preview-panel tpl-classic">
        <div class="tpl-classic-title">INVOICE</div>

        <div class="tpl-classic-header">
          <div class="tpl-classic-box">
            <div class="preview-party-label">${t('previewFrom')}</div>
            <div class="preview-party-value">${escapeHtml(artist.artistName || artist.displayName || I18n.t('appName'))}</div>
            ${artist.contact ? `<div class="preview-party-sub">${escapeHtml(artist.contact)}</div>` : ''}
          </div>
          <div class="tpl-classic-box">
            <div class="preview-party-label">${t('previewInvoiceNo')}</div>
            <div class="preview-party-value">${escapeHtml(draft.invoiceNumber)}</div>
            <div class="preview-party-sub">${t('previewIssueDate')}: ${escapeHtml(draft.issueDate || '—')}</div>
            ${draft.dueDate ? `<div class="preview-party-sub">${t('previewDueDate')}: ${escapeHtml(draft.dueDate)}</div>` : ''}
          </div>
        </div>

        <div class="tpl-classic-box" style="margin-bottom:18px;">
          <div class="preview-party-label">${t('previewBillTo')}</div>
          <div class="preview-party-value">${escapeHtml(draft.clientName || '—')}</div>
          ${draft.clientContact ? `<div class="preview-party-sub">${escapeHtml(draft.clientContact)}</div>` : ''}
        </div>

        ${itemsTableHtml('preview-items-table tpl-classic-table')}

        <div class="tpl-classic-total-box">
          <span>${t('previewTotal')}</span>
          <span>${currency(total)}</span>
        </div>

        ${footerHtml(settings)}
      </div>
    `;
  }

  function renderTemplateReceipt(settings) {
    const artist = settings.artist;
    const total = Storage.computeInvoiceTotal(draft.items);

    return `
      <div class="preview-panel tpl-receipt">
        <div class="tpl-receipt-header">
          <div class="tpl-receipt-brand">${escapeHtml(artist.artistName || artist.displayName || I18n.t('appName'))}</div>
          ${artist.contact ? `<div class="tpl-receipt-brand-sub">${escapeHtml(artist.contact)}</div>` : ''}
        </div>

        <div class="tpl-receipt-divider"></div>

        <div class="tpl-receipt-meta">
          <div class="tpl-receipt-meta-row"><span>${t('previewInvoiceNo')}</span><span>${escapeHtml(draft.invoiceNumber)}</span></div>
          <div class="tpl-receipt-meta-row"><span>${t('previewIssueDate')}</span><span>${escapeHtml(draft.issueDate || '—')}</span></div>
          ${draft.dueDate ? `<div class="tpl-receipt-meta-row"><span>${t('previewDueDate')}</span><span>${escapeHtml(draft.dueDate)}</span></div>` : ''}
          <div class="tpl-receipt-meta-row"><span>${t('previewBillTo')}</span><span>${escapeHtml(draft.clientName || '—')}</span></div>
          ${draft.clientContact ? `<div class="tpl-receipt-meta-row"><span></span><span>${escapeHtml(draft.clientContact)}</span></div>` : ''}
        </div>

        <div class="tpl-receipt-divider"></div>

        ${receiptItemsHtml()}

        <div class="tpl-receipt-divider tpl-receipt-divider-solid"></div>

        <div class="tpl-receipt-total-row">
          <span>${t('previewTotal')}</span>
          <span>${currency(total)}</span>
        </div>

        ${footerHtml(settings)}
      </div>
    `;
  }

  function receiptItemsHtml() {
    if (draft.items.length === 0) {
      return `<p class="preview-empty">${t('previewEmptyItems')}</p>`;
    }
    return `
      <div class="tpl-receipt-items">
        ${draft.items.map(it => `
          <div class="tpl-receipt-item">
            <div class="tpl-receipt-item-row">
              <span class="tpl-receipt-item-name">${escapeHtml(it.name)}${it.quantity > 1 ? ` <span class="tpl-receipt-item-qty">&times;${it.quantity}</span>` : ''}</span>
              <span class="tpl-receipt-item-price">${currency(Storage.computeItemSubtotal(it))}</span>
            </div>
            ${renderPreviewBreakdown(it)}
          </div>
        `).join('')}
      </div>
    `;
  }

  function itemsTableHtml(tableClass) {
    if (draft.items.length === 0) {
      return `<p class="preview-empty">${t('previewEmptyItems')}</p>`;
    }
    return `
      <table class="${tableClass}">
        <thead>
          <tr>
            <th>${t('colProduct')}</th>
            <th class="num">${t('colQty')}</th>
            <th class="num">${t('colUnitPrice')}</th>
            <th class="num">${t('colSubtotal')}</th>
          </tr>
        </thead>
        <tbody>
          ${draft.items.map(it => `
            <tr>
              <td>${escapeHtml(it.name)}${renderPreviewBreakdown(it)}</td>
              <td class="num">${it.quantity}</td>
              <td class="num">${currency(it.unitPrice)}</td>
              <td class="num">${currency(Storage.computeItemSubtotal(it))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function renderPreviewBreakdown(it) {
    const hasAddons = it.addons && it.addons.length > 0;
    const isCommercial = it.usageType === 'commercial';
    if (!hasAddons && !isCommercial) return '';
    const lines = [];
    lines.push(`${t('breakdownCommissionLabel')}: ${currency(it.basePrice)}`);
    if (hasAddons) it.addons.forEach(a => lines.push(`+ ${escapeHtml(a.name)} (${currency(a.price)})`));
    lines.push(`${t('breakdownSubtotalLabel')}: ${currency(it.preUsageSubtotal ?? it.basePrice)}`);
    if (isCommercial) lines.push(`${t('breakdownCommercialLabel', { multiplier: it.commercialMultiplier })}: +${currency(it.commercialFee)}`);
    return `<div class="preview-item-addons">${lines.join('<br>')}</div>`;
  }

  function footerHtml(settings) {
    if (!draft.notes && !draft.paymentTerms && !settings.payment.detail) return '';
    return `
      <div class="preview-footer">
        ${draft.notes ? `<div><div class="preview-footer-label">${t('previewNotes')}</div><div class="preview-footer-text">${escapeHtml(draft.notes)}</div></div>` : ''}
        ${(draft.paymentTerms || settings.payment.detail) ? `
          <div>
            <div class="preview-footer-label">${t('previewPaymentInfo')}</div>
            <div class="preview-footer-text">${escapeHtml(draft.paymentTerms || '')}${draft.paymentTerms && settings.payment.detail ? '\n' : ''}${escapeHtml(settings.payment.detail || '')}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Renders whichever invoice template is currently on screen (minimal /
  // classic / receipt) to a PNG file and downloads it. Uses
  // html2canvas (loaded via CDN in index.html) to rasterize the live
  // #invoice-preview-panel element exactly as shown — no separate export
  // template to keep in sync.
  async function exportPreviewAsPng() {
    const target = document.getElementById('invoice-preview-panel');
    const btn = document.getElementById('btn-export-png');
    if (!target || !btn) return;

    if (typeof html2canvas !== 'function') {
      showToast(t('toastPngExportFailed'));
      return;
    }

    const livePanel = target.querySelector('.preview-panel');
    if (!livePanel) return;

    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = t('btnExportPngWorking');

    // Export a clone of the invoice card framed with generous padding and a
    // soft background — a straight screenshot of the panel looks cropped
    // and flat since it's flush against the container edge. This purely
    // affects the exported PNG; the on-screen preview itself is untouched.
    const FRAME_PADDING = 24;
    const frameBg = getComputedStyle(document.documentElement).getPropertyValue('--bg-page').trim() || '#F6F4EE';
    const panelWidth = Math.round(livePanel.getBoundingClientRect().width);

    const frame = document.createElement('div');
    frame.style.position = 'fixed';
    frame.style.top = '0';
    frame.style.left = '-99999px';
    frame.style.padding = FRAME_PADDING + 'px';
    frame.style.background = frameBg;
    frame.style.width = (panelWidth + FRAME_PADDING * 2) + 'px';

    const clone = livePanel.cloneNode(true);
    clone.style.width = panelWidth + 'px';
    clone.style.margin = '0';
    clone.id = '';
    frame.appendChild(clone);
    document.body.appendChild(frame);

    try {
      const canvas = await html2canvas(frame, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('toBlob returned null');

      const safeName = (draft.invoiceNumber || 'invoice').replace(/[^a-z0-9\u0E00-\u0E7F_-]+/gi, '-');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(t('toastPngExported'));
    } catch (err) {
      console.error('PNG export failed:', err);
      showToast(t('toastPngExportFailed'));
    } finally {
      document.body.removeChild(frame);
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  }

  function bindEvents() {
    document.getElementById('back-to-list').addEventListener('click', () => attemptLeave());
    document.getElementById('btn-cancel-editor').addEventListener('click', () => attemptLeave());

    document.getElementById('f-status').addEventListener('change', (e) => {
      draft.status = e.target.value;
      dirty = true;
    });

    const fields = [
      ['f-client-name', 'clientName'], ['f-client-contact', 'clientContact'],
      ['f-invoice-number', 'invoiceNumber'], ['f-issue-date', 'issueDate'], ['f-due-date', 'dueDate'],
      ['f-notes', 'notes'], ['f-payment-terms', 'paymentTerms'],
    ];
    fields.forEach(([elId, key]) => {
      document.getElementById(elId).addEventListener('input', (e) => {
        draft[key] = e.target.value;
        dirty = true;
        if (['clientName', 'clientContact', 'invoiceNumber', 'issueDate', 'dueDate', 'notes', 'paymentTerms'].includes(key)) {
          renderPreview();
        }
      });
    });

    document.getElementById('btn-add-item').addEventListener('click', () => openProductPicker());

    document.querySelectorAll('#f-template button').forEach(btn => {
      btn.addEventListener('click', () => {
        draft.template = btn.dataset.template;
        dirty = true;
        document.querySelectorAll('#f-template button').forEach(b => b.classList.toggle('active', b === btn));
        renderPreview();
      });
    });

    document.getElementById('btn-save-invoice').addEventListener('click', handleSave);
    document.getElementById('btn-export').addEventListener('click', () => window.print());
    document.getElementById('btn-export-png').addEventListener('click', () => exportPreviewAsPng());

    const deleteBtn = document.getElementById('btn-delete-invoice');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const ok = await confirmDialog({
          title: I18n.t('invoices.confirmDeleteTitle'),
          desc: I18n.t('invoices.confirmDeleteDesc', { number: draft.invoiceNumber }),
          confirmLabel: tc('delete'),
          danger: true,
        });
        if (ok) {
          Storage.deleteInvoice(originalId);
          showToast(I18n.t('invoices.toastDeleted'));
          window.location.hash = '#/invoices';
        }
      });
    }
  }

  function validate() {
    let valid = true;
    const nameInput = document.getElementById('f-client-name');
    const errName = document.getElementById('err-client-name');
    const errItems = document.getElementById('err-items');

    if (!draft.clientName.trim()) {
      nameInput.classList.add('has-error');
      errName.hidden = false;
      valid = false;
    } else {
      nameInput.classList.remove('has-error');
      errName.hidden = true;
    }

    if (draft.items.length === 0) {
      errItems.hidden = false;
      valid = false;
    } else {
      errItems.hidden = true;
    }

    return valid;
  }

  function handleSave() {
    if (!validate()) return;

    if (originalId) {
      Storage.updateInvoice(originalId, draft);
      showToast(t('toastSaved'));
    } else {
      Storage.addInvoice(draft);
      showToast(t('toastCreated'));
    }
    dirty = false;
    window.location.hash = '#/invoices';
  }

  async function attemptLeave() {
    if (dirty) {
      const ok = await confirmDialog({
        title: t('confirmDiscardTitle'),
        desc: t('confirmDiscardDesc'),
        confirmLabel: tc('discard'),
        danger: true,
      });
      if (!ok) return;
    }
    window.location.hash = '#/invoices';
  }

  // ---------- Product picker (reuses the shared slide-over) ----------
  function openProductPicker() {
    const overlay = document.getElementById('overlay');
    const panel = document.getElementById('slide-over');
    // Add-ons are never picked directly here — they're only attached to a
    // main Commission item via the add-on selector (openAddonSelector).
    const allActive = Storage.getProducts().filter(p => !p.archived && p.status === 'active' && !(p.category === 'Commission' && p.subType === 'addon'));
    let search = '';

    function renderPickerBody() {
      const filtered = allActive.filter(p =>
        !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase())
      );

      let listHtml;
      if (allActive.length === 0) {
        listHtml = `
          <div class="empty-state">
            <div class="empty-icon">&#9998;</div>
            <h3 class="empty-title">${t('pickerNoProductsTitle')}</h3>
            <p class="empty-desc">${t('pickerNoProductsDesc')}</p>
            <button class="btn btn-primary" id="picker-goto-products">${t('pickerAddProductCta')}</button>
          </div>
        `;
      } else if (filtered.length === 0) {
        listHtml = `<p class="items-empty">${t('pickerEmptySearch')}</p>`;
      } else {
        listHtml = `
          <div class="picker-list">
            ${filtered.map(p => `
              <div class="picker-item" data-id="${p.id}">
                <div>
                  <div class="picker-item-name">${escapeHtml(p.name)}</div>
                  <div class="picker-item-cat">${escapeHtml(I18n.categoryLabel(p.category))}${p.category === 'Commission' && p.subType === 'addon' ? ' · ' + escapeHtml(I18n.t('products.subTypeAddon')) : ''}</div>
                </div>
                <div class="picker-item-price">${currency(p.price)}</div>
              </div>
            `).join('')}
          </div>
        `;
      }

      document.getElementById('picker-list-container').innerHTML = listHtml;

      document.getElementById('picker-goto-products')?.addEventListener('click', () => {
        closePicker();
        window.location.hash = '#/products';
      });

      document.querySelectorAll('.picker-item').forEach(el => {
        el.addEventListener('click', () => {
          const product = allActive.find(p => p.id === el.dataset.id);
          if (product.category === 'Commission' && product.subType === 'main') {
            // Main commission items go through the add-on selector (Grab/LINE MAN
            // style). Swap the slide-over content in place — don't closePicker()
            // first, since its delayed overlay.hidden=true would otherwise hide
            // the selector right after it opens.
            openAddonSelector(product);
          } else {
            addProductToDraft(product);
            closePicker();
          }
        });
      });
    }

    panel.innerHTML = `
      <div class="slide-over-header">
        <h3 class="slide-over-title">${t('pickerTitle')}</h3>
        <button class="icon-btn" id="close-picker" aria-label="Close">&#10005;</button>
      </div>
      <div class="slide-over-body">
        ${allActive.length > 0 ? `
          <div class="search-input">
            <span class="icon">&#128269;</span>
            <input type="text" id="picker-search" placeholder="${t('pickerSearchPlaceholder')}" />
          </div>
        ` : ''}
        <div id="picker-list-container"></div>
      </div>
    `;

    renderPickerBody();

    document.getElementById('picker-search')?.addEventListener('input', (e) => {
      search = e.target.value;
      renderPickerBody();
    });

    function closePicker() {
      overlay.classList.remove('show');
      setTimeout(() => { overlay.hidden = true; }, 180);
    }

    document.getElementById('close-picker').addEventListener('click', closePicker);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePicker(); }, { once: true });

    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
  }

  // ---------- Add-on selector (Grab/LINE MAN style checklist) ----------
  // Shown when a main Commission product is picked. Lets the user tick any
  // number of active Add-on products; price updates live, then a single
  // line item (base price + selected add-ons) is pushed onto the draft.
  // Add-ons come in two pricing types:
  //   - fixed:  always adds its defaultPrice — plain checkbox.
  //   - custom: price varies per job (e.g. Commercial Use) — checking it
  //             reveals a price input; nothing is charged until a value
  //             is entered, and confirming is blocked until it's valid.
  function openAddonSelector(mainProduct) {
    const overlay = document.getElementById('overlay');
    const panel = document.getElementById('slide-over');
    const availableAddons = Storage.getProducts().filter(p =>
      !p.archived && p.status === 'active' && p.category === 'Commission' && p.subType === 'addon'
    );
    const defaultCommercialMultiplier = Number(Storage.getSettings().usage.commercialMultiplier) || 1.5;
    const selectedIds = new Set();
    const customPrices = new Map(); // addonId -> raw string typed by the user
    let usageType = 'personal'; // 'personal' | 'commercial' — never an add-on, always exclusive of it
    // Editable per-commission — starts from the Settings default but can be
    // overridden here for this one job without changing the global default.
    let multiplierRaw = String(defaultCommercialMultiplier);

    function customValue(id) {
      const raw = customPrices.get(id);
      const n = Number(raw);
      return raw !== undefined && raw !== '' && !isNaN(n) && n >= 0 ? n : null;
    }

    function activeMultiplier() {
      const n = Number(multiplierRaw);
      return multiplierRaw !== '' && !isNaN(n) && n > 0 ? n : null;
    }

    function addonsTotal() {
      // For live display: unfilled/invalid custom prices simply contribute 0
      // (never NaN), so the running total is always a valid number.
      return availableAddons.reduce((sum, a) => {
        if (!selectedIds.has(a.id)) return sum;
        if (a.pricingType === 'custom') return sum + (customValue(a.id) || 0);
        return sum + Number(a.price);
      }, 0);
    }
    // Subtotal = Base Price + Add-ons. Commercial Use multiplies this ONE
    // combined figure a single time — never applied per add-on individually.
    function subtotal() {
      return Number(mainProduct.price) + addonsTotal();
    }
    function commercialFee() {
      if (usageType !== 'commercial') return 0;
      const m = activeMultiplier();
      return m === null ? 0 : subtotal() * (m - 1);
    }
    function grandTotal() {
      return subtotal() + commercialFee();
    }
    function invalidCustomIds() {
      // Selected custom add-ons that don't yet have a valid entered price.
      return availableAddons.filter(a => a.pricingType === 'custom' && selectedIds.has(a.id) && customValue(a.id) === null).map(a => a.id);
    }

    function updateSummary() {
      document.getElementById('addon-summary-addons').textContent = currency(addonsTotal());
      document.getElementById('addon-summary-subtotal').textContent = currency(subtotal());
      const commercialRow = document.getElementById('addon-summary-commercial-row');
      if (commercialRow) {
        commercialRow.hidden = usageType !== 'commercial';
        const m = activeMultiplier();
        document.getElementById('addon-summary-commercial-multiplier').textContent = m === null ? '—' : m;
        document.getElementById('addon-summary-commercial').textContent = '+' + currency(commercialFee());
      }
      document.getElementById('addon-summary-grand').textContent = currency(grandTotal());
    }

    function renderPanel() {
      panel.innerHTML = `
        <div class="slide-over-header">
          <h3 class="slide-over-title">${t('addonSelectorTitle')}</h3>
          <button class="icon-btn" id="close-addon-selector" aria-label="Close">&#10005;</button>
        </div>
        <div class="slide-over-body">
          <div class="addon-main-item">
            <span class="addon-main-item-name">${escapeHtml(mainProduct.name)}</span>
            <span class="addon-main-item-price">${currency(mainProduct.price)}</span>
          </div>
          ${availableAddons.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">&#10024;</div>
              <h3 class="empty-title">${t('addonSelectorNoAddonsTitle')}</h3>
              <p class="empty-desc">${t('addonSelectorNoAddonsDesc')}</p>
              <button class="btn btn-secondary" id="addon-goto-products">${t('addonSelectorGotoProducts')}</button>
            </div>
          ` : `
            <div class="addon-list">
              ${availableAddons.map(a => renderAddonCard(a)).join('')}
            </div>
          `}

          <div class="usage-license-section">
            <label class="usage-section-label">${t('usageLicenseLabel')}</label>
            <div class="usage-options" id="usage-options">
              <div class="usage-option ${usageType === 'personal' ? 'is-selected' : ''}" data-usage="personal">
                <span class="usage-radio" aria-hidden="true"></span>
                <span class="usage-option-label">${t('usagePersonalOption')}</span>
              </div>
              <div class="usage-option usage-option-commercial ${usageType === 'commercial' ? 'is-selected' : ''}" data-usage="commercial">
                <span class="usage-radio" aria-hidden="true"></span>
                <span class="usage-option-label">${t('usageCommercialLabel')}</span>
                <span class="usage-multiplier-input-wrap">
                  <span class="usage-multiplier-x">&times;</span>
                  <input type="number" id="usage-multiplier-input" class="usage-multiplier-input" min="0.01" step="0.1" value="${multiplierRaw}" />
                </span>
              </div>
            </div>
            <span class="field-error" id="err-commercial-multiplier-inline" hidden>${t('errCommercialMultiplier')}</span>
          </div>
        </div>
        <div class="addon-summary">
          <div class="addon-summary-row"><span>${t('addonSelectorBasePrice')}</span><span>${currency(mainProduct.price)}</span></div>
          <div class="addon-summary-row"><span>${t('addonSelectorAddonsTotal')}</span><span id="addon-summary-addons">${currency(addonsTotal())}</span></div>
          <div class="addon-summary-row"><span>${t('breakdownSubtotalLabel')}</span><span id="addon-summary-subtotal">${currency(subtotal())}</span></div>
          <div class="addon-summary-row" id="addon-summary-commercial-row" ${usageType !== 'commercial' ? 'hidden' : ''}>
            <span>${t('breakdownCommercialLabel', { multiplier: '' })}<span id="addon-summary-commercial-multiplier">${activeMultiplier() ?? '—'}</span></span><span id="addon-summary-commercial">+${currency(commercialFee())}</span>
          </div>
          <div class="addon-summary-row addon-summary-total"><span>${t('addonSelectorGrandTotal')}</span><span id="addon-summary-grand">${currency(grandTotal())}</span></div>
        </div>
        <div class="slide-over-footer">
          <button type="button" class="btn btn-secondary" id="addon-cancel">${t('addonSelectorCancel')}</button>
          <button type="button" class="btn btn-primary" id="addon-confirm">${t('addonSelectorConfirm')}</button>
        </div>
      `;

      bindPanelEvents();
    }

    function renderAddonCard(a) {
      const isCustom = a.pricingType === 'custom';
      const isSelected = selectedIds.has(a.id);
      const raw = customPrices.get(a.id);
      return `
        <div class="addon-card ${isSelected ? 'is-selected' : ''}" data-id="${a.id}">
          <div class="addon-card-row" data-toggle="${a.id}">
            <span class="addon-check" aria-hidden="true"></span>
            <span class="addon-card-name">${escapeHtml(a.name)}</span>
            ${isCustom
              ? `<span class="addon-card-price addon-card-price-muted">${t('pricingTypeCustom')}</span>`
              : `<span class="addon-card-price">+${currency(a.price)}</span>`}
          </div>
          ${isCustom ? `
            <div class="addon-custom-input-row" ${isSelected ? '' : 'hidden'}>
              <div class="price-input addon-custom-price-input">
                <span class="currency">&#3647;</span>
                <input type="number" min="0" step="1" class="addon-custom-input" data-id="${a.id}" placeholder="0" value="${raw ?? ''}" />
              </div>
              <span class="field-error addon-custom-error" data-err-for="${a.id}" hidden>${t('addonSelectorCustomPriceError')}</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    function bindPanelEvents() {
      panel.querySelectorAll('[data-toggle]').forEach(row => {
        row.addEventListener('click', () => {
          const id = row.dataset.toggle;
          if (selectedIds.has(id)) selectedIds.delete(id); else selectedIds.add(id);
          const card = row.closest('.addon-card');
          card.classList.toggle('is-selected', selectedIds.has(id));
          const inputRow = card.querySelector('.addon-custom-input-row');
          if (inputRow) {
            inputRow.hidden = !selectedIds.has(id);
            if (selectedIds.has(id)) inputRow.querySelector('.addon-custom-input')?.focus();
            else card.querySelector('.addon-custom-error').hidden = true;
          }
          updateSummary();
        });
      });

      panel.querySelectorAll('.addon-custom-input').forEach(input => {
        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('input', (e) => {
          const id = input.dataset.id;
          customPrices.set(id, e.target.value);
          const errEl = panel.querySelector(`.addon-custom-error[data-err-for="${id}"]`);
          if (customValue(id) !== null) errEl.hidden = true;
          updateSummary();
        });
      });

      panel.querySelectorAll('.usage-option').forEach(opt => {
        opt.addEventListener('click', () => {
          usageType = opt.dataset.usage;
          panel.querySelectorAll('.usage-option').forEach(o => o.classList.toggle('is-selected', o.dataset.usage === usageType));
          updateSummary();
        });
      });

      // Editing the multiplier directly also selects "Commercial" (clicking
      // into the input bubbles up to the row's click handler above), but we
      // still need our own listener to react to keystrokes live.
      const multiplierInput = document.getElementById('usage-multiplier-input');
      multiplierInput.addEventListener('click', (e) => e.stopPropagation());
      multiplierInput.addEventListener('focus', () => {
        usageType = 'commercial';
        panel.querySelectorAll('.usage-option').forEach(o => o.classList.toggle('is-selected', o.dataset.usage === usageType));
        updateSummary();
      });
      multiplierInput.addEventListener('input', (e) => {
        multiplierRaw = e.target.value;
        const errEl = document.getElementById('err-commercial-multiplier-inline');
        if (activeMultiplier() !== null) {
          errEl.hidden = true;
          multiplierInput.classList.remove('has-error');
        }
        updateSummary();
      });

      document.getElementById('addon-goto-products')?.addEventListener('click', () => {
        closeSelector();
        window.location.hash = '#/products';
      });
      document.getElementById('close-addon-selector').addEventListener('click', closeSelector);
      document.getElementById('addon-cancel').addEventListener('click', closeSelector);
      document.getElementById('addon-confirm').addEventListener('click', () => {
        const badIds = invalidCustomIds();
        let blocked = badIds.length > 0;
        badIds.forEach(id => {
          const errEl = panel.querySelector(`.addon-custom-error[data-err-for="${id}"]`);
          if (errEl) errEl.hidden = false;
          panel.querySelector(`.addon-custom-input[data-id="${id}"]`)?.classList.add('has-error');
        });

        if (usageType === 'commercial' && activeMultiplier() === null) {
          document.getElementById('err-commercial-multiplier-inline').hidden = false;
          multiplierInput.classList.add('has-error');
          blocked = true;
        }

        if (blocked) return; // don't add the item until every price/multiplier is valid

        const chosen = availableAddons
          .filter(a => selectedIds.has(a.id))
          .map(a => ({
            productId: a.id,
            name: a.name,
            pricingType: a.pricingType,
            price: a.pricingType === 'custom' ? customValue(a.id) : Number(a.price),
          }));
        addCommissionToDraft(mainProduct, chosen, {
          usageType,
          commercialMultiplier: usageType === 'commercial' ? activeMultiplier() : null,
          preUsageSubtotal: subtotal(),
          commercialFee: commercialFee(),
        });
        closeSelector();
      });
    }

    function closeSelector() {
      overlay.classList.remove('show');
      setTimeout(() => { overlay.hidden = true; }, 180);
    }

    renderPanel();
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
  }

  function addCommissionToDraft(mainProduct, chosenAddons, usage) {
    // usage = { usageType, commercialMultiplier, preUsageSubtotal, commercialFee }
    // unitPrice stays the single all-inclusive per-unit price (base + add-ons
    // + commercial fee) so the existing qty × unitPrice math keeps working
    // unchanged everywhere else in the app.
    draft.items.push({
      id: Storage.uid(),
      productId: mainProduct.id,
      name: mainProduct.name,
      category: mainProduct.category,
      subType: mainProduct.subType || null,
      unitPrice: usage.preUsageSubtotal + usage.commercialFee,
      basePrice: Number(mainProduct.price),
      addons: chosenAddons,
      usageType: usage.usageType,
      commercialMultiplier: usage.commercialMultiplier,
      preUsageSubtotal: usage.preUsageSubtotal,
      commercialFee: usage.commercialFee,
      quantity: 1,
    });
    dirty = true;
    renderItemsTable();
    renderPreview();
    document.getElementById('err-items').hidden = true;
  }

  function addProductToDraft(product) {
    const existing = draft.items.find(it => it.productId === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      draft.items.push({
        id: Storage.uid(),
        productId: product.id,
        name: product.name,
        category: product.category,
        subType: product.subType || null,
        unitPrice: product.price,
        quantity: 1,
      });
    }
    dirty = true;
    renderItemsTable();
    renderPreview();
    document.getElementById('err-items').hidden = true;
  }

  return { render };
})();
