/* ===========================================================
   calendar.js
   Work schedule page: month calendar grid to plan commission
   jobs by date, plus an upcoming-jobs agenda list below it.
   =========================================================== */

const CalendarPage = (() => {
  const STATUS_ORDER = ['pending', 'inProgress', 'done', 'cancelled'];
  const STATUS_I18N_KEY = {
    pending: 'statusPending',
    inProgress: 'statusInprogress',
    done: 'statusDone',
    cancelled: 'statusCancelled',
  };

  const today = new Date();

  let state = {
    viewYear: today.getFullYear(),
    viewMonth: today.getMonth(), // 0-11
    status: 'All',
    editingId: null,   // null closed, 'new' add mode, else job id
    prefillDate: null, // date key used when adding from a clicked cell
  };

  let openMenuId = null;

  function t(key, vars) { return I18n.t('calendar.' + key, vars); }
  function tc(key, vars) { return I18n.t('common.' + key, vars); }

  function statusLabel(s) { return t(STATUS_I18N_KEY[s] || 'statusPending'); }
  function statusCss(s) { return 'status-' + String(s || 'pending').toLowerCase(); }

  function pad(n) { return String(n).padStart(2, '0'); }
  function dateKey(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  // ---------- Job order migration and movement ----------
  function snapshotDays(dateKeys) {
    const keys = new Set(dateKeys);
    return Storage.getJobs()
      .filter(j => keys.has(j.date))
      .map(j => ({ id: j.id, date: j.date, order: j.order }));
  }

  function restoreSnapshot(snapshot) {
    const jobs = Storage.getJobs();
    snapshot.forEach(s => {
      const job = jobs.find(x => x.id === s.id);
      if (job) { job.date = s.date; job.order = s.order; }
    });
    Storage.saveJobs(jobs);
  }

  function moveJob(jobId, toDate, toIndex = null) {
    const jobs = Storage.getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const fromDate = job.date;

    const target = jobs
      .filter(j => j.date === toDate && j.id !== jobId)
      .sort((a, b) => a.order - b.order);

    const index = toIndex === null ? target.length : Math.max(0, Math.min(toIndex, target.length));
    job.date = toDate;
    target.splice(index, 0, job);
    target.forEach((item, i) => { item.order = i; });

    if (fromDate !== toDate) {
      jobs.filter(j => j.date === fromDate)
        .sort((a, b) => a.order - b.order)
        .forEach((item, i) => { item.order = i; });
    }
    Storage.saveJobs(jobs);
  }

  function buildMonthCells(year, month) {
    const startWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
    const cells = [];
    for (let i = 0; i < totalCells; i++) {
      const offset = i - startWeekday + 1;
      let y = year, m = month, d = offset, outside = false;
      if (offset < 1) {
        outside = true;
        d = daysInPrevMonth + offset;
        m = month - 1;
      } else if (offset > daysInMonth) {
        outside = true;
        d = offset - daysInMonth;
        m = month + 1;
      }
      const real = new Date(y, m, d);
      cells.push({
        key: dateKey(real.getFullYear(), real.getMonth(), real.getDate()),
        day: real.getDate(),
        outside,
      });
    }
    return cells;
  }

  function getFilteredJobs() {
    const list = Storage.getJobs();
    return state.status === 'All' ? list : list.filter(j => j.status === state.status);
  }

  function render() {
    Storage.ensureJobOrder();
    const root = document.getElementById('page-root');
    const jobs = Storage.getJobs();

    root.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">${t('title')}</h1>
          <p class="page-subtitle">${t('subtitle')}</p>
        </div>
        <button class="btn btn-primary" id="btn-add-job">${t('addJob')}</button>
      </div>

      <div class="filter-pills" style="margin-bottom:16px;">
        <button class="pill ${state.status === 'All' ? 'active' : ''}" data-status="All">${t('filterAll')}</button>
        ${STATUS_ORDER.map(s => `
          <button class="pill ${state.status === s ? 'active' : ''}" data-status="${s}">${statusLabel(s)}</button>
        `).join('')}
      </div>

      <div class="calendar-nav">
        <div class="calendar-month-label" id="cal-month-label"></div>
        <div class="calendar-nav-controls">
          <button class="calendar-nav-btn" id="cal-prev" aria-label="Previous month">&#8249;</button>
          <button class="btn btn-secondary btn-sm" id="cal-today">${t('today')}</button>
          <button class="calendar-nav-btn" id="cal-next" aria-label="Next month">&#8250;</button>
        </div>
      </div>

      <div class="calendar-legend">
        ${STATUS_ORDER.map(s => `
          <span class="calendar-legend-item">
            <span class="calendar-legend-dot ${statusCss(s)}"></span>${statusLabel(s)}
          </span>
        `).join('')}
      </div>

      <div id="cal-grid-container"></div>

      <h2 class="editor-card-title" style="margin: 4px 0 12px;">${t('upcomingTitle')}</h2>
      <div id="cal-upcoming-container"></div>
    `;

    document.getElementById('btn-add-job').addEventListener('click', () => openForm(null, todayKey));
    document.getElementById('cal-prev').addEventListener('click', () => shiftMonth(-1));
    document.getElementById('cal-next').addEventListener('click', () => shiftMonth(1));
    document.getElementById('cal-today').addEventListener('click', () => {
      state.viewYear = today.getFullYear();
      state.viewMonth = today.getMonth();
      renderGrid();
    });

    document.querySelectorAll('.filter-pills .pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.status = btn.dataset.status;
        document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.toggle('active', p.dataset.status === state.status));
        renderGrid();
        renderUpcoming();
      });
    });

    renderGrid();
    renderUpcoming();

    if (state.editingId !== null) {
      renderSlideOver();
    }

    if (jobs.length === 0) {
      // still show the empty hint below the calendar via the upcoming list message
    }
  }

  function shiftMonth(delta) {
    let m = state.viewMonth + delta;
    let y = state.viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    state.viewMonth = m;
    state.viewYear = y;
    renderGrid();
  }

  function renderGrid() {
    const label = document.getElementById('cal-month-label');
    const monthNames = t('monthNames');
    const displayYear = I18n.getLocale() === 'th' ? state.viewYear + 543 : state.viewYear;
    label.textContent = `${monthNames[state.viewMonth]} ${displayYear}`;

    const container = document.getElementById('cal-grid-container');
    const cells = buildMonthCells(state.viewYear, state.viewMonth);
    const jobs = getFilteredJobs();
    const weekdayShort = t('weekdayShort');

    const jobsByDay = {};
    jobs.forEach(j => {
      (jobsByDay[j.date] = jobsByDay[j.date] || []).push(j);
    });
    Object.values(jobsByDay).forEach(list => list.sort((a, b) =>
      (a.order ?? Infinity) - (b.order ?? Infinity) ||
      (a.time || '99:99').localeCompare(b.time || '99:99')
    ));

    const MAX_SHOWN = 3;

    container.innerHTML = `
      <div class="calendar-grid">
        ${weekdayShort.map(w => `<div class="calendar-weekday">${w}</div>`).join('')}
        ${cells.map(cell => {
          const dayJobs = jobsByDay[cell.key] || [];
          const shown = dayJobs.slice(0, MAX_SHOWN);
          const extra = dayJobs.length - shown.length;
          return `
            <div class="calendar-cell ${cell.outside ? 'is-outside' : ''} ${cell.key === todayKey ? 'is-today' : ''}" data-date="${cell.key}">
              <span class="calendar-cell-date">${cell.day}</span>
              ${shown.map(j => `<div class="cal-event ${statusCss(j.status)}" data-job="${j.id}" draggable="true">${escapeHtml(j.title)}</div>`).join('')}
              ${extra > 0 ? `<div class="cal-more">${t('moreCount', { count: extra })}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    let draggedId = null;

    container.querySelectorAll('.cal-event').forEach(eventEl => {
      eventEl.addEventListener('dragstart', (e) => {
        draggedId = e.currentTarget.dataset.job;
        e.currentTarget.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedId);
      });
      eventEl.addEventListener('dragend', (e) => {
        e.currentTarget.style.opacity = '1';
        draggedId = null;
      });
    });

    container.querySelectorAll('.calendar-cell').forEach(cellEl => {
      cellEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        cellEl.classList.add('drag-over');
      });
      cellEl.addEventListener('dragleave', () => cellEl.classList.remove('drag-over'));
      cellEl.addEventListener('drop', (e) => {
        e.preventDefault();
        cellEl.classList.remove('drag-over');
        const jobId = draggedId || e.dataTransfer.getData('text/plain');
        const job = Storage.getJobs().find(j => j.id === jobId);
        if (!job) return;

        const fromDate = job.date;
        const toDate = cellEl.dataset.date;
        const snapshot = Storage.snapshotDays([fromDate, toDate]);
        Storage.moveJob(jobId, toDate);
        renderGrid();
        renderUpcoming();

        showToast(t(fromDate === toDate ? 'toastReordered' : 'toastMoved'), {
          action: tc('undo'),
          onAction: () => {
            Storage.restoreSnapshot(snapshot);
            renderGrid();
            renderUpcoming();
          },
        });
      });

      cellEl.addEventListener('click', (e) => {
        const jobChip = e.target.closest('.cal-event');
        if (jobChip) {
          e.stopPropagation();
          openForm(jobChip.dataset.job, null);
        } else {
          openForm(null, cellEl.dataset.date);
        }
      });
    });
  }

  function currentJobRows() {
    return getFilteredJobs()
      .filter(j => j.date >= todayKey)
      .sort((a, b) =>
        a.date.localeCompare(b.date) ||
        (a.order ?? Infinity) - (b.order ?? Infinity) ||
        (a.time || '99:99').localeCompare(b.time || '99:99')
      );
  }

  function renderUpcoming() {
    const container = document.getElementById('cal-upcoming-container');
    const all = Storage.getJobs();

    if (all.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">&#128197;</div>
          <h3 class="empty-title">${t('emptyTitle')}</h3>
          <p class="empty-desc">${t('emptyDesc')}</p>
          <button class="btn btn-primary" id="empty-add-job">${t('addJob')}</button>
        </div>
      `;
      document.getElementById('empty-add-job').addEventListener('click', () => openForm(null, todayKey));
      return;
    }

    const rows = currentJobRows();
    if (rows.length === 0) {
      container.innerHTML = `<p class="items-empty">${t('noUpcoming')}</p>`;
      return;
    }

    container.innerHTML = `
      <div class="product-list">
        ${rows.map(j => renderJobRow(j)).join('')}
      </div>
    `;
    bindRowEvents();
  }

  function renderJobRow(j) {
    return `
      <div class="product-card" data-id="${j.id}">
        <div class="product-main" style="cursor:pointer;">
          <div class="product-row">
            <p class="product-name">${escapeHtml(j.title)}</p>
            <span class="status-badge ${statusCss(j.status)}">${statusLabel(j.status)}</span>
          </div>
          <div class="product-meta">
            <span>${escapeHtml(j.date)}${j.time ? ' &middot; ' + escapeHtml(j.time) : ''}</span>
            ${j.clientName ? `<span class="meta-dot">&middot;</span><span>${escapeHtml(j.clientName)}</span>` : ''}
          </div>
          ${j.notes ? `<p class="product-desc">${escapeHtml(j.notes)}</p>` : ''}
        </div>
        <div style="position:relative;">
          <button class="card-menu-btn" data-menu="${j.id}" aria-label="More actions">&#8942;</button>
        </div>
      </div>
    `;
  }

  function bindRowEvents() {
    document.querySelectorAll('#cal-upcoming-container .product-main').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.closest('.product-card').dataset.id;
        openForm(id, null);
      });
    });
    document.querySelectorAll('#cal-upcoming-container .card-menu-btn').forEach(btn => {
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
    const job = Storage.getJobs().find(j => j.id === id);
    const wrapper = btn.parentElement;

    const menu = document.createElement('div');
    menu.className = 'card-menu';
    menu.innerHTML = `
      <button data-action="edit">${t('menuEdit')}</button>
      <button data-action="delete" class="danger">${t('menuDelete')}</button>
    `;
    wrapper.appendChild(menu);

    menu.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
      e.stopPropagation(); closeMenu(); openForm(id, null);
    });
    menu.querySelector('[data-action="delete"]').addEventListener('click', async (e) => {
      e.stopPropagation(); closeMenu();
      const ok = await confirmDialog({
        title: t('confirmDeleteTitle'),
        desc: t('confirmDeleteDesc', { title: job.title }),
        confirmLabel: tc('delete'),
        danger: true,
      });
      if (ok) {
        Storage.deleteJob(id);
        showToast(t('toastDeleted'));
        renderGrid();
        renderUpcoming();
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

  // ---------- Add / Edit form (slide-over) ----------

  function openForm(id, prefillDate) {
    state.editingId = id === null ? 'new' : id;
    state.prefillDate = prefillDate;
    renderSlideOver();
  }

  function closeForm() {
    const overlay = document.getElementById('overlay');
    overlay.classList.remove('show');
    setTimeout(() => { overlay.hidden = true; }, 180);
    state.editingId = null;
    state.prefillDate = null;
  }

  function renderSlideOver() {
    const overlay = document.getElementById('overlay');
    const panel = document.getElementById('slide-over');
    const isNew = state.editingId === 'new';
    const job = isNew ? null : Storage.getJobs().find(j => j.id === state.editingId);
    const initialDate = job?.date || state.prefillDate || todayKey;

    panel.innerHTML = `
      <div class="slide-over-header">
        <h3 class="slide-over-title" id="slide-over-title">${isNew ? t('formAddTitle') : t('formEditTitle')}</h3>
        <button class="icon-btn" id="close-slide-over" aria-label="Close">&#10005;</button>
      </div>
      <form id="job-form" novalidate>
        <div class="slide-over-body">
          <div class="field">
            <label for="f-job-title">${t('fieldTitle')}</label>
            <input type="text" id="f-job-title" placeholder="${t('fieldTitlePlaceholder')}" value="${escapeHtml(job?.title || '')}" />
            <span class="field-error" id="err-job-title" hidden>${t('errTitle')}</span>
          </div>

          <div class="field">
            <label for="f-job-client">${t('fieldClient')} <span class="hint">(${tc('optional')})</span></label>
            <input type="text" id="f-job-client" placeholder="${t('fieldClientPlaceholder')}" value="${escapeHtml(job?.clientName || '')}" />
          </div>

          <div class="field">
            <label for="f-job-date">${t('fieldDate')}</label>
            <input type="date" id="f-job-date" value="${initialDate}" />
            <span class="field-error" id="err-job-date" hidden>${t('errDate')}</span>
          </div>

          <div class="field">
            <label for="f-job-time">${t('fieldTime')} <span class="hint">(${tc('optional')})</span></label>
            <input type="time" id="f-job-time" value="${escapeHtml(job?.time || '')}" />
          </div>

          <div class="field">
            <label>${t('fieldStatus')}</label>
            <div class="segmented segmented-wrap" id="f-job-status">
              ${STATUS_ORDER.map(s => `
                <button type="button" data-status="${s}" class="${(job?.status || 'pending') === s ? 'active' : ''}">${statusLabel(s)}</button>
              `).join('')}
            </div>
          </div>

          <div class="field">
            <label for="f-job-notes">${t('fieldNotes')} <span class="hint">(${tc('optional')})</span></label>
            <textarea id="f-job-notes" placeholder="${t('fieldNotesPlaceholder')}">${escapeHtml(job?.notes || '')}</textarea>
          </div>
        </div>

        <div class="slide-over-footer">
          <button type="button" class="btn btn-secondary" id="cancel-form">${tc('cancel')}</button>
          <button type="submit" class="btn btn-primary">${tc('save')}</button>
        </div>
      </form>
    `;

    let selectedStatus = job?.status || 'pending';
    panel.querySelectorAll('#f-job-status button').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedStatus = btn.dataset.status;
        panel.querySelectorAll('#f-job-status button').forEach(b => b.classList.toggle('active', b.dataset.status === selectedStatus));
      });
    });

    const form = document.getElementById('job-form');
    let dirty = false;
    form.addEventListener('input', () => { dirty = true; });

    document.getElementById('close-slide-over').addEventListener('click', () => attemptClose(dirty));
    document.getElementById('cancel-form').addEventListener('click', () => attemptClose(dirty));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) attemptClose(dirty); }, { once: true });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('f-job-title').value;
      const clientName = document.getElementById('f-job-client').value;
      const date = document.getElementById('f-job-date').value;
      const time = document.getElementById('f-job-time').value;
      const notes = document.getElementById('f-job-notes').value;

      let valid = true;
      const titleInput = document.getElementById('f-job-title');
      const dateInput = document.getElementById('f-job-date');
      const errTitle = document.getElementById('err-job-title');
      const errDate = document.getElementById('err-job-date');

      if (!title.trim()) {
        titleInput.classList.add('has-error');
        errTitle.hidden = false;
        valid = false;
      } else {
        titleInput.classList.remove('has-error');
        errTitle.hidden = true;
      }

      if (!date) {
        dateInput.classList.add('has-error');
        errDate.hidden = false;
        valid = false;
      } else {
        dateInput.classList.remove('has-error');
        errDate.hidden = true;
      }

      if (!valid) return;

      const data = { title, clientName, date, time, status: selectedStatus, notes };

      if (isNew) {
        Storage.addJob(data);
        showToast(t('toastAdded'));
      } else {
        Storage.updateJob(job.id, data);
        showToast(t('toastSaved'));
      }

      closeForm();
      renderGrid();
      renderUpcoming();
    });

    overlay.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add('show');
      document.getElementById('f-job-title').focus();
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

  return {
    render,
    saveJobs: Storage.saveJobs,
    patchJob: Storage.patchJob,
    ensureJobOrder: Storage.ensureJobOrder,
    snapshotDays,
    restoreSnapshot,
    moveJob,
  };
})();
