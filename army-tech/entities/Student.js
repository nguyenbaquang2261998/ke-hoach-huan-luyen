const BaseEntity = require('./BaseEntity');

/**
 * Entity Student - Bảng [students]
 * Quản lý thông tin học viên tiếp nhận, nhập học
 */
class Student extends BaseEntity {
  static tableName = 'students';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.student_code = BaseEntity.cleanString(data.student_code || data.studentCode);
    this.full_name = BaseEntity.cleanString(data.full_name || data.fullName);
    this.birthday = BaseEntity.cleanString(data.birthday) || null;
    this.rank = BaseEntity.cleanString(data.rank) || null;
    this.unit = BaseEntity.cleanString(data.unit) || null;
    this.phone = BaseEntity.cleanString(data.phone) || null;
    this.email = BaseEntity.cleanString(data.email) || null;
    this.class_name = BaseEntity.cleanString(data.class_name || data.className) || null;
    this.admission_date = BaseEntity.cleanString(data.admission_date || data.admissionDate) || null;
    this.status = ['Created', 'PendingReview', 'Approved', 'Rejected', 'Completed'].includes(data.status) 
      ? data.status 
      : 'Created';
    this.is_active = BaseEntity.cleanBoolean(data.is_active, 1);
    this.created_at = data.created_at ?? null;
    this.updated_at = data.updated_at ?? null;
  }
}

module.exports = Student;
