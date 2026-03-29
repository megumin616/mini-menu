# 🌿 Cafe' In The Garden — Smart E-Menu System

> **Self-Ordering Web Application | Full-Stack: Node.js + Express + MySQL + Vanilla JS**

---

## 📌 ER Diagram (อธิบายความสัมพันธ์ Database)

```
┌──────────────┐       ┌────────────────────┐       ┌──────────────┐
│   categories │ 1   M │    menu_items       │       │    users     │
│──────────────│───────│────────────────────│       │──────────────│
│ id (PK)      │       │ id (PK)            │       │ id (PK)      │
│ name         │       │ category_id (FK) ──┘       │ username     │
│ icon         │       │ name               │       │ password     │
│ sort_order   │       │ description        │       │ full_name    │
└──────────────┘       │ price              │       │ role         │
                       │ image_url          │       │ is_active    │
                       │ is_available       │       └──────────────┘
                       └──────────┬─────────┘
                                  │ M (ถูกสั่งหลายครั้ง)
                                  │
┌──────────────┐       ┌──────────▼─────────┐       ┌──────────────┐
│    tables    │ 1   M │      orders        │ 1   M │ order_items  │
│──────────────│───────│────────────────────│───────│──────────────│
│ id (PK)      │       │ id (PK)            │       │ id (PK)      │
│ table_number │       │ table_id (FK) ─────┘       │ order_id(FK) │
│ status       │       │ status             │       │menu_item_id  │
│ capacity     │       │ total_amount       │       │ quantity     │
└──────────────┘       │ payment_method     │       │ price ← snap │
                       │ created_at         │       │ item_name ←  │
                       └────────────────────┘       │ status       │
                                                    │ notes        │
                                                    └──────────────┘
```

### ความสัมพันธ์หลัก (Relationships):
| ความสัมพันธ์ | ประเภท | อธิบาย |
|---|---|---|
| categories → menu_items | One-to-Many | 1 หมวดหมู่ มีได้หลายเมนู |
| tables → orders | One-to-Many | 1 โต๊ะ มีได้หลายบิล (ตลอดเวลา) |
| orders → order_items | One-to-Many | 1 บิล มีได้หลายรายการอาหาร |
| menu_items → order_items | One-to-Many | 1 เมนู ถูกสั่งได้หลายครั้ง |

---

## 🗂️ Project Structure

```
cafe-in-the-garden/
├── database/
│   └── schema.sql              ← SQL สร้าง Database + Seed Data
│
├── backend/
│   ├── app.js                  ← Entry point, Express setup
│   ├── .env.example            ← Template ตัวแปร environment
│   ├── package.json
│   ├── config/
│   │   └── db.js               ← MySQL connection pool
│   ├── middlewares/
│   │   └── auth.js             ← verifyToken, checkRole, checkTableOwnership
│   ├── routes/
│   │   ├── authRoutes.js       ← POST /api/auth/*
│   │   ├── menuRoutes.js       ← GET /api/menus/*
│   │   └── orderRoutes.js      ← GET/POST/PATCH /api/orders/*
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── menuController.js
│   │   └── orderController.js
│   └── services/
│       ├── authService.js      ← Business logic: login, JWT
│       ├── menuService.js      ← Business logic: ดึงเมนู
│       └── orderService.js     ← Business logic: สั่งอาหาร, อัปเดตสถานะ
│
└── frontend/
    ├── index.html              ← หน้ากรอกเลขโต๊ะ (ลูกค้า)
    ├── menu.html               ← หน้าสั่งอาหาร + Cart
    ├── order-history.html      ← หน้าดูสถานะ + เรียกเก็บเงิน
    ├── staff-login.html        ← หน้า Login พนักงาน
    ├── kitchen.html            ← KDS: ครัวดูออเดอร์
    ├── cashier.html            ← แคชเชียร์: จัดการบิล
    └── js/
        ├── table-login.js
        ├── menu.js
        └── order-history.js
```

---

## 🔌 API Endpoints

### Authentication
| Method | URL | Role | คำอธิบาย |
|--------|-----|------|----------|
| POST | `/api/auth/table-login` | Public | ลูกค้ากรอกเลขโต๊ะ |
| POST | `/api/auth/staff-login` | Public | พนักงาน Login |
| GET  | `/api/auth/verify` | Any | ตรวจสอบ Token |

### Menus (ต้องมี Token)
| Method | URL | Role | คำอธิบาย |
|--------|-----|------|----------|
| GET | `/api/menus` | Any | ดูเมนูทั้งหมด |
| GET | `/api/menus/categories` | Any | ดูหมวดหมู่ |
| GET | `/api/menus/category/:id` | Any | ดูเมนูตาม Category |

### Orders
| Method | URL | Role | คำอธิบาย |
|--------|-----|------|----------|
| POST  | `/api/orders` | TABLE | สั่งอาหาร |
| GET   | `/api/orders/my-order` | TABLE | ดูออเดอร์ตัวเอง |
| POST  | `/api/orders/request-bill` | TABLE | เรียกเก็บเงิน |
| GET   | `/api/orders/kitchen` | STAFF | ดูออเดอร์ทั้งหมด (ครัว) |
| PATCH | `/api/orders/items/:id/status` | STAFF | อัปเดตสถานะอาหาร |
| GET   | `/api/orders/tables-overview` | STAFF | ภาพรวมทุกโต๊ะ |
| GET   | `/api/orders/bill/:tableId` | STAFF | ดูบิลของโต๊ะ |
| POST  | `/api/orders/close-table/:tableId` | STAFF | เคลียร์โต๊ะ |

---

## 🚀 วิธีติดตั้งและรันโปรเจค

### 1. ติดตั้ง MySQL และสร้าง Database
```bash
# เข้า MySQL
mysql -u root -p

# รันไฟล์ SQL
source /path/to/cafe-in-the-garden/database/schema.sql
```

### 2. ติดตั้ง Backend Dependencies
```bash
cd backend
npm install
```

### 3. ตั้งค่า Environment Variables
```bash
# คัดลอกและแก้ไขค่า
cp .env.example .env

# แก้ไข .env:
# DB_PASSWORD=รหัสผ่าน MySQL ของคุณ
```

### 4. รัน Server
```bash
# Development mode (auto-restart เมื่อแก้โค้ด)
npm run dev

# Production mode
npm start
```

### 5. เปิด Frontend
```
เปิด Browser ไปที่: http://localhost:3000
```

---

## 🔐 ข้อมูล Demo Login

### พนักงาน (ทุก account ใช้รหัสผ่านเดียวกัน)
| Username | Password | Role |
|----------|----------|------|
| admin    | staff1234 | ADMIN |
| staff1   | staff1234 | STAFF |
| staff2   | staff1234 | STAFF |

### ลูกค้า
- กรอกเลขโต๊ะ 1-10 ที่หน้าแรก

---

## 📌 Flow การทำงานทั้งระบบ

```
[ลูกค้า]                    [Backend]                  [Database]
   │                            │                          │
   │── กรอกเลขโต๊ะ 5 ─────────►│                          │
   │                            │── ค้นหาโต๊ะ 5 ──────────►│
   │                            │◄─ พบโต๊ะ ────────────────│
   │                            │── สร้าง JWT Token         │
   │                            │── UPDATE table OCCUPIED──►│
   │◄─ รับ JWT Token ───────────│                          │
   │                            │                          │
   │── เรียก GET /api/menus ───►│ (แนบ Token)              │
   │                            │── ดึงเมนูทั้งหมด ─────────►│
   │◄─ รับรายการเมนู ───────────│◄─ ข้อมูลเมนู ─────────────│
   │                            │                          │
   │── เลือกอาหาร, กด Confirm   │                          │
   │── POST /api/orders ───────►│ (แนบ Token)              │
   │                            │── อ่าน tableId จาก Token │
   │                            │── สร้าง order ────────────►│
   │                            │── บันทึก order_items ─────►│
   │◄─ ออเดอร์สำเร็จ ───────────│                          │
   │                            │                          │
[ครัว]                          │                          │
   │── GET /api/orders/kitchen ►│ (แนบ staffToken)         │
   │◄─ รายการออเดอร์ทั้งหมด ──►│◄─ JOIN orders+items ──────│
   │── PATCH .../items/:id ────►│                          │
   │                            │── UPDATE order_items ─────►│
   │◄─ สถานะอัปเดต ─────────────│                          │
```

---

## 💡 คำอธิบายสำคัญสำหรับการ Present

### 1. JWT ทำงานอย่างไรในระบบนี้?
- **โต๊ะ (TABLE):** Token มี `{ role:'TABLE', tableId:5, tableNumber:5 }`
- **พนักงาน (STAFF):** Token มี `{ userId:1, username:'admin', role:'STAFF' }`
- Backend อ่าน Token แล้วรู้ทันทีว่า "ใครส่ง request นี้มา"

### 2. ทำไม Snapshot ราคาใน order_items?
- ถ้าร้านเปลี่ยนราคา `menu_items.price` → บิลเก่าไม่ควรเปลี่ยนตาม
- จึงบันทึก price และ item_name ณ เวลาที่สั่งไว้ใน order_items

### 3. Database Transaction คืออะไร?
- การทำหลาย SQL query ให้นับเป็นหนึ่งชุด
- ถ้า query ใดล้มเหลว → `ROLLBACK` ยกเลิกทั้งหมด
- ป้องกันข้อมูลเสียหายกลางคัน

### 4. Connection Pool คืออะไร?
- Pool = กลุ่ม Connection ที่เตรียมไว้พร้อมใช้
- แทนที่จะสร้าง Connection ใหม่ทุก Request (ช้า)
- ใช้ Connection จาก Pool → คืนกลับเมื่อเสร็จ (เร็วกว่ามาก)
