-- ===================================================
-- 🌿 Cafe' In The Garden - Database Schema
-- ===================================================
-- ออกแบบโดยใช้หลัก Relational Database
-- ความสัมพันธ์หลัก: One-to-Many ระหว่าง orders → order_items

CREATE DATABASE IF NOT EXISTS cafe_garden CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cafe_garden;

-- =============================================
-- ตาราง users: เก็บข้อมูลพนักงานร้าน
-- password จะถูก hash ด้วย bcrypt ก่อนบันทึก
-- =============================================
CREATE TABLE users (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,                          -- bcrypt hashed
  full_name   VARCHAR(100) NOT NULL,
  role        ENUM('STAFF','ADMIN') NOT NULL DEFAULT 'STAFF',
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username)
);

-- =============================================
-- ตาราง categories: หมวดหมู่อาหาร
-- เช่น อาหารคาว, เครื่องดื่ม, ของหวาน
-- =============================================
CREATE TABLE categories (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  icon        VARCHAR(50)  DEFAULT '🍽️',
  sort_order  INT          DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ตาราง menu_items: รายการอาหารแต่ละรายการ
-- Relation: categories(1) → menu_items(Many)
-- =============================================
CREATE TABLE menu_items (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  category_id  INT            NOT NULL,
  name         VARCHAR(150)   NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2)  NOT NULL,
  image_url    VARCHAR(255)   DEFAULT NULL,
  is_available BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category  (category_id),
  INDEX idx_available (is_available)
);

-- =============================================
-- ตาราง tables: ข้อมูลโต๊ะในร้าน
-- status: AVAILABLE=ว่าง, OCCUPIED=มีลูกค้า, BILL_REQUESTED=เรียกเก็บเงิน
-- =============================================
CREATE TABLE tables (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  table_number  INT  NOT NULL UNIQUE,
  status        ENUM('AVAILABLE','OCCUPIED','BILL_REQUESTED') NOT NULL DEFAULT 'AVAILABLE',
  capacity      INT  DEFAULT 4,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
);

-- =============================================
-- ตาราง orders: บิลหลักของแต่ละโต๊ะ
-- Relation: tables(1) → orders(Many) [ตลอดเวลา]
-- แต่ในช่วงเวลาหนึ่ง โต๊ะจะมี order ACTIVE เพียง 1 ใบ
-- =============================================
CREATE TABLE orders (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  table_id        INT  NOT NULL,
  status          ENUM('ACTIVE','BILL_REQUESTED','PAID','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  total_amount    DECIMAL(10,2)  DEFAULT 0.00,
  payment_method  ENUM('CASHIER','PROMPTPAY')  NULL,
  note            TEXT           NULL,
  created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES tables(id),
  INDEX idx_table  (table_id),
  INDEX idx_status (status)
);

-- =============================================
-- ตาราง order_items: รายการอาหารย่อยในแต่ละบิล
-- Relation: orders(1) → order_items(Many) ← ความสัมพันธ์หลักของระบบ
-- บันทึก price และ item_name ณ เวลาที่สั่ง (ป้องกันราคาเปลี่ยน)
-- status: PENDING=รอ, COOKING=กำลังทำ, SERVED=เสิร์ฟแล้ว
-- =============================================
CREATE TABLE order_items (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  order_id      INT            NOT NULL,
  menu_item_id  INT            NOT NULL,
  quantity      INT            NOT NULL DEFAULT 1,
  price         DECIMAL(10,2)  NOT NULL,      -- snapshot ราคา ณ เวลาสั่ง
  item_name     VARCHAR(150)   NOT NULL,      -- snapshot ชื่อ ณ เวลาสั่ง
  status        ENUM('PENDING','COOKING','SERVED') NOT NULL DEFAULT 'PENDING',
  notes         TEXT           NULL,
  created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)     REFERENCES orders(id)     ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
  INDEX idx_order  (order_id),
  INDEX idx_status (status)
);

-- =============================================
-- SEED DATA: ข้อมูลเริ่มต้น
-- =============================================

-- พนักงาน: password = "staff1234" (hashed ด้วย bcrypt rounds=10)
INSERT INTO users (username, password, full_name, role) VALUES
('admin',  '$2b$10$3euPcmQFCiblsZeEu5s7p.SQjHfMPyZiGnFkBi5jHoRSMPisTk5yy', 'Admin Garden',  'ADMIN'),
('staff1', '$2b$10$3euPcmQFCiblsZeEu5s7p.SQjHfMPyZiGnFkBi5jHoRSMPisTk5yy', 'สมชาย ดีใจ',    'STAFF'),
('staff2', '$2b$10$3euPcmQFCiblsZeEu5s7p.SQjHfMPyZiGnFkBi5jHoRSMPisTk5yy', 'สมหญิง รักงาน', 'STAFF');
-- ⚠️ รหัสผ่านจริงคือ "staff1234" สำหรับทุก account
-- ในโปรเจคจริง ควรเปลี่ยนรหัสผ่านทันที

-- หมวดหมู่อาหาร
INSERT INTO categories (name, icon, sort_order) VALUES
('อาหารคาว',   '🍽️', 1),
('พาสต้า & ริซอตโต', '🍝', 2),
('เบเกอรี่ & ของหวาน', '🧁', 3),
('เครื่องดื่มร้อน',  '☕', 4),
('เครื่องดื่มเย็น',  '🥤', 5);

-- รายการอาหาร
INSERT INTO menu_items (category_id, name, description, price, image_url) VALUES
-- อาหารคาว
(1, 'สเต็กเนื้อ Wagyu', 'เนื้อ Wagyu เกรด A3 ย่างระดับ Medium Rare เสิร์ฟพร้อมผัก ซอส Mushroom', 580.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'),
(1, 'ไก่อบสมุนไพร', 'ไก่ออร์แกนิคอบกับสมุนไพรสด โรสแมรี่ ไทม์ กระเทียม เสิร์ฟพร้อมมันฝรั่งบด', 320.00, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400'),
(1, 'แซลมอนย่าง', 'แซลมอนนอร์เวย์ย่างกับเนย เสิร์ฟพร้อมสลัดผักสด และซอสดิลล์', 420.00, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400'),
(1, 'สลัดผักสวน', 'ผักสดออร์แกนิคจากสวน น้ำสลัด Balsamic Vinaigrette ทาร์ตสด', 180.00, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400'),

-- พาสต้า
(2, 'พาสต้าคาร์โบนาร่า', 'พาสต้า Spaghetti สูตรต้นตำรับอิตาเลียน ไข่แดง กวนชีโซ พริกไทย', 280.00, 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400'),
(2, 'ทรัฟเฟิลริซอตโต', 'ริซอตโตข้าว Arborio ปรุงด้วยน้ำซุปไก่ เนย พาร์เมซาน และทรัฟเฟิลน้ำมัน', 350.00, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400'),
(2, 'พาสต้าซีฟู้ด', 'ลิ้งกวีนี่ กุ้ง หอยแมลงภู่ ปลาหมึก ในซอสไวน์ขาว กระเทียม', 320.00, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400'),

-- เบเกอรี่
(3, 'เค้กช็อกโกแลต Lava', 'เค้กช็อกช็อกอุ่น ตัดแล้วไหลออก เสิร์ฟพร้อมไอศกรีมวานิลลา', 180.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400'),
(3, 'ครัวซองต์เนย', 'ครัวซองต์ฝรั่งเศสแท้ เนยสด อบใหม่ทุกวัน', 120.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400'),
(3, 'Tiramisu', 'ทีรามิสุต้นตำรับ มาสคาโปเน่ เอสเปรสโซ ผงโกโก้', 160.00, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400'),

-- เครื่องดื่มร้อน
(4, 'Espresso', 'เอสเปรสโซดับเบิ้ล เมล็ดกาแฟ Arabica Single Origin', 80.00, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400'),
(4, 'Cappuccino', 'กาแฟ Espresso ผสมนมร้อน ฟองนม ปรับความเข้มข้นได้', 120.00, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400'),
(4, 'Matcha Latte', 'ชาเขียว Matcha เกรด A จากญี่ปุ่น ผสมนมสด ฟองนม', 140.00, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400'),
(4, 'Chamomile Tea', 'ชาคาโมมายล์ดอกไม้แห้ง ผ่อนคลาย หอมนุ่ม', 90.00, 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400'),

-- เครื่องดื่มเย็น
(5, 'Iced Caramel Latte', 'ลาเต้เย็น ซอสคาราเมล นมสด น้ำแข็งใส', 150.00, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'),
(5, 'Strawberry Smoothie', 'สตรอว์เบอร์รี่สดปั่น โยเกิร์ต นม ไม่มีน้ำตาลเพิ่ม', 160.00, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400'),
(5, 'Mojito (Virgin)', 'โมฮิโตไม่มีแอลกอฮอล์ มิ้นต์สด มะนาว โซดา น้ำตาลกรวด', 130.00, 'https://images.unsplash.com/photo-1587596096575-3fcbe5da6b44?w=400'),
(5, 'น้ำมะพร้าวสด', 'มะพร้าวน้ำหอมสดๆ จากสวน ดื่มจากกะลา', 80.00, 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400');

-- โต๊ะในร้าน 10 โต๊ะ
INSERT INTO tables (table_number, capacity) VALUES
(1, 2), (2, 2), (3, 4), (4, 4), (5, 4),
(6, 6), (7, 6), (8, 8), (9, 8), (10, 10);
