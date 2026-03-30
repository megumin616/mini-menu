// ===================================================
// 🌿 js/menu.js - ระบบดูเมนูและตะกร้าสินค้า
// ===================================================
//
// 📌 สิ่งที่ไฟล์นี้ทำ:
// 1. ตรวจสอบ Token (ถ้าไม่มี → กลับหน้าแรก)
// 2. ดึงเมนูทั้งหมดจาก API
// 3. จัดการ Cart (เพิ่ม/ลด/ลบ รายการ)
// 4. ส่งออเดอร์ไปครัวผ่าน API

const API_BASE = 'https://cafe-in-the-garden.onrender.com';

// ===================================================
// STATE: ข้อมูลที่หน้านี้ใช้งาน
// ===================================================
let allMenus      = [];  // เมนูทั้งหมดจาก API
let allCategories = [];  // หมวดหมู่ทั้งหมด
let cart          = {};  // { menuItemId: { item, quantity } }
let currentFilter = 'all';

// ===================================================
// getToken: ดึง Token จาก localStorage
// ===================================================
function getToken() {
  return localStorage.getItem('token');
}

// ===================================================
// apiCall: ฟังก์ชัน wrapper สำหรับเรียก API
// ===================================================
// ทุกครั้งที่เรียก API หลัง login จะต้องแนบ Token ไปด้วย
// โดยใส่ใน Header: Authorization: Bearer <token>
// Backend จะอ่าน Header นี้ใน verifyToken middleware
async function apiCall(url, options = {}) {
  const token = getToken();
  const defaultHeaders = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}` // แนบ Token ทุกครั้ง
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers }
  });

  const data = await response.json();

  // ถ้า Token หมดอายุหรือไม่ถูกต้อง → กลับหน้าแรก
  if (response.status === 401) {
    localStorage.clear();
    alert('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
    window.location.href = 'index.html';
    return null;
  }

  return data;
}

// ===================================================
// loadMenus: ดึงเมนูและหมวดหมู่จาก API
// ===================================================
async function loadMenus() {
  try {
    // เรียก API 2 อัน พร้อมกัน (parallel) ด้วย Promise.all
    // เร็วกว่าเรียกทีละอัน
    const [menuRes, catRes] = await Promise.all([
      apiCall('/menus'),
      apiCall('/menus/categories')
    ]);

    if (!menuRes || !catRes) return;

    allMenus      = menuRes.data;
    allCategories = catRes.data;

    // สร้าง Category Tabs
    renderCategoryTabs();
    // แสดงเมนูทั้งหมด
    renderMenus(allMenus);
  } catch (err) {
    console.error('Load menu error:', err);
    showToast('❌ ไม่สามารถโหลดเมนูได้', 'error');
  }
}

// ===================================================
// renderCategoryTabs: สร้างปุ่มหมวดหมู่
// ===================================================
function renderCategoryTabs() {
  const tabs = document.getElementById('categoryTabs');
  // เก็บ "ทั้งหมด" tab ไว้
  const allTab = tabs.querySelector('[data-id="all"]');
  tabs.innerHTML = '';
  tabs.appendChild(allTab);

  allCategories.forEach(cat => {
    const tab = document.createElement('div');
    tab.className    = 'cat-tab';
    tab.dataset.id   = cat.id;
    tab.textContent  = `${cat.icon} ${cat.name}`;
    tab.onclick      = () => filterCategory(cat.id, tab);
    tabs.appendChild(tab);
  });
}

// ===================================================
// filterCategory: กรองเมนูตามหมวดหมู่
// ===================================================
function filterCategory(categoryId, clickedTab) {
  currentFilter = categoryId;

  // อัปเดต active tab
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  clickedTab.classList.add('active');

  // กรองเมนู
  const filtered = categoryId === 'all'
    ? allMenus
    : allMenus.filter(m => m.category_id === parseInt(categoryId));

  renderMenus(filtered);
}

// ===================================================
// renderMenus: แสดงการ์ดเมนู
// ===================================================
function renderMenus(menus) {
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = '';

  if (menus.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#aaa">
      <div style="font-size:3rem">🥗</div>
      <p>ไม่พบเมนูในหมวดนี้</p>
    </div>`;
    return;
  }

  menus.forEach(item => {
    const card = createMenuCard(item);
    grid.appendChild(card);
  });
}

// ===================================================
// createMenuCard: สร้าง HTML card สำหรับแต่ละเมนู
// ===================================================
function createMenuCard(item) {
  const div = document.createElement('div');
  div.className = 'menu-card';
  div.id        = `menu-card-${item.id}`;

  const cartQty    = cart[item.id]?.quantity || 0;
  const imgContent = item.image_url
    ? `<img src="${item.image_url}" alt="${item.name}" class="menu-img" onerror="this.parentElement.innerHTML='<div class=menu-img-placeholder>🍽️</div>'">`
    : `<div class="menu-img-placeholder">🍽️</div>`;

  div.innerHTML = `
    ${imgContent}
    <div class="menu-info">
      <p class="menu-name">${item.name}</p>
      <p class="menu-price">฿${Number(item.price).toLocaleString()}</p>
    </div>
    <button class="menu-add-btn" onclick="addToCart(${item.id}, event)">+</button>
    <div class="item-count-badge" id="badge-${item.id}" ${cartQty > 0 ? 'style="display:block"' : ''}>
      ${cartQty}
    </div>
  `;

  return div;
}

// ===================================================
// addToCart: เพิ่มรายการลงตะกร้า
// ===================================================
function addToCart(menuItemId, event) {
  event.stopPropagation(); // ป้องกัน bubble ขึ้นไปที่ card

  const item = allMenus.find(m => m.id === menuItemId);
  if (!item) return;

  // เพิ่มลง cart
  if (cart[menuItemId]) {
    cart[menuItemId].quantity++;
  } else {
    cart[menuItemId] = { item, quantity: 1 };
  }

  // Animation ปุ่ม +
  const btn = event.currentTarget;
  btn.style.transform = 'scale(1.4)';
  setTimeout(() => btn.style.transform = '', 200);

  // อัปเดต Badge บนการ์ด
  const badge = document.getElementById(`badge-${menuItemId}`);
  if (badge) {
    badge.style.display = 'block';
    badge.textContent   = cart[menuItemId].quantity;
    // bounce animation
    badge.style.transform = 'scale(1.4)';
    setTimeout(() => badge.style.transform = '', 200);
  }

  updateCartUI();
  showToast(`✅ เพิ่ม ${item.name} แล้ว`);
}

// ===================================================
// updateQty: ปรับจำนวนในตะกร้า
// ===================================================
function updateQty(menuItemId, delta) {
  if (!cart[menuItemId]) return;

  cart[menuItemId].quantity += delta;

  if (cart[menuItemId].quantity <= 0) {
    delete cart[menuItemId];
    // ซ่อน badge บนการ์ด
    const badge = document.getElementById(`badge-${menuItemId}`);
    if (badge) badge.style.display = 'none';
  } else {
    const badge = document.getElementById(`badge-${menuItemId}`);
    if (badge) badge.textContent = cart[menuItemId].quantity;
  }

  updateCartUI();
  renderCartItems();
}

// ===================================================
// updateCartUI: อัปเดตปุ่มตะกร้าลอย
// ===================================================
function updateCartUI() {
  const cartBtn   = document.getElementById('cartBtn');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');

  const { totalItems, totalPrice } = getCartSummary();

  cartCount.textContent = totalItems;
  cartTotal.textContent = `฿${totalPrice.toLocaleString()}`;

  if (totalItems > 0) {
    cartBtn.classList.remove('hidden');
  } else {
    cartBtn.classList.add('hidden');
  }
}

// ===================================================
// getCartSummary: คำนวณยอดรวมตะกร้า
// ===================================================
function getCartSummary() {
  let totalItems = 0;
  let totalPrice = 0;

  Object.values(cart).forEach(({ item, quantity }) => {
    totalItems += quantity;
    totalPrice += item.price * quantity;
  });

  return { totalItems, totalPrice };
}

// ===================================================
// openCart / closeCart: เปิด/ปิด Cart Drawer
// ===================================================
function openCart() {
  renderCartItems();
  document.getElementById('cartDrawer').classList.add('show');
  document.getElementById('overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
  document.body.style.overflow = '';
}

// ===================================================
// renderCartItems: แสดงรายการในตะกร้า
// ===================================================
function renderCartItems() {
  const container = document.getElementById('cartItems');
  const summary   = document.getElementById('cartSummary');
  const items     = Object.values(cart);

  if (items.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:#aaa;padding:2rem;font-size:0.9rem">ยังไม่มีรายการที่เลือก</p>`;
    summary.style.display = 'none';
    return;
  }

  container.innerHTML = items.map(({ item, quantity }) => `
    <div class="cart-item">
      <img src="${item.image_url || ''}"
           alt="${item.name}"
           class="cart-item-img"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%23EDE8E0%22/></svg>'"
      />
      <div style="flex:1;min-width:0">
        <p style="font-size:0.85rem;font-weight:700;color:#2C2C2C;margin-bottom:0.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</p>
        <p style="font-size:0.8rem;color:var(--terracotta);font-weight:600">฿${Number(item.price).toLocaleString()}</p>
      </div>
      <div style="display:flex;align-items:center;gap:0.4rem;flex-shrink:0">
        <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
        <span style="font-weight:700;min-width:20px;text-align:center;color:var(--forest)">${quantity}</span>
        <button class="qty-btn" onclick="updateQty(${item.id}, +1)">+</button>
      </div>
      <div style="text-align:right;min-width:60px;flex-shrink:0">
        <p style="font-size:0.85rem;font-weight:700;color:#333">฿${(item.price * quantity).toLocaleString()}</p>
      </div>
    </div>
  `).join('');

  // แสดงยอดรวม
  const { totalPrice } = getCartSummary();
  document.getElementById('totalDisplay').textContent = `฿${totalPrice.toLocaleString()}`;
  summary.style.display = 'block';
}

// ===================================================
// confirmOrder: ส่งออเดอร์ไปครัว
// ===================================================
async function confirmOrder() {
  const items = Object.values(cart);
  if (items.length === 0) {
    showToast('❌ กรุณาเลือกอาหารก่อน', 'error');
    return;
  }

  const btn = document.getElementById('confirmBtn');
  btn.disabled    = true;
  btn.textContent = '⏳ กำลังส่งออเดอร์...';

  // จัดรูปแบบข้อมูลที่จะส่งให้ Backend
  const orderItems = items.map(({ item, quantity }) => ({
    menuItemId: item.id,
    quantity:   quantity,
    notes:      ''
  }));

  try {
    // POST /api/orders
    // Backend จะอ่าน tableId จาก JWT Token (ไม่ต้องส่ง tableId แยก)
    const data = await apiCall('/orders', {
      method: 'POST',
      body:   JSON.stringify({ items: orderItems })
    });

    if (data && data.success) {
      // ล้างตะกร้า
      cart = {};
      // ล้าง badge บนการ์ด
      document.querySelectorAll('.item-count-badge').forEach(b => b.style.display = 'none');

      closeCart();
      updateCartUI();
      showToast('🍳 ส่งออเดอร์ไปครัวแล้ว!', 'success');

      // ถามว่าจะไปดูสถานะออเดอร์ไหม
      setTimeout(() => {
        if (confirm('ส่งออเดอร์สำเร็จ! ต้องการดูสถานะอาหารไหม?')) {
          window.location.href = 'order-history.html';
        }
      }, 800);
    } else {
      showToast(`❌ ${data?.message || 'เกิดข้อผิดพลาด'}`, 'error');
      btn.disabled    = false;
      btn.textContent = '🍳 ยืนยันสั่งอาหาร';
    }
  } catch (err) {
    showToast('❌ ไม่สามารถส่งออเดอร์ได้', 'error');
    btn.disabled    = false;
    btn.textContent = '🍳 ยืนยันสั่งอาหาร';
  }
}

// ===================================================
// showToast: แสดงข้อความแจ้งเตือน
// ===================================================
function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className   = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===================================================
// init: เริ่มต้นหน้า
// ===================================================
function init() {
  // ตรวจสอบ Token
  const token       = getToken();
  const tableNumber = localStorage.getItem('tableNumber');

  if (!token) {
    alert('กรุณาเข้าสู่ระบบก่อน');
    window.location.href = 'index.html';
    return;
  }

  // แสดงเลขโต๊ะ
  if (tableNumber) {
    document.getElementById('tableBadge').textContent = `โต๊ะ ${tableNumber}`;
  }

  // โหลดเมนู
  loadMenus();
}

// เริ่มต้นเมื่อหน้าโหลดเสร็จ
document.addEventListener('DOMContentLoaded', init);
