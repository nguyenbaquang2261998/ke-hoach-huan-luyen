/**
 * Lớp cơ sở BaseEntity
 * Cung cấp các phương thức dùng chung cho việc mapping, serialize và validate entity
 */
class BaseEntity {
  constructor(data = {}) {
    this.assign(data);
  }

  /**
   * Gán giá trị các thuộc tính từ object
   * @param {Object} data 
   */
  assign(data = {}) {
    if (!data || typeof data !== 'object') return;
    Object.keys(data).forEach(key => {
      this[key] = data[key];
    });
  }

  /**
   * Chuyển đổi entity thành plain JSON object
   * @returns {Object}
   */
  toJSON() {
    const copy = {};
    for (const key of Object.keys(this)) {
      if (!key.startsWith('_')) {
        copy[key] = this[key];
      }
    }
    return copy;
  }

  /**
   * Chuẩn hóa chuỗi văn bản (cắt khoảng trắng)
   * @param {any} value 
   * @returns {string}
   */
  static cleanString(value) {
    return String(value ?? '').trim();
  }

  /**
   * Chuẩn hóa số nguyên
   * @param {any} value 
   * @param {number} fallback 
   * @returns {number}
   */
  static cleanInt(value, fallback = 0) {
    const num = parseInt(value, 10);
    return Number.isFinite(num) ? num : fallback;
  }

  /**
   * Chuẩn hóa boolean thành số nguyên 0 hoặc 1 (dùng cho SQL Server BIT / INT)
   * @param {any} value 
   * @param {number} fallback 
   * @returns {number}
   */
  static cleanBoolean(value, fallback = 1) {
    if (value === undefined || value === null) return fallback;
    return (value === 1 || value === true || value === '1' || value === 'true') ? 1 : 0;
  }
}

module.exports = BaseEntity;
