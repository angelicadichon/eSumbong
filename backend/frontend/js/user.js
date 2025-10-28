// Shared JS for user pages: active nav highlighting, search filter, logout, simple feedback UI
document.addEventListener('DOMContentLoaded', function() {
  // Highlight the active nav item based on current file
  try {
    const links = document.querySelectorAll('.sidebar nav ul li');
    const path = (location.pathname.split('/').pop() || 'user-dashboard.html').toLowerCase();
    links.forEach(li => {
      const linkFile = li.getAttribute('data-link');
      if (linkFile && linkFile.toLowerCase() === path) {
        li.classList.add('active');
      } else {
        li.classList.remove('active');
      }
    });
  } catch (e) {}

  // Table search on dashboard
  const tableSearch = document.getElementById('tableSearch');
  if (tableSearch) {
    tableSearch.addEventListener('input', function(e) {
      filterTable(e.target.value);
    });
  }

  // Global search (optional)
  const globalSearch = document.getElementById('searchInput');
  if (globalSearch) {
    globalSearch.addEventListener('input', function(e) {
      // simple behavior: mirror into table search if present
      const t = document.getElementById('tableSearch');
      if (t) t.value = e.target.value, t.dispatchEvent(new Event('input'));
    });
  }

  // Feedback star interactions
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const val = Number(this.dataset.value || 0);
      document.querySelectorAll('.star-btn').forEach(s => s.textContent = '☆');
      for (let i=0;i<val;i++){
        document.querySelectorAll('.star-btn')[i].textContent = '★';
      }
      // simple store on element for demo
      document.getElementById('fbResponse')?.classList.remove('success');
      document.getElementById('fbResponse')?.textContent = '';
      (document.getElementById('feedbackText') || {}).dataset.rating = val;
    });
  });
});

// helper: filter rows in complaints table
function filterTable(query) {
  const q = query.trim().toLowerCase();
  const tbody = document.getElementById('complaintsBody');
  if (!tbody) return;
  Array.from(tbody.rows).forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
}

// logout redirect
function logout(){
  // clear session data here if needed
  window.location.href = 'login.html';
}

// feedback submit
function submitFeedback(){
  const rating = (document.getElementById('feedbackText') || {}).dataset.rating || '0';
  const comment = document.getElementById('feedbackText')?.value || '';
  const resp = document.getElementById('fbResponse');
  resp.textContent = `Thanks! You rated ${rating} star(s).`;
  resp.classList.add('success');
}