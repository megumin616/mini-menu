// ===================================================
// แปลงข้อความ error จาก API ให้ผู้ใช้เห็นแต่ข้อความไทยสั้น ๆ
// ไม่แสดง SQL / รหัส / stack / คำอังกฤษทางเทคนิค
// ใช้: humanizeApiError(ข้อความจาก API, 'deleteCategory' | 'generic' | ...)
// ===================================================
(function (g) {
  const FALLBACK = {
    deleteCategory: 'ลบไม่ได้ อาจเพราะยังมีอาหารในหมวดนี้ หรือรายการบนร้านไม่ตรง ลองรีเฟรชก่อน',
    saveCategory:   'กรุณาใส่ชื่อหมวดให้ไม่ช้ำกับที่มี แล้วลองอีกครั้ง',
    deleteMenu:     'ลบไม่ได้ อาจเพราะรายการนี้ยังอ้างอิงออเดอร์ หรือรายการไม่ตรง ลองรีเฟรช',
    saveMenu:       'กรุณาเช็กราคาและหมวดหมู่ แล้วลองบันทึกอีกครั้ง',
    load:           'อินเทอร์เน็ตไม่เสถียรหรือร้านตอบกลับช้า ลองใหม่อีกที',
    loadOrder:      'ดึงออเดอร์ไม่ได้ อินเทอร์เน็ตอาจขัดข้อง กรุณาลองใหม่',
    requestBill:    'ยังส่งคำร้องเรียกเก็บเงินไม่สำเร็จ กรุณาลองอีกครั้ง',
    tableLogin:     'เลขโต๊ะอาจไม่ถูกต้อง หรือร้านเต็ม/ปิด ลองใหม่อีกที',
    staffAuth:      'ชื่อหรือรหัสผ่านอาจไม่ถูก หรือล็อกอินไม่สำเร็จ กรุณาลองใหม่',
    staffAdd:       'เพิ่มบัญชีไม่สำเร็จ อาจมีคนใช้ชื่อนี้แล้ว หรือเน็ตขัดข้อง',
    clearTable:     'รับเงิน/เคลียร์โต๊ะไม่สำเร็จ กรุณาลองอีกครั้ง',
    confirmOrder:   'ร้านอาจรับออเดอร์ไม่สำเร็จ กรุณาเลือกอาหารก่อน หรือลองใหม่',
    network:        'เชื่อมต่อร้านทางอินเทอร์เน็ตไม่ได้ ลองอีกครั้งภายหลัง',
    parse:          'ข้อมูลที่ร้านส่งกลับอ่านไม่ได้ กรุณาโหลดหน้าใหม่',
    generic:        'ร้านอาจกำลังงาน หรืออินเทอร์เน็ตขัดข้อง กรุณาลองอีกครั้ง',
    updateStatus:   'อัปเดตรายการในครัวไม่สำเร็จ กรุณาลองอีกครั้ง'
  };

  function hasThai(s) {
    return /[\u0E00-\u0E7F]/.test(s);
  }

  function looksCodeOrTechnical(s) {
    if (!s || s.length > 500) return true;
    if (/ER_[A-Z0-9_]+/i.test(s)) return true;
    if (/\s+at\s+[\S]+:\d+/.test(s) || /:\d+:\d+/.test(s) && /\bat\b/i.test(s)) return true;
    if (/\b(TypeError|SyntaxError|ReferenceError|ENOENT|ECONN\w+|\bE[A-Z]+)\b/.test(s)) return true;
    if (/\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|constraint|FOREIGN|TRIGGER|MySQL|postgres|Sequelize)\b/i.test(s)) {
      return true;
    }
    if (/\b(Internal Server|Bad Gateway|ETIMEDOUT|ENOTFOUND|socket|Network)\b/i.test(s)) return true;
    if (/\(status\s*:\s*\d+\)/i.test(s) || /HTTP\/?\d/i.test(s)) return true;
    if (/^[\d_]{3,}$/.test(s)) return true;
    if (!hasThai(s) && /[_]{2,}|[.][jt]s\b/i.test(s)) return true;
    if (/^HTTP\s+\d+$/i.test(s.trim()) || /^\d{3}\s+(OK|Error|Not Found|Bad|Internal|Forbidden|Unauthorized)\b/i.test(s)) {
      return true;
    }
    if (/^Bad Request$|^Not Found$|^Unprocessable Entity$|^Internal Server Error$/i.test(s.trim()) && s.length < 50) {
      return true;
    }
    return false;
  }

  function looksLikeRowConstraint(s) {
    return /foreign|constraint|cannot delete|row is referenced|a parent row|ER_ROW|1451|1217|Cannot delete or update/i.test(
      s
    );
  }

  /** ข้อความไทยที่มาจาก API บางอันแทรกชื่อฟิลด์ภาษาอังกฤษ — แก้ให้อ่านลื่น */
  function polishThaiBackend(s) {
    if (!s) return s;
    return String(s)
      .replace(/\bsortOrder\b/gi, 'ลำดับ')
      .replace(/ลำดับ ต้องเป็นตัวเลข/g, 'ลำดับต้องเป็นตัวเลข')
      .replace(/^(ลำดับ) ต้องเป็นตัวเลข$/g, 'กรุณาใส่ลำดับเป็นตัวเลข')
      .replace(/\bcategoryId\b/gi, 'รหัสหมวด')
      .replace(/รหัสหมวด ไม่ถูกต้อง/g, 'รหัสหมวดหมู่ไม่ถูกต้อง กรุณารีเฟรชหน้า')
      .replace(/^id ไม่ถูกต้อง$/g, 'รหัสรายการไม่ถูกต้อง กรุณารีเฟรชหน้า')
      .replace(/กรุณาระบุ รหัสหมวด ที่ถูกต้อง/g, 'กรุณาเลือกหมวดหมู่ให้ถูกต้อง')
      .replace(/กรุณาระบุรหัสหมวดที่ถูกต้อง/g, 'กรุณาเลือกหมวดหมู่ให้ถูกต้อง')
      .replace(/เมนู ID \d+ ไม่พบในระบบ/g, 'ไม่พบรายการอาหารนี้ในระบบ')
      .replace(/กรุณาเข้าสู่ระบบก่อน \(ไม่พบ Token\)/g, 'กรุณาเข้าสู่ระบบอีกครั้ง')
      .replace(/Session หมดอายุ กรุณาเข้าสู่ระบบใหม่/g, 'ล็อกอินหมดอายุ กรุณาเข้าใหม่')
      .replace(/Token ไม่ถูกต้อง/g, 'ยืนยันตัวตนไม่สำเร็จ กรุณาเข้าใหม่')
      .replace(/Username นี้ถูกใช้แล้ว/g, 'ชื่อผู้ใช้นี้ถูกใช้แล้ว')
      .replace(/\bUsername\b/gi, 'ชื่อผู้ใช้')
      .replace(/\bimageUrl\b/gi, 'รูป')
      .replace(/\bisAvailable\b/gi, 'สถานะขาย');
  }

  function humanizeApiError(raw, context) {
    const key = (context && FALLBACK[context]) ? context : 'generic';
    const base = FALLBACK[key] || FALLBACK.generic;
    if (raw == null || !String(raw).trim()) {
      return base;
    }
    const t0 = String(raw).trim();
    if (looksCodeOrTechnical(t0)) {
      if (looksLikeRowConstraint(t0)) {
        if (key === 'deleteMenu') return 'ลบเมนูนี้ไม่ได้ อาจยังอ้างอิงกับออเดอร์ หรือรายการไม่ตรงกับร้าน ลองรีเฟรช';
        if (key === 'deleteCategory') {
          return 'ลบหมวดนี้ไม่ได้เพราะยังมีอาหารหรือรายการอื่นอ้างอิงอยู่ ลบหรือย้ายอาหารออกก่อน แล้วลองใหม่';
        }
        return 'ดำเนินการไม่ได้ เนื่องจากรายการยังถูกใช้งานอยู่ หรือข้อมูลไม่ตรงกับร้าน';
      }
      if (/^Bad Request$|^Unprocessable Entity$|^Request failed$/i.test(t0)) {
        return base;
      }
      if (/^Internal Server Error$|^Service Unavailable$/i.test(t0) || /Internal Server|server error|statusCode/i.test(t0)) {
        return 'ระบบร้านยังส่งคำตอบไม่สำเร็จ กรุณาลองอีกครั้งในไม่กี่นาที';
      }
      if (/^Not Found$/i.test(t0) || t0 === '404' || t0 === '500') {
        if (key === 'deleteMenu' || key === 'deleteCategory') {
          return 'ไม่พบรายการที่ต้องลบ ลองรีเฟรชก่อน แล้วลองอีกครั้ง';
        }
        return 'ไม่พบข้อมูล หรือรายการนี้ไม่ตรงกับบนเซิร์ฟเวอร์ ลองรีเฟรช';
      }
      if (/^Unauthorized$|^Invalid token$|^Token expired$|^Access denied$/i.test(t0)) {
        return 'กรุณาเข้าสู่ระบบอีกครั้ง';
      }
      return base;
    }

    if (hasThai(t0)) {
      return polishThaiBackend(t0);
    }

    if (/^not found$/i.test(t0) || /no rows? (found|affected)/i.test(t0)) {
      if (key === 'deleteMenu' || key === 'deleteCategory') {
        return 'ไม่พบรายการนี้แล้ว อาจเพิ่งถูกลบ ลองรีเฟรช';
      }
      return 'ไม่พบรายการที่ต้องการ ลองรีเฟรช';
    }
    if (/^bad request$/i.test(t0)) {
      return base;
    }
    if (/^internal server error$/i.test(t0)) {
      return 'ระบบร้านยังส่งคำตอบไม่สำเร็จ กรุณาลองอีกครั้งในไม่กี่นาที';
    }
    if (/^forbidden$|^unauthorized$|^unauthenticated$/i.test(t0)) {
      return 'กรุณาเข้าสู่ระบบ หรือร้านไม่อนุญาตการนี้';
    }

    return base;
  }

  g.humanizeApiError = humanizeApiError;
})(typeof window !== 'undefined' ? window : globalThis);
