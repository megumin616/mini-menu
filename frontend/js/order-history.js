// ===================================================
// 🌿 js/order-history.js - ระบบดูสถานะออเดอร์
// ===================================================

const API_BASE = 'https://cafe-in-the-garden.onrender.com/api';
let selectedPayment = null;
let autoRefreshInterval = null;

function getToken() {
  return localStorage.getItem('token');
}

function orderErrLine(data, contextKey) {
  if (typeof humanizeApiError !== 'function') {
    return (data && data.message) || 'ลองอีกครั้ง';
  }
  const k = (data && data._network) ? 'network' : (contextKey || 'generic');
  return humanizeApiError(data && data.message, k);
}

async function apiCall(url, options = {}) {
  const token = getToken();
  let response;
  try {
    response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
  } catch {
    return { success: false, message: null, _network: true };
  }
  if (response.status === 401) {
    localStorage.clear();
    window.location.href = 'index.html';
    return null;
  }
  const text = await response.text();
  if (!text) {
    return response.ok
      ? { success: true, data: null, message: '' }
      : { success: false, message: null };
  }
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, message: null };
  }
}

// ===================================================
// loadOrder: ดึงข้อมูลออเดอร์ของโต๊ะนี้
// ===================================================
async function loadOrder() {
  const loadingState = document.getElementById('loadingState');
  const stillOnLoading = () => {
    const d = getComputedStyle(loadingState).display;
    return d && d !== 'none';
  };

  try {
    const data = await apiCall('/orders/my-order');
    if (!data) return;

    if (data.success === false) {
      const line = orderErrLine(data, 'loadOrder');
      if (!stillOnLoading()) {
        showToast(line, 'error');
        return;
      }
      document.getElementById('emptyState').style.display = 'none';
      document.getElementById('orderContent').style.display = 'none';
      loadingState.style.display = 'block';
      const safe = String(line)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
      loadingState.innerHTML =
        '<div style="text-align:center;padding:0.5rem 0.25rem 0.25rem">' +
        '<div style="font-size:1.5rem">⚠️</div>' +
        '<p style="color:#A93226;font-size:0.9rem;font-weight:700;margin:0.6rem 0 0.2rem">ดูออเดอร์ไม่ได้</p>' +
        '<p style="color:#5c6168;font-size:0.86rem;margin-bottom:1rem;white-space:pre-wrap">' + safe + '</p>' +
        '<button type="button" onclick="location.reload()" ' +
        'style="background:var(--forest);color:white;border:none;border-radius:12px;padding:0.55rem 1.1rem;cursor:pointer;font-size:0.9rem">' +
        '↻ ลองอีกครั้ง' +
        '</button></div>';
      return;
    }

    document.getElementById('loadingState').style.display = 'none';

    if (!data.data) {
      // ไม่มีออเดอร์
      document.getElementById('emptyState').style.display = 'block';
      document.getElementById('orderContent').style.display = 'none';
      return;
    }

    renderOrder(data.data);
  } catch (err) {
    console.error('Load order error:', err);
    if (!stillOnLoading()) {
      showToast(typeof humanizeApiError === 'function' ? humanizeApiError(null, 'loadOrder') : 'โหลดออเดอร์ไม่สำเร็จ', 'error');
    } else {
      const line = typeof humanizeApiError === 'function' ? humanizeApiError(null, 'loadOrder') : 'อินเทอร์เน็ตขัดข้อง ลองอีกครั้ง';
      loadingState.innerHTML =
        '<p style="color:#c0392b">' + line + '</p>';
    }
  }
}

// ===================================================
// renderOrder: แสดงข้อมูลออเดอร์
// ===================================================
function renderOrder(order) {
  document.getElementById('emptyState').style.display   = 'none';
  document.getElementById('orderContent').style.display = 'block';

  // ยอดรวม
  document.getElementById('grandTotal').textContent = `฿${Number(order.totalAmount).toLocaleString()}`;

  // สถานะบิล
  const statusMap = {
    ACTIVE:          { text: 'กำลังสั่งอาหาร', cls: 'status-PENDING' },
    BILL_REQUESTED:  { text: 'รอเก็บเงิน',     cls: 'status-COOKING' },
    PAID:            { text: 'ชำระแล้ว',        cls: 'status-SERVED' }
  };
  const s = statusMap[order.orderStatus] || statusMap.ACTIVE;
  document.getElementById('orderStatusChip').innerHTML =
    `<span class="status-chip ${s.cls}">${s.text}</span>`;

  // ปุ่มเรียกเก็บเงิน
  const billBtn         = document.getElementById('billBtn');
  const billRequestedMsg = document.getElementById('billRequestedMsg');
  if (order.orderStatus === 'BILL_REQUESTED') {
    billBtn.style.display          = 'none';
    billRequestedMsg.style.display = 'block';
  } else {
    billBtn.style.display          = 'block';
    billRequestedMsg.style.display = 'none';
  }

  // แยกรายการตามสถานะ
  const pending = order.items.filter(i => i.status === 'PENDING');
  const cooking = order.items.filter(i => i.status === 'COOKING');
  const served  = order.items.filter(i => i.status === 'SERVED');

  renderGroup('pending', pending);
  renderGroup('cooking', cooking);
  renderGroup('served',  served);
}

function renderGroup(type, items) {
  const group      = document.getElementById(`${type}Group`);
  const container  = document.getElementById(`${type}Items`);
  const countBadge = document.getElementById(`${type}Count`);

  if (items.length === 0) {
    group.style.display = 'none';
    return;
  }

  group.style.display   = 'block';
  countBadge.textContent = `${items.length} รายการ`;

  container.innerHTML = items.map(item => `
    <div class="order-item-card">
      <img src="${item.imageUrl || ''}"
           class="order-img"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%23EDE8E0%22/></svg>'"
      />
      <div style="flex:1;min-width:0">
        <p style="font-weight:700;color:#2C2C2C;font-size:0.88rem;margin-bottom:0.2rem">${item.name}</p>
        <p style="color:#888;font-size:0.78rem">จำนวน: ${item.quantity} | ฿${(item.price * item.quantity).toLocaleString()}</p>
      </div>
      <span class="status-chip status-${item.status}">
        ${statusIcon(item.status)} ${statusText(item.status)}
      </span>
    </div>
  `).join('');
}

function statusIcon(s) { return { PENDING:'⏳', COOKING:'🍳', SERVED:'✅' }[s] || ''; }
function statusText(s) { return { PENDING:'รอดำเนินการ', COOKING:'กำลังทำ', SERVED:'เสิร์ฟแล้ว' }[s] || s; }

// ===================================================
// Payment Modal
// แจ้ง backend ทันทีเมื่อกด «เรียกเก็บเงิน» (POST /orders/request-bill)
// Modal ใช้แสดงตัวเลือกชำระเงิน + ปิดเมื่ออ่านแล้วเท่านั้น
// ===================================================
async function openPaymentModal() {
  const billBtn = document.getElementById('billBtn');
  if (billBtn.style.display === 'none') return;

  billBtn.disabled    = true;
  const prevLabel     = billBtn.textContent;
  billBtn.textContent = '⏳ กำลังแจ้งพนักงาน...';

  try {
    const data = await apiCall('/orders/request-bill', {
      method: 'POST',
      body:   JSON.stringify({})
    });

    if (!data) {
      billBtn.disabled = false;
      billBtn.textContent = prevLabel;
      return;
    }

    if (!data.success) {
      showToast(orderErrLine(data, 'requestBill'), 'error');
      billBtn.disabled = false;
      billBtn.textContent = prevLabel;
      return;
    }

    showToast('🙏 แจ้งพนักงานแล้ว! รอสักครู่นะคะ');
    await loadOrder();

    const total = document.getElementById('grandTotal').textContent;
    document.getElementById('modalTotal').textContent = total;
    document.getElementById('payModalOverlay').classList.add('show');
    document.getElementById('payModal').classList.add('show');
    selectedPayment = null;
    document.querySelectorAll('.pay-option').forEach(o => o.classList.remove('selected'));
    document.getElementById('qrDisplay').classList.remove('show');

    const confirmBtn = document.getElementById('confirmPayBtn');
    confirmBtn.style.display = 'block';
    confirmBtn.disabled      = false;
    confirmBtn.textContent   = 'รับทราบ / ปิด';
  } catch (err) {
    console.error('request-bill:', err);
    showToast(typeof humanizeApiError === 'function' ? humanizeApiError(null, 'requestBill') : 'ยังส่งคำร้องไม่สำเร็จ ลองอีกครั้ง', 'error');
  }

  billBtn.disabled    = false;
  billBtn.textContent = prevLabel;
}

function closePaymentModal() {
  document.getElementById('payModalOverlay').classList.remove('show');
  document.getElementById('payModal').classList.remove('show');
}

function selectPayment(method) {
  selectedPayment = method;
  document.querySelectorAll('.pay-option').forEach(o => o.classList.remove('selected'));
  document.getElementById(`opt-${method.toLowerCase()}`).classList.add('selected');

  if (method === 'PROMPTPAY') {
    document.getElementById('qrDisplay').classList.add('show');
  } else {
    document.getElementById('qrDisplay').classList.remove('show');
  }
}

function confirmBillRequest() {
  closePaymentModal();
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function init() {
  const token       = getToken();
  const tableNumber = localStorage.getItem('tableNumber');
  if (!token) { window.location.href = 'index.html'; return; }
  if (tableNumber) document.getElementById('tableBadge').textContent = `โต๊ะ ${tableNumber}`;
  loadOrder();
  // Auto-refresh ทุก 30 วินาที
  autoRefreshInterval = setInterval(loadOrder, 30000);
}

// Clean up interval เมื่อออกจากหน้า
window.addEventListener('beforeunload', () => clearInterval(autoRefreshInterval));

document.addEventListener('DOMContentLoaded', init);
