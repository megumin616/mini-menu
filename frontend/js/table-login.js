// ===================================================
// 🌿 js/table-login.js - ระบบกรอกเลขโต๊ะ
// ===================================================
//
// 📌 Flow ของหน้านี้:
// 1. ลูกค้าเลือก/กรอกเลขโต๊ะ
// 2. กด "เข้าสู่ระบบ" → เรียก API POST /api/auth/table-login
// 3. Backend ตรวจสอบโต๊ะ → สร้าง JWT Token
// 4. Frontend รับ Token → เก็บใน localStorage
// 5. Redirect ไปหน้า menu.html

const API_BASE = 'http://localhost:3000';

// ===================================================
// สร้างปุ่มเลขโต๊ะ 1-10
// ===================================================
function initTableGrid() {
  const grid = document.getElementById('tableGrid');
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'table-btn';
    btn.textContent = i;
    btn.onclick = () => {
      // ไฮไลต์ปุ่มที่เลือก
      document.querySelectorAll('.table-btn').forEach(b => b.style.background = '');
      btn.style.background = 'var(--forest)';
      btn.style.color = 'white';
      // ใส่ค่าลงใน input
      document.getElementById('tableInput').value = i;
    };
    grid.appendChild(btn);
  }
}

// ===================================================
// handleTableLogin: เรียก API เพื่อล็อกอินด้วยเลขโต๊ะ
// ===================================================
async function handleTableLogin() {
  const tableNumber = document.getElementById('tableInput').value.trim();

  if (!tableNumber || parseInt(tableNumber) < 1) {
    showToast('❌ กรุณากรอกหมายเลขโต๊ะ', 'error');
    return;
  }

  // แสดง Loading state
  setLoading(true);

  try {
    // ===================================================
    // Fetch API: วิธีที่ Browser ใช้เรียก Backend
    // ===================================================
    // fetch() คืนค่าเป็น Promise
    //   → .then() ทำงานเมื่อสำเร็จ
    //   → .catch() ทำงานเมื่อ error (network down, etc.)
    //
    // ใช้ async/await แทน .then() เพื่ออ่านง่ายขึ้น
    const response = await fetch(`${API_BASE}/auth/table-login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' }, // บอก server ว่าส่ง JSON
      body:    JSON.stringify({ tableNumber: parseInt(tableNumber) }) // แปลง JS Object → JSON string
    });

    // response.json() แปลง JSON string จาก server → JS Object
    const data = await response.json();

    if (data.success) {
      // ✅ บันทึก Token ลง localStorage
      // localStorage เก็บข้อมูลถาวรแม้ปิด browser
      // แต่ถูก clear เมื่อ clear browser data
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('tableId', data.data.table.id);
      localStorage.setItem('tableNumber', data.data.table.tableNumber);

      showToast(`✅ ${data.message}`, 'success');

      // รอ 1 วินาที แล้ว redirect ไปหน้าเมนู
      setTimeout(() => {
        window.location.href = 'menu.html';
      }, 1000);
    } else {
      showToast(`❌ ${data.message}`, 'error');
      setLoading(false);
    }
  } catch (err) {
    // Network error: Server ปิดอยู่ หรือ URL ผิด
    console.error('API Error:', err);
    showToast('❌ ไม่สามารถเชื่อมต่อ Server ได้', 'error');
    setLoading(false);
  }
}

// ===================================================
// ฟังก์ชันช่วย
// ===================================================
function setLoading(isLoading) {
  const btn     = document.querySelector('.btn-primary');
  const btnText = document.getElementById('btnText');
  const spinner = document.getElementById('spinner');

  btn.disabled         = isLoading;
  btnText.style.display = isLoading ? 'none' : 'block';
  spinner.style.display = isLoading ? 'block' : 'none';
}

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className   = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===================================================
// ตรวจสอบว่า Login แล้วหรือยัง (มี Token ใน localStorage)
// ===================================================
function checkExistingToken() {
  const token       = localStorage.getItem('token');
  const tableNumber = localStorage.getItem('tableNumber');

  if (token && tableNumber) {
    // มี Token แล้ว ถามว่าจะไปต่อหรือล้างออก
    const goToMenu = confirm(
      `คุณกำลังนั่งอยู่ที่โต๊ะ ${tableNumber} อยู่แล้ว\nต้องการไปที่เมนูหรือไม่?`
    );
    if (goToMenu) {
      window.location.href = 'menu.html';
    } else {
      // ล้าง Token เก่าออก
      localStorage.clear();
    }
  }
}

// ===================================================
// กด Enter เพื่อ submit
// ===================================================
document.addEventListener('DOMContentLoaded', () => {
  initTableGrid();
  checkExistingToken();

  document.getElementById('tableInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleTableLogin();
  });
});
