/* ===========================================================
   router.js
   Minimal hash router.
   #/dashboard
   #/products
   #/invoices
   #/invoices/new
   #/invoices/edit/:id
   #/calendar
   #/settings
   =========================================================== */

const PAGES = ['dashboard', 'products', 'invoices', 'calendar', 'settings'];

function parseHash() {
  return window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

function updateActiveNav(page) {
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === page);
  });
}

function navigate() {
  const parts = parseHash();
  const page = PAGES.includes(parts[0]) ? parts[0] : 'dashboard';

  updateActiveNav(page);
  I18n.applyStatic();

  if (page === 'dashboard') {
    DashboardPage.render();
  } else if (page === 'products') {
    ProductsPage.render();
  } else if (page === 'invoices') {
    if (parts[1] === 'new') {
      InvoiceEditorPage.render(null);
    } else if (parts[1] === 'edit' && parts[2]) {
      InvoiceEditorPage.render(parts[2]);
    } else {
      InvoicesPage.render();
    }
  } else if (page === 'calendar') {
    CalendarPage.render();
  } else {
    SettingsPage.render();
  }

  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', navigate);
window.addEventListener('localechange', navigate);
window.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  if (!window.location.hash) {
    window.location.hash = '#/dashboard';
  }
  navigate();
});
