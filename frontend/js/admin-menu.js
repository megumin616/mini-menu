// ===================================================
// 🌿 js/admin-menu.js - CRUD categories + menu_items (ADMIN)
// ===================================================

const API_BASE = 'https://cafe-in-the-garden.onrender.com/api';

let categories = [];
let menus = [];
let activeTab = 'categories';

function getToken() {
  return localStorage.getItem('staffToken');
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 2800);
}

/** ข้อความเดียว = เหตุผล (ไทย) | สอง argument = หัวข้อ สั้น ๆ + เหตุผล */
function showErrorDialog(message, title) {
  const head = (title && String(title).trim()) || 'กระทำไม่สำเร็จ';
  const body = (message && String(message).trim()) || (typeof humanizeApiError === 'function'
    ? humanizeApiError(null, 'generic')
    : 'กรุณาลองอีกครั้ง');
  const root = document.getElementById('errorDialog');
  if (!root) {
    showToast(body, 'error');
    return;
  }
  document.getElementById('errorDialogTitle').textContent = head;
  document.getElementById('errorDialogMsg').textContent = body;
  root.classList.add('is-open');
  root.setAttribute('aria-hidden', 'false');
  setTimeout(() => {
    const btn = document.getElementById('errorDialogOk');
    if (btn) btn.focus();
  }, 50);
}

function closeErrorDialog() {
  const root = document.getElementById('errorDialog');
  if (!root) return;
  root.classList.remove('is-open');
  root.setAttribute('aria-hidden', 'true');
}

function userFacingMessage(data, contextKey) {
  if (typeof humanizeApiError !== 'function') {
    return (data && data.message) ? String(data.message) : 'กรุณาลองอีกครั้ง';
  }
  const k = (data && data._network) ? 'network' : (contextKey || 'generic');
  return humanizeApiError(data && data.message, k);
}

function logout() {
  localStorage.removeItem('staffToken');
  localStorage.removeItem('staffName');
  localStorage.removeItem('staffRole');
  window.location.href = 'staff-login.html';
}

function goBack() {
  // ถ้ามาจาก cashier/kitchen จะย้อนกลับได้
  if (document.referrer) {
    history.back();
    return;
  }
  window.location.href = 'cashier.html';
}

async function apiCall(path, options = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
  } catch {
    return {
      res: null,
      data: { success: false, message: null, _network: true }
    };
  }

  if (res.status === 401) {
    logout();
    return null;
  }

  const text = await res.text();
  let data;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: false, message: null };
    }
  } else {
    data = res.ok
      ? { success: true, message: '' }
      : { success: false, message: res.statusText || null };
  }
  if (data && !('success' in data) && !res.ok) {
    data = { success: false, message: (data && data.message) || null };
  }
  return { res, data };
}

async function ensureAdmin() {
  const token = getToken();
  if (!token) {
    window.location.href = 'staff-login.html';
    return false;
  }
  const out = await apiCall('/auth/verify', { method: 'GET' });
  if (!out || !out.data || !out.data.success) {
    window.location.href = 'staff-login.html';
    return false;
  }
  const role = out.data.data?.role;
  const name = out.data.data?.fullName || localStorage.getItem('staffName') || '-';
  document.getElementById('whoami').textContent = `เข้าสู่ระบบ: ${name} (${role})`;
  document.getElementById('apiHint').textContent = API_BASE;

  if (role !== 'ADMIN') {
    showToast('คุณไม่มีสิทธิ์เข้าถึงหน้านี้', 'error');
    window.location.href = 'cashier.html';
    return false;
  }
  return true;
}

function setTab(tab) {
  activeTab = tab;
  document.getElementById('tabCategories').classList.toggle('active', tab === 'categories');
  document.getElementById('tabMenus').classList.toggle('active', tab === 'menus');

  document.getElementById('formCategories').style.display = tab === 'categories' ? 'block' : 'none';
  document.getElementById('listCategories').style.display = tab === 'categories' ? 'block' : 'none';

  document.getElementById('formMenus').style.display = tab === 'menus' ? 'block' : 'none';
  document.getElementById('listMenus').style.display = tab === 'menus' ? 'block' : 'none';
}

function resetCategoryForm() {
  document.getElementById('catId').value = '';
  document.getElementById('catName').value = '';
  document.getElementById('catIcon').value = '';
  document.getElementById('catSort').value = '';
}

function resetMenuForm() {
  document.getElementById('menuId').value = '';
  document.getElementById('menuCategory').value = '';
  document.getElementById('menuName').value = '';
  document.getElementById('menuDesc').value = '';
  document.getElementById('menuPrice').value = '';
  document.getElementById('menuImg').value = '';
  document.getElementById('menuAvail').value = 'true';
}

function fillCategorySelects() {
  const menuCategory = document.getElementById('menuCategory');
  const filterCategory = document.getElementById('filterCategory');

  const options = categories
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(c => `<option value="${c.id}">${c.icon || '🍽️'} ${c.name}</option>`)
    .join('');

  menuCategory.innerHTML = options || '<option value="">-</option>';

  filterCategory.innerHTML =
    `<option value="all">ทุกหมวดหมู่</option>` + options;
}

async function loadCategories() {
  const out = await apiCall('/menus/categories', { method: 'GET' });
  if (!out) return;
  if (!out.data.success) {
    showToast(userFacingMessage(out.data, 'load'), 'error');
    return;
  }
  categories = out.data.data || [];
  renderCategories();
  fillCategorySelects();
}

function renderCategories() {
  const body = document.getElementById('catTableBody');
  document.getElementById('catCount').textContent = `${categories.length} รายการ`;

  body.innerHTML = categories
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(c => `
      <tr>
        <td data-label="Icon" style="font-size:1.1rem">${c.icon || '🍽️'}</td>
        <td data-label="Name" style="font-weight:800;color:#2C2C2C">${escapeHtml(c.name)}</td>
        <td data-label="Sort">${c.sort_order ?? 0}</td>
        <td data-label="">
          <div class="actions">
            <button class="btn btn-ghost" onclick="editCategory(${c.id})">แก้ไข</button>
            <button class="btn btn-danger" onclick="deleteCategory(${c.id})">ลบ</button>
          </div>
        </td>
      </tr>
    `)
    .join('');
}

function editCategory(id) {
  const c = categories.find(x => x.id === id);
  if (!c) return;
  setTab('categories');
  document.getElementById('catId').value = String(c.id);
  document.getElementById('catName').value = c.name || '';
  document.getElementById('catIcon').value = c.icon || '';
  document.getElementById('catSort').value = c.sort_order ?? 0;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveCategory() {
  const id = document.getElementById('catId').value.trim();
  const name = document.getElementById('catName').value.trim();
  const icon = document.getElementById('catIcon').value.trim();
  const sortOrder = document.getElementById('catSort').value;

  const btn = document.getElementById('catSaveBtn');
  btn.disabled = true;
  btn.textContent = '⏳ กำลังบันทึก...';

  const payload = { name, icon, sortOrder };
  const out = id
    ? await apiCall(`/menus/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) })
    : await apiCall('/menus/categories', { method: 'POST', body: JSON.stringify(payload) });

  btn.disabled = false;
  btn.textContent = 'บันทึกหมวดหมู่';

  if (!out) return;
  if (!out.data.success) {
    showErrorDialog(userFacingMessage(out.data, 'saveCategory'));
    return;
  }
  showToast('✅ บันทึกหมวดหมู่แล้ว');
  resetCategoryForm();
  await loadCategories();
  await loadMenus(); // เผื่อชื่อหมวดหมู่เปลี่ยน
}

async function deleteCategory(id) {
  const c = categories.find(x => x.id === id);
  const name = c?.name || '';
  if (!confirm(`ลบหมวดหมู่ "${name}"?\nเมนูในหมวดหมู่นี้จะถูกลบตาม (ON DELETE CASCADE)`)) return;

  const out = await apiCall(`/menus/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!out) return;
  if (!out.data.success) {
    showErrorDialog(userFacingMessage(out.data, 'deleteCategory'));
    return;
  }
  showToast('✅ ลบหมวดหมู่แล้ว');
  resetCategoryForm();
  await loadCategories();
  await loadMenus();
}

async function loadMenus() {
  const out = await apiCall('/menus', { method: 'GET' });
  if (!out) return;
  if (!out.data.success) {
    showToast(userFacingMessage(out.data, 'load'), 'error');
    return;
  }
  menus = out.data.data || [];
  renderMenus();
}

function renderMenus() {
  const body = document.getElementById('menuTableBody');
  const filter = document.getElementById('filterCategory').value || 'all';
  const q = (document.getElementById('searchMenu').value || '').trim().toLowerCase();

  const filtered = menus.filter(m => {
    const okCat = filter === 'all' ? true : String(m.category_id) === String(filter);
    const okQ = !q
      ? true
      : `${m.name || ''} ${m.category_name || ''}`.toLowerCase().includes(q);
    return okCat && okQ;
  });

  document.getElementById('menuCount').textContent = `${filtered.length} รายการ`;

  body.innerHTML = filtered
    .slice()
    .sort((a, b) => {
      const ao = a.category_sort_order ?? 0;
      const bo = b.category_sort_order ?? 0;
      if (ao !== bo) return ao - bo;
      return String(a.name || '').localeCompare(String(b.name || ''), 'th');
    })
    .map(m => `
      <tr>
        <td data-label="Menu">
          <div style="display:flex;align-items:center;gap:.6rem">
            <img src="${m.image_url || ''}" alt="" style="width:44px;height:44px;border-radius:10px;object-fit:cover;border:1px solid var(--beige)"
                 onerror="this.style.display='none'"/>
            <div style="min-width:0">
              <div style="font-weight:900;color:#2C2C2C;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(m.name)}</div>
              <div class="muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:420px">${escapeHtml(m.description || '')}</div>
            </div>
          </div>
        </td>
        <td data-label="Category">${escapeHtml(m.category_icon || '🍽️')} ${escapeHtml(m.category_name || '')}</td>
        <td data-label="Price" style="font-weight:900;color:var(--terracotta)">฿${Number(m.price || 0).toLocaleString()}</td>
        <td data-label="Status">
          ${m.is_available ? `<span class="chip chip-on">🟢 เปิดขาย</span>` : `<span class="chip chip-off">⚪ ปิดขาย</span>`}
        </td>
        <td data-label="">
          <div class="actions">
            <button class="btn btn-ghost" onclick="editMenu(${m.id})">แก้ไข</button>
            <button class="btn btn-danger" onclick="deleteMenu(${m.id})">ลบ</button>
          </div>
        </td>
      </tr>
    `)
    .join('');
}

function editMenu(id) {
  const m = menus.find(x => x.id === id);
  if (!m) return;
  setTab('menus');
  document.getElementById('menuId').value = String(m.id);
  document.getElementById('menuCategory').value = String(m.category_id);
  document.getElementById('menuName').value = m.name || '';
  document.getElementById('menuDesc').value = m.description || '';
  document.getElementById('menuPrice').value = m.price ?? '';
  document.getElementById('menuImg').value = m.image_url || '';
  document.getElementById('menuAvail').value = m.is_available ? 'true' : 'false';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveMenu() {
  const id = document.getElementById('menuId').value.trim();
  const categoryId = document.getElementById('menuCategory').value;
  const name = document.getElementById('menuName').value.trim();
  const description = document.getElementById('menuDesc').value.trim();
  const price = document.getElementById('menuPrice').value;
  const imageUrl = document.getElementById('menuImg').value.trim();
  const isAvailable = document.getElementById('menuAvail').value; // 'true'/'false'

  const btn = document.getElementById('menuSaveBtn');
  btn.disabled = true;
  btn.textContent = '⏳ กำลังบันทึก...';

  const payload = {
    categoryId,
    name,
    description: description === '' ? null : description,
    price,
    imageUrl: imageUrl === '' ? null : imageUrl,
    isAvailable
  };

  const out = id
    ? await apiCall(`/menus/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) })
    : await apiCall('/menus', { method: 'POST', body: JSON.stringify(payload) });

  btn.disabled = false;
  btn.textContent = 'บันทึกเมนู';

  if (!out) return;
  if (!out.data.success) {
    showErrorDialog(userFacingMessage(out.data, 'saveMenu'));
    return;
  }
  showToast('✅ บันทึกเมนูแล้ว');
  resetMenuForm();
  await loadMenus();
}

async function deleteMenu(id) {
  const m = menus.find(x => x.id === id);
  const name = m?.name || '';
  if (!confirm(`ลบเมนู "${name}"?`)) return;

  const out = await apiCall(`/menus/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!out) return;
  if (!out.data.success) {
    showErrorDialog(userFacingMessage(out.data, 'deleteMenu'));
    return;
  }
  showToast('✅ ลบเมนูแล้ว');
  resetMenuForm();
  await loadMenus();
}

async function refreshAll() {
  await loadCategories();
  await loadMenus();
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

document.addEventListener('DOMContentLoaded', async () => {
  const okBtn = document.getElementById('errorDialogOk');
  const back = document.getElementById('errorDialogBackdrop');
  if (okBtn) okBtn.addEventListener('click', closeErrorDialog);
  if (back) back.addEventListener('click', closeErrorDialog);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('errorDialog')?.classList.contains('is-open')) {
      closeErrorDialog();
    }
  });

  const ok = await ensureAdmin();
  if (!ok) return;

  // เตรียม select เปล่าไว้ก่อน
  document.getElementById('menuCategory').innerHTML = '<option value="">กำลังโหลด...</option>';
  document.getElementById('filterCategory').innerHTML = '<option value="all">ทุกหมวดหมู่</option>';

  await refreshAll();
  setTab('categories');
});

