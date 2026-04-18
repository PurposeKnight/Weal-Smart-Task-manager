/* ==============================================
   TaskFlow — app.js  (Full CRUD with localStorage)
   ============================================== */

'use strict';

/* ── State ── */
let tasks   = JSON.parse(localStorage.getItem('taskflow_tasks') || '[]');
let filter  = 'all';
let search  = '';
let sort    = 'newest';
let modalId = null;   // task shown in modal

/* ── Persist ── */
function saveTasks() {
  localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
}

/* ── Unique ID ── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ── DOM refs ── */
const form         = document.getElementById('task-form');
const titleInput   = document.getElementById('task-title');
const descInput    = document.getElementById('task-desc');
const priorityInput= document.getElementById('task-priority');
const categoryInput= document.getElementById('task-category');
const dueInput     = document.getElementById('task-due');
const editIdInput  = document.getElementById('edit-id');
const submitBtn    = document.getElementById('submit-btn');
const submitLabel  = document.getElementById('submit-label');
const formTitle    = document.getElementById('form-title');
const cancelEditBtn= document.getElementById('cancel-edit-btn');

const taskListEl   = document.getElementById('task-list');
const emptyState   = document.getElementById('empty-state');
const searchInput  = document.getElementById('search-input');
const sortSelect   = document.getElementById('sort-select');
const clearAllBtn  = document.getElementById('clear-all-btn');

const countTotal   = document.getElementById('count-total');
const countPending = document.getElementById('count-pending');
const countDone    = document.getElementById('count-done');

const modalOverlay  = document.getElementById('modal-overlay');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalEditBtn  = document.getElementById('modal-edit-btn');
const modalDeleteBtn= document.getElementById('modal-delete-btn');
const modalTitle    = document.getElementById('modal-task-title');
const modalDesc     = document.getElementById('modal-task-desc');
const modalMeta     = document.getElementById('modal-meta');
const modalBadge    = document.getElementById('modal-priority-badge');

const titleCount    = document.getElementById('title-count');
const descCount     = document.getElementById('desc-count');
const toastContainer= document.getElementById('toast-container');


/* ══════════════════════════
   CREATE / UPDATE  (C + U)
══════════════════════════ */
form.addEventListener('submit', e => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) { shake(titleInput); return; }

  const isEditing = editIdInput.value !== '';

  if (isEditing) {
    /* UPDATE */
    const idx = tasks.findIndex(t => t.id === editIdInput.value);
    if (idx === -1) return;
    tasks[idx] = {
      ...tasks[idx],
      title,
      description : descInput.value.trim(),
      priority    : priorityInput.value,
      category    : categoryInput.value,
      due         : dueInput.value,
      updatedAt   : new Date().toISOString(),
    };
    saveTasks();
    showToast('Task updated!', 'success');
    resetForm();
  } else {
    /* CREATE */
    const task = {
      id          : uid(),
      title,
      description : descInput.value.trim(),
      priority    : priorityInput.value,
      category    : categoryInput.value,
      due         : dueInput.value,
      completed   : false,
      createdAt   : new Date().toISOString(),
      updatedAt   : new Date().toISOString(),
    };
    tasks.unshift(task);
    saveTasks();
    showToast('Task added!', 'success');
    resetForm();
  }

  renderAll();
});

/* ── Reset form to "create" mode ── */
function resetForm() {
  form.reset();
  editIdInput.value = '';
  submitLabel.textContent = 'Add Task';
  formTitle.textContent   = '✨ New Task';
  cancelEditBtn.classList.add('hidden');
  titleCount.textContent = '0/100';
  descCount.textContent  = '0/300';
}

/* ── Cancel edit ── */
cancelEditBtn.addEventListener('click', resetForm);


/* ══════════════════════════
   READ / RENDER  (R)
══════════════════════════ */
function getFiltered() {
  let result = [...tasks];

  /* filter */
  if (filter === 'pending')   result = result.filter(t => !t.completed);
  if (filter === 'completed') result = result.filter(t =>  t.completed);
  if (filter === 'high')      result = result.filter(t => t.priority === 'high');

  /* search */
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }

  /* sort */
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  result.sort((a, b) => {
    switch (sort) {
      case 'oldest':   return new Date(a.createdAt) - new Date(b.createdAt);
      case 'priority': return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'due':      return (a.due || 'z').localeCompare(b.due || 'z');
      case 'az':       return a.title.localeCompare(b.title);
      default:         return new Date(b.createdAt) - new Date(a.createdAt); /* newest */
    }
  });

  return result;
}

function renderAll() {
  const filtered = getFiltered();
  taskListEl.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    filtered.forEach(t => taskListEl.appendChild(buildCard(t)));
  }

  updateStats();
}

function buildCard(task) {
  const card = document.createElement('div');
  card.className = `task-card priority-${task.priority}${task.completed ? ' completed' : ''}`;
  card.setAttribute('role', 'listitem');
  card.dataset.id = task.id;

  const isOverdue = task.due && !task.completed && new Date(task.due) < new Date(new Date().toDateString());

  card.innerHTML = `
    <div class="task-checkbox${task.completed ? ' checked' : ''}" 
         id="chk-${task.id}"
         role="checkbox" 
         aria-checked="${task.completed}" 
         tabindex="0"
         title="${task.completed ? 'Mark pending' : 'Mark done'}"></div>
    <div class="task-card-body">
      <div class="task-card-title">${escHtml(task.title)}</div>
      ${task.description ? `<div class="task-card-desc">${escHtml(task.description)}</div>` : ''}
      <div class="task-card-meta">
        <span class="tag tag-priority-${task.priority}">${priorityLabel(task.priority)}</span>
        <span class="tag tag-category">${categoryLabel(task.category)}</span>
        ${task.due ? `<span class="tag ${isOverdue ? 'tag-overdue' : 'tag-due'}">📅 ${formatDate(task.due)}${isOverdue ? ' Overdue' : ''}</span>` : ''}
      </div>
    </div>
    <div class="task-card-actions">
      <button class="card-action-btn edit-btn" data-id="${task.id}" title="Edit task" aria-label="Edit task">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="card-action-btn delete-btn" data-id="${task.id}" title="Delete task" aria-label="Delete task">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
        </svg>
      </button>
    </div>
  `;

  /* toggle complete */
  const chk = card.querySelector('.task-checkbox');
  chk.addEventListener('click', e => { e.stopPropagation(); toggleComplete(task.id); });
  chk.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleComplete(task.id); } });

  /* edit */
  card.querySelector('.edit-btn').addEventListener('click', e => { e.stopPropagation(); startEdit(task.id); });

  /* delete */
  card.querySelector('.delete-btn').addEventListener('click', e => { e.stopPropagation(); deleteTask(task.id); });

  /* open modal on card click */
  card.addEventListener('click', () => openModal(task.id));

  return card;
}

function updateStats() {
  countTotal.textContent   = tasks.length;
  countPending.textContent = tasks.filter(t => !t.completed).length;
  countDone.textContent    = tasks.filter(t =>  t.completed).length;
}


/* ══════════════════════════
   UPDATE HELPERS  (U)
══════════════════════════ */

/* Toggle completed */
function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed  = !task.completed;
  task.updatedAt  = new Date().toISOString();
  saveTasks();
  renderAll();
  showToast(task.completed ? 'Task completed! 🎉' : 'Marked as pending', task.completed ? 'success' : 'info');
}

/* Fill form for editing */
function startEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  titleInput.value    = task.title;
  descInput.value     = task.description || '';
  priorityInput.value = task.priority;
  categoryInput.value = task.category;
  dueInput.value      = task.due || '';
  editIdInput.value   = task.id;

  titleCount.textContent = `${task.title.length}/100`;
  descCount.textContent  = `${(task.description||'').length}/300`;

  submitLabel.textContent = 'Save Changes';
  formTitle.textContent   = '✏️ Edit Task';
  cancelEditBtn.classList.remove('hidden');

  closeModal();
  titleInput.focus();
  titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


/* ══════════════════════════
   DELETE  (D)
══════════════════════════ */
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderAll();
  closeModal();
  showToast('Task deleted', 'error');
}

/* Clear all */
clearAllBtn.addEventListener('click', () => {
  if (tasks.length === 0) return;
  if (!confirm('Delete ALL tasks? This cannot be undone.')) return;
  tasks = [];
  saveTasks();
  renderAll();
  resetForm();
  showToast('All tasks cleared', 'warning');
});


/* ══════════════════════════
   MODAL (Detail View)
══════════════════════════ */
function openModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  modalId = id;

  const isOverdue = task.due && !task.completed && new Date(task.due) < new Date(new Date().toDateString());

  modalTitle.textContent = task.title;
  modalDesc.textContent  = task.description || 'No description provided.';

  modalBadge.textContent  = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
  modalBadge.className    = `modal-badge ${task.priority}`;

  modalMeta.innerHTML = `
    <span class="tag tag-category">${categoryLabel(task.category)}</span>
    ${task.due ? `<span class="tag ${isOverdue ? 'tag-overdue' : 'tag-due'}">📅 ${formatDate(task.due)}${isOverdue ? ' · Overdue' : ''}</span>` : ''}
    <span class="tag tag-category">Created ${timeAgo(task.createdAt)}</span>
    ${task.completed ? '<span class="tag tag-priority-low">✅ Completed</span>' : ''}
  `;

  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  modalId = null;
}

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

modalEditBtn.addEventListener('click', () => {
  if (modalId) startEdit(modalId);
});

modalDeleteBtn.addEventListener('click', () => {
  if (modalId && confirm('Delete this task?')) deleteTask(modalId);
});

/* close modal with Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});


/* ══════════════════════════
   SEARCH + FILTER + SORT
══════════════════════════ */
searchInput.addEventListener('input', e => {
  search = e.target.value;
  renderAll();
});

sortSelect.addEventListener('change', e => {
  sort = e.target.value;
  renderAll();
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    renderAll();
  });
});


/* ══════════════════════════
   CHARACTER COUNTERS
══════════════════════════ */
titleInput.addEventListener('input', () => {
  titleCount.textContent = `${titleInput.value.length}/100`;
});
descInput.addEventListener('input', () => {
  descCount.textContent = `${descInput.value.length}/300`;
});


/* ══════════════════════════
   TOAST
══════════════════════════ */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-dot"></span>${escHtml(message)}`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 2800);
}


/* ══════════════════════════
   UTILITIES
══════════════════════════ */
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shake(el) {
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shakeX 0.4s ease';
  el.style.borderColor = 'var(--danger)';
  el.addEventListener('input', () => { el.style.borderColor = ''; el.style.animation = ''; }, { once: true });
}
/* inject shake keyframe */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shakeX {
    0%,100%{transform:translateX(0)}
    20%,60%{transform:translateX(-5px)}
    40%,80%{transform:translateX(5px)}
  }
`;
document.head.appendChild(shakeStyle);

function priorityLabel(p) {
  return { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' }[p] || p;
}

function categoryLabel(c) {
  return { personal: '🏠 Personal', work: '💼 Work', study: '📚 Study', health: '💪 Health', other: '📌 Other' }[c] || c;
}

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[+m-1]} ${+d}, ${y}`;
}

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(isoStr.slice(0, 10));
}


/* ══════════════════════════
   SEED DATA (first run)
══════════════════════════ */
if (tasks.length === 0) {
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);

  tasks = [
    {
      id: uid(), title: 'Review project proposal',
      description: 'Go through the quarterly proposal document and add comments before the team meeting.',
      priority: 'high', category: 'work', completed: false,
      due: tomorrow.toISOString().slice(0,10),
      createdAt: new Date(now - 36e5).toISOString(), updatedAt: new Date(now - 36e5).toISOString(),
    },
    {
      id: uid(), title: 'Morning workout routine',
      description: '30 min cardio + core exercises.',
      priority: 'medium', category: 'health', completed: true,
      due: now.toISOString().slice(0,10),
      createdAt: new Date(now - 7.2e6).toISOString(), updatedAt: new Date(now - 7.2e6).toISOString(),
    },
    {
      id: uid(), title: 'Read "Atomic Habits" Ch. 5–7',
      description: '',
      priority: 'low', category: 'study', completed: false,
      due: '',
      createdAt: new Date(now - 1.8e7).toISOString(), updatedAt: new Date(now - 1.8e7).toISOString(),
    },
    {
      id: uid(), title: 'Buy groceries',
      description: 'Milk, eggs, bread, vegetables, and coffee.',
      priority: 'medium', category: 'personal', completed: false,
      due: yesterday.toISOString().slice(0,10),
      createdAt: new Date(now - 9e6).toISOString(), updatedAt: new Date(now - 9e6).toISOString(),
    },
    {
      id: uid(), title: 'Push WEAL project to GitHub',
      description: 'Stage all changes, write a clean commit message, and push to the main branch.',
      priority: 'high', category: 'work', completed: false,
      due: tomorrow.toISOString().slice(0,10),
      createdAt: new Date(now - 600000).toISOString(), updatedAt: new Date(now - 600000).toISOString(),
    },
  ];
  saveTasks();
}

/* ── Kick off ── */
renderAll();
