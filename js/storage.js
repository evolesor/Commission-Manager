/* ===========================================================
   storage.js
   Thin wrapper around localStorage.
   Data starts empty — nothing is ever seeded automatically.
   =========================================================== */

const Storage = (() => {
  const KEYS = {
    products: 'cm_products',
    invoices: 'cm_invoices',
    settings: 'cm_settings',
    jobs: 'cm_jobs',
  };

  const DEFAULT_SETTINGS = {
    language: 'en',
    artist: { artistName: '', displayName: '', contact: '', socialLinks: '' },
    payment: { method: 'bank', detail: '' },
    invoiceDefaults: { currency: 'THB', defaultNotes: '', paymentTerms: '' },
    appearance: { invoiceTemplate: 'minimal', theme: 'light' },
    // Commercial Use is a per-item price multiplier (Subtotal × multiplier),
    // NOT an add-on. Personal is always ×1 and isn't configurable; the
    // Commercial multiplier is user-editable here and defaults to ×1.5.
    usage: { commercialMultiplier: 1.5 },
  };

  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Storage read failed for', key, e);
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write failed for', key, e);
      return false;
    }
  }

  function uid() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // ---------- Products ----------
  function getProducts() {
    const list = read(KEYS.products) || [];
    let migrated = false;
    const result = list.map(p => {
      let next = p;
      if (next.category === 'Add-on') {
        migrated = true;
        next = { ...next, category: 'Commission', subType: 'addon' };
      }
      if (next.category === 'Commission' && !next.subType) {
        migrated = true;
        next = { ...next, subType: 'main' };
      }
      if (next.category === 'Commission' && next.subType === 'addon' && !next.pricingType) {
        // Add-ons created before pricingType existed default to fixed price
        // (their existing numeric `price` becomes the fixed default price).
        migrated = true;
        next = { ...next, pricingType: 'fixed' };
      }
      return next;
    });
    if (migrated) saveProducts(result);
    return result;
  }

  function saveProducts(list) {
    return write(KEYS.products, list);
  }

  // An add-on's pricing type only applies to Commission products marked as
  // subType 'addon'. Everything else (main commissions, Other products)
  // always has a plain fixed price and pricingType is null.
  function resolvePricingType(subType, data) {
    if (subType !== 'addon') return null;
    return data.pricingType === 'custom' ? 'custom' : 'fixed';
  }

  function addProduct(data) {
    const list = getProducts();
    const now = new Date().toISOString();
    const subType = data.category === 'Commission' ? (data.subType || 'main') : null;
    const pricingType = resolvePricingType(subType, data);
    const product = {
      id: uid(),
      name: data.name.trim(),
      category: data.category,
      subType,
      pricingType,
      // Custom-price add-ons have no default price — the price is entered
      // per-commission at the time it's used.
      price: pricingType === 'custom' ? null : Number(data.price),
      description: (data.description || '').trim(),
      status: data.status || 'active',
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    list.push(product);
    saveProducts(list);
    return product;
  }

  function updateProduct(id, data) {
    const list = getProducts();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const subType = data.category === 'Commission' ? (data.subType || 'main') : null;
    const pricingType = resolvePricingType(subType, data);
    list[idx] = {
      ...list[idx],
      name: data.name.trim(),
      category: data.category,
      subType,
      pricingType,
      price: pricingType === 'custom' ? null : Number(data.price),
      description: (data.description || '').trim(),
      status: data.status,
      updatedAt: new Date().toISOString(),
    };
    saveProducts(list);
    return list[idx];
  }

  function deleteProduct(id) {
    const list = getProducts().filter(p => p.id !== id);
    saveProducts(list);
  }

  function setArchived(id, archived) {
    const list = getProducts();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    list[idx].archived = archived;
    list[idx].updatedAt = new Date().toISOString();
    saveProducts(list);
    return list[idx];
  }

  function toggleActive(id) {
    const list = getProducts();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    list[idx].status = list[idx].status === 'active' ? 'inactive' : 'active';
    list[idx].updatedAt = new Date().toISOString();
    saveProducts(list);
    return list[idx];
  }

  // ---------- Settings ----------
  function getSettings() {
    const stored = read(KEYS.settings) || {};
    // Merge with defaults so newly added settings fields don't break older saved data
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      artist: { ...DEFAULT_SETTINGS.artist, ...(stored.artist || {}) },
      payment: { ...DEFAULT_SETTINGS.payment, ...(stored.payment || {}) },
      invoiceDefaults: { ...DEFAULT_SETTINGS.invoiceDefaults, ...(stored.invoiceDefaults || {}) },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...(stored.appearance || {}) },
      usage: { ...DEFAULT_SETTINGS.usage, ...(stored.usage || {}) },
    };
  }

  function saveSettings(settings) {
    return write(KEYS.settings, settings);
  }

  function updateSettings(partial) {
    const current = getSettings();
    const merged = {
      ...current,
      ...partial,
      artist: { ...current.artist, ...(partial.artist || {}) },
      payment: { ...current.payment, ...(partial.payment || {}) },
      invoiceDefaults: { ...current.invoiceDefaults, ...(partial.invoiceDefaults || {}) },
      appearance: { ...current.appearance, ...(partial.appearance || {}) },
      usage: { ...current.usage, ...(partial.usage || {}) },
    };
    saveSettings(merged);
    return merged;
  }

  // ---------- Backup: export / import ----------
  function exportAllData() {
    return {
      exportedAt: new Date().toISOString(),
      version: 1,
      products: getProducts(),
      invoices: read(KEYS.invoices) || [],
      settings: getSettings(),
      jobs: getJobs(),
    };
  }

  function importAllData(data) {
    if (!data || typeof data !== 'object') throw new Error('Invalid data');
    if (Array.isArray(data.products)) saveProducts(data.products);
    if (Array.isArray(data.invoices)) write(KEYS.invoices, data.invoices);
    if (data.settings && typeof data.settings === 'object') saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    if (Array.isArray(data.jobs)) saveJobs(data.jobs);
  }

  // ---------- Jobs (calendar / work schedule) ----------
  function getJobs() {
    return read(KEYS.jobs) || [];
  }

  function saveJobs(list) {
    return write(KEYS.jobs, list);
  }

  function ensureJobOrder() {
    const jobs = getJobs();
    let changed = false;
    const byDate = {};
    jobs.forEach(j => { (byDate[j.date] ||= []).push(j); });

    Object.values(byDate).forEach(list => {
      if (list.every(j => typeof j.order === 'number')) return;
      list.sort((a, b) =>
        (a.order ?? Infinity) - (b.order ?? Infinity) ||
        (a.time || '99:99').localeCompare(b.time || '99:99') ||
        String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
      );
      list.forEach((j, i) => { if (j.order !== i) { j.order = i; changed = true; } });
    });

    if (changed) saveJobs(jobs);
    return changed;
  }

  function snapshotDays(dateKeys) {
    const keys = new Set(dateKeys);
    return getJobs()
      .filter(j => keys.has(j.date))
      .map(j => ({ id: j.id, date: j.date, order: j.order }));
  }

  function restoreSnapshot(snapshot) {
    const jobs = getJobs();
    snapshot.forEach(s => {
      const job = jobs.find(x => x.id === s.id);
      if (job) { job.date = s.date; job.order = s.order; }
    });
    saveJobs(jobs);
  }

  function moveJob(jobId, toDate, toIndex = null) {
    const jobs = getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const fromDate = job.date;
    const target = jobs
      .filter(j => j.date === toDate && j.id !== jobId)
      .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    const index = toIndex === null ? target.length : Math.max(0, Math.min(toIndex, target.length));

    job.date = toDate;
    target.splice(index, 0, job);
    target.forEach((item, i) => { item.order = i; });

    if (fromDate !== toDate) {
      jobs.filter(j => j.date === fromDate)
        .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
        .forEach((item, i) => { item.order = i; });
    }
    saveJobs(jobs);
  }

  function addJob(data) {
    const list = getJobs();
    const now = new Date().toISOString();
    const job = {
      id: uid(),
      title: data.title.trim(),
      clientName: (data.clientName || '').trim(),
      date: data.date,
      time: (data.time || '').trim(),
      status: data.status || 'pending',
      notes: (data.notes || '').trim(),
      createdAt: now,
      updatedAt: now,
    };
    list.push(job);
    saveJobs(list);
    return job;
  }

  function updateJob(id, data) {
    const list = getJobs();
    const idx = list.findIndex(j => j.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      title: data.title.trim(),
      clientName: (data.clientName || '').trim(),
      date: data.date,
      time: (data.time || '').trim(),
      status: data.status || list[idx].status,
      notes: (data.notes || '').trim(),
      updatedAt: new Date().toISOString(),
    };
    saveJobs(list);
    return list[idx];
  }

  function setJobStatus(id, status) {
    const list = getJobs();
    const idx = list.findIndex(j => j.id === id);
    if (idx === -1) return null;
    list[idx].status = status;
    list[idx].updatedAt = new Date().toISOString();
    saveJobs(list);
    return list[idx];
  }
  function patchJob(id, partial) {
    const list = getJobs();
    const idx = list.findIndex(j => j.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...partial, updatedAt: new Date().toISOString() };
    saveJobs(list);
    return list[idx];
  }
  function deleteJob(id) {
    const list = getJobs().filter(j => j.id !== id);
    saveJobs(list);
  }

  // ---------- Invoices ----------
  function getInvoices() {
    return read(KEYS.invoices) || [];
  }

  function saveInvoices(list) {
    return write(KEYS.invoices, list);
  }

  function nextInvoiceNumber() {
    const list = getInvoices();
    const year = new Date().getFullYear();
    let max = 0;
    list.forEach(inv => {
      const m = /^INV-(\d+)$/.exec(inv.invoiceNumber || '');
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'INV-' + String(max + 1).padStart(4, '0');
  }

  function computeItemSubtotal(item) {
    return Math.round((Number(item.unitPrice) * Number(item.quantity)) * 100) / 100;
  }

  function computeInvoiceTotal(items) {
    return items.reduce((sum, it) => sum + computeItemSubtotal(it), 0);
  }

  function addInvoice(data) {
    const list = getInvoices();
    const now = new Date().toISOString();
    const items = (data.items || []).map(it => ({
      id: uid(),
      productId: it.productId || null,
      name: it.name,
      category: it.category,
      subType: it.subType || null,
      unitPrice: Number(it.unitPrice),
      basePrice: it.basePrice != null ? Number(it.basePrice) : Number(it.unitPrice),
      addons: Array.isArray(it.addons) ? it.addons.map(a => ({ productId: a.productId || null, name: a.name, pricingType: a.pricingType || null, price: Number(a.price) })) : [],
      // Commercial Use is a per-item multiplier applied to (base + add-ons),
      // never an add-on itself. usageType/commercialMultiplier/preUsageSubtotal/
      // commercialFee are snapshotted at creation time so changing the default
      // multiplier later never alters an already-saved commission/invoice.
      usageType: it.usageType === 'commercial' ? 'commercial' : (it.usageType === 'personal' ? 'personal' : null),
      commercialMultiplier: it.usageType === 'commercial' && it.commercialMultiplier != null ? Number(it.commercialMultiplier) : null,
      preUsageSubtotal: it.preUsageSubtotal != null ? Number(it.preUsageSubtotal) : null,
      commercialFee: it.commercialFee != null ? Number(it.commercialFee) : 0,
      quantity: Number(it.quantity),
      subtotal: computeItemSubtotal(it),
    }));
    const invoice = {
      id: uid(),
      invoiceNumber: data.invoiceNumber || nextInvoiceNumber(),
      clientName: (data.clientName || '').trim(),
      clientContact: (data.clientContact || '').trim(),
      issueDate: data.issueDate || now.slice(0, 10),
      dueDate: data.dueDate || '',
      items,
      total: computeInvoiceTotal(items),
      status: data.status || 'draft',
      notes: (data.notes || '').trim(),
      paymentTerms: (data.paymentTerms || '').trim(),
      template: data.template || getSettings().appearance.invoiceTemplate,
      createdAt: now,
      updatedAt: now,
    };
    list.push(invoice);
    saveInvoices(list);
    return invoice;
  }

  function updateInvoice(id, data) {
    const list = getInvoices();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return null;
    const items = (data.items || []).map(it => ({
      id: it.id || uid(),
      productId: it.productId || null,
      name: it.name,
      category: it.category,
      subType: it.subType || null,
      unitPrice: Number(it.unitPrice),
      basePrice: it.basePrice != null ? Number(it.basePrice) : Number(it.unitPrice),
      addons: Array.isArray(it.addons) ? it.addons.map(a => ({ productId: a.productId || null, name: a.name, pricingType: a.pricingType || null, price: Number(a.price) })) : [],
      // Commercial Use is a per-item multiplier applied to (base + add-ons),
      // never an add-on itself. usageType/commercialMultiplier/preUsageSubtotal/
      // commercialFee are snapshotted at creation time so changing the default
      // multiplier later never alters an already-saved commission/invoice.
      usageType: it.usageType === 'commercial' ? 'commercial' : (it.usageType === 'personal' ? 'personal' : null),
      commercialMultiplier: it.usageType === 'commercial' && it.commercialMultiplier != null ? Number(it.commercialMultiplier) : null,
      preUsageSubtotal: it.preUsageSubtotal != null ? Number(it.preUsageSubtotal) : null,
      commercialFee: it.commercialFee != null ? Number(it.commercialFee) : 0,
      quantity: Number(it.quantity),
      subtotal: computeItemSubtotal(it),
    }));
    list[idx] = {
      ...list[idx],
      clientName: (data.clientName || '').trim(),
      clientContact: (data.clientContact || '').trim(),
      issueDate: data.issueDate || list[idx].issueDate,
      dueDate: data.dueDate || '',
      items,
      total: computeInvoiceTotal(items),
      status: data.status || list[idx].status,
      notes: (data.notes || '').trim(),
      paymentTerms: (data.paymentTerms || '').trim(),
      template: data.template || list[idx].template || getSettings().appearance.invoiceTemplate,
      updatedAt: new Date().toISOString(),
    };
    saveInvoices(list);
    return list[idx];
  }

  function setInvoiceStatus(id, status) {
    const list = getInvoices();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return null;
    list[idx].status = status;
    list[idx].updatedAt = new Date().toISOString();
    saveInvoices(list);
    return list[idx];
  }

  function deleteInvoice(id) {
    const list = getInvoices().filter(i => i.id !== id);
    saveInvoices(list);
  }

  function duplicateInvoice(id) {
    const list = getInvoices();
    const original = list.find(i => i.id === id);
    if (!original) return null;
    const now = new Date().toISOString();
    const copy = {
      ...original,
      id: uid(),
      invoiceNumber: nextInvoiceNumber(),
      status: 'draft',
      items: original.items.map(it => ({ ...it, id: uid() })),
      createdAt: now,
      updatedAt: now,
    };
    list.push(copy);
    saveInvoices(list);
    return copy;
  }

  return {
    uid,
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    setArchived,
    toggleActive,
    getSettings,
    saveSettings,
    updateSettings,
    exportAllData,
    importAllData,
    getInvoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    duplicateInvoice,
    setInvoiceStatus,
    nextInvoiceNumber,
    computeItemSubtotal,
    computeInvoiceTotal,
    getJobs,
    saveJobs,
    ensureJobOrder,
    snapshotDays,
    restoreSnapshot,
    moveJob,
    patchJob,
    addJob,
    updateJob,
    setJobStatus,
    deleteJob,
  };
})();
