/* ===========================================================
   settings.js
   Language, artist profile, payment info, invoice defaults,
   and JSON data backup/restore.
   =========================================================== */

const SettingsPage = (() => {
  function t(key, vars) { return I18n.t('settings.' + key, vars); }
  function tc(key) { return I18n.t('common.' + key); }

  // Preview swatch colors shown in the theme picker — intentionally hardcoded
  // to each theme's real colors so every option previews correctly no matter
  // which theme is currently active.
  const THEME_OPTIONS = [
    { id: 'light', bg: '#F6F4EE', accent: '#B8760F' },
    { id: 'dark', bg: '#1B1916', accent: '#D99A3D' },
    { id: 'blue', bg: '#F6F4EE', accent: '#2F6FED' },
    { id: 'pink', bg: '#F6F4EE', accent: '#D6417D' },
  ];

  function render() {
    const root = document.getElementById('page-root');
    const settings = Storage.getSettings();
    const currentLang = I18n.getLocale();

    root.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">${t('title')}</h1>
          <p class="page-subtitle">${t('subtitle')}</p>
        </div>
      </div>

      <div class="settings-sections">

        <section class="settings-card">
          <h2 class="settings-card-title">${t('languageSection')}</h2>
          <div class="field">
            <label>${t('languageLabel')}</label>
            <div class="segmented" id="f-language">
              ${I18n.LANG_ORDER.map(lang => `
                <button type="button" data-lang="${lang}" class="${currentLang === lang ? 'active' : ''}">${I18n.langName(lang)}</button>
              `).join('')}
            </div>
            <span class="hint">${t('languageHint')}</span>
          </div>
        </section>

        <section class="settings-card">
          <h2 class="settings-card-title">${t('themeSection')}</h2>
          <div class="field">
            <label>${t('themeLabel')}</label>
            <div class="theme-picker" id="f-theme">
              ${THEME_OPTIONS.map(opt => `
                <button type="button" class="theme-option ${Theme.getTheme() === opt.id ? 'active' : ''}" data-theme-value="${opt.id}">
                  <span class="theme-swatch" style="background:${opt.bg};" aria-hidden="true">
                    <span class="theme-swatch-accent" style="background:${opt.accent};"></span>
                  </span>
                  <span class="theme-option-name">${t('theme' + opt.id.charAt(0).toUpperCase() + opt.id.slice(1))}</span>
                </button>
              `).join('')}
            </div>
            <span class="hint">${t('themeHint')}</span>
          </div>
        </section>

        <section class="settings-card">
          <h2 class="settings-card-title">${t('usageSection')}</h2>
          <p class="settings-card-desc">${t('usageHint')}</p>
          <div class="field">
            <div class="status-toggle-row">
              <div class="label-group">
                <span class="label-title">${t('usagePersonalLabel')}</span>
                <span class="label-sub">${t('usagePersonalHint')}</span>
              </div>
            </div>
          </div>
          <div class="field">
            <label for="f-commercial-multiplier">${t('commercialMultiplierLabel')}</label>
            <div class="price-input" style="max-width:160px;">
              <span class="currency">&times;</span>
              <input type="number" id="f-commercial-multiplier" min="0.01" step="0.1" value="${settings.usage.commercialMultiplier}" />
            </div>
            <span class="hint">${t('commercialMultiplierHint')}</span>
            <span class="field-error" id="err-commercial-multiplier" hidden>${t('errCommercialMultiplier')}</span>
          </div>
        </section>

        <form id="settings-form">
          <section class="settings-card">
            <h2 class="settings-card-title">${t('artistSection')}</h2>
            <div class="field">
              <label for="f-artist-name">${t('artistName')}</label>
              <input type="text" id="f-artist-name" value="${escapeHtml(settings.artist.artistName)}" />
            </div>
            <div class="field">
              <label for="f-display-name">${t('displayName')}</label>
              <input type="text" id="f-display-name" value="${escapeHtml(settings.artist.displayName)}" />
            </div>
            <div class="field">
              <label for="f-contact">${t('contact')}</label>
              <input type="text" id="f-contact" value="${escapeHtml(settings.artist.contact)}" placeholder="Twitter / Discord / email" />
            </div>
            <div class="field">
              <label for="f-social">${t('socialLinks')} <span class="hint">(${tc('optional')})</span></label>
              <input type="text" id="f-social" value="${escapeHtml(settings.artist.socialLinks)}" />
            </div>
          </section>

          <section class="settings-card">
            <h2 class="settings-card-title">${t('paymentSection')}</h2>
            <div class="field">
              <label>${t('paymentMethod')}</label>
              <div class="segmented" id="f-payment-method">
                ${['bank', 'promptpay', 'paypal', 'other'].map(m => `
                  <button type="button" data-method="${m}" class="${settings.payment.method === m ? 'active' : ''}">${t('method' + m.charAt(0).toUpperCase() + m.slice(1))}</button>
                `).join('')}
              </div>
            </div>
            <div class="field">
              <label for="f-payment-detail">${t('paymentDetail')}</label>
              <input type="text" id="f-payment-detail" value="${escapeHtml(settings.payment.detail)}" />
            </div>
          </section>

          <section class="settings-card">
            <h2 class="settings-card-title">${t('invoiceDefaultsSection')}</h2>
            <div class="field">
              <label for="f-currency">${t('currency')}</label>
              <input type="text" id="f-currency" value="${escapeHtml(settings.invoiceDefaults.currency)}" style="max-width:120px;" />
            </div>
            <div class="field">
              <label for="f-default-notes">${t('defaultNotes')} <span class="hint">(${tc('optional')})</span></label>
              <textarea id="f-default-notes">${escapeHtml(settings.invoiceDefaults.defaultNotes)}</textarea>
            </div>
            <div class="field">
              <label for="f-payment-terms">${t('paymentTerms')} <span class="hint">(${tc('optional')})</span></label>
              <input type="text" id="f-payment-terms" value="${escapeHtml(settings.invoiceDefaults.paymentTerms)}" />
            </div>
          </section>

          <button type="submit" class="btn btn-primary btn-block">${t('saveSettings')}</button>
        </form>

        <section class="settings-card">
          <h2 class="settings-card-title">${t('dataSection')}</h2>
          <p class="settings-card-desc">${t('dataHint')}</p>
          <div class="settings-data-actions">
            <button class="btn btn-secondary" id="btn-export">${t('exportData')}</button>
            <button class="btn btn-secondary" id="btn-import">${t('importData')}</button>
            <input type="file" id="import-file" accept="application/json" hidden />
          </div>
        </section>

      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // Language switcher — applies immediately, no save button needed
    document.querySelectorAll('#f-language button').forEach(btn => {
      btn.addEventListener('click', () => {
        I18n.setLocale(btn.dataset.lang);
        showToast(t('toastSaved'));
      });
    });

    // Theme switcher — applies immediately, no save button needed
    document.querySelectorAll('#f-theme button').forEach(btn => {
      btn.addEventListener('click', () => {
        Theme.setTheme(btn.dataset.themeValue);
        document.querySelectorAll('#f-theme button').forEach(b => b.classList.toggle('active', b === btn));
        showToast(t('toastSaved'));
      });
    });

    let selectedMethod = Storage.getSettings().payment.method;
    document.querySelectorAll('#f-payment-method button').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedMethod = btn.dataset.method;
        document.querySelectorAll('#f-payment-method button').forEach(b => b.classList.toggle('active', b.dataset.method === selectedMethod));
      });
    });

    document.getElementById('settings-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const multiplierInput = document.getElementById('f-commercial-multiplier');
      const errMultiplier = document.getElementById('err-commercial-multiplier');
      const multiplierVal = Number(multiplierInput.value);
      if (multiplierInput.value === '' || isNaN(multiplierVal) || multiplierVal <= 0) {
        multiplierInput.classList.add('has-error');
        errMultiplier.hidden = false;
        return;
      }
      multiplierInput.classList.remove('has-error');
      errMultiplier.hidden = true;

      Storage.updateSettings({
        artist: {
          artistName: document.getElementById('f-artist-name').value.trim(),
          displayName: document.getElementById('f-display-name').value.trim(),
          contact: document.getElementById('f-contact').value.trim(),
          socialLinks: document.getElementById('f-social').value.trim(),
        },
        payment: {
          method: selectedMethod,
          detail: document.getElementById('f-payment-detail').value.trim(),
        },
        invoiceDefaults: {
          currency: document.getElementById('f-currency').value.trim() || 'THB',
          defaultNotes: document.getElementById('f-default-notes').value.trim(),
          paymentTerms: document.getElementById('f-payment-terms').value.trim(),
        },
        usage: {
          commercialMultiplier: multiplierVal,
        },
      });
      showToast(t('toastSaved'));
    });

    document.getElementById('btn-export').addEventListener('click', () => {
      const data = Storage.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `commission-manager-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

    const fileInput = document.getElementById('import-file');
    document.getElementById('btn-import').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const ok = await confirmDialog({
          title: t('importConfirmTitle'),
          desc: t('importConfirmDesc'),
          confirmLabel: tc('confirm'),
          danger: true,
        });
        if (ok) {
          Storage.importAllData(data);
          showToast(t('toastImported'));
          render();
        }
      } catch (err) {
        console.error(err);
        showToast(t('toastImportError'));
      } finally {
        fileInput.value = '';
      }
    });
  }

  return { render };
})();
