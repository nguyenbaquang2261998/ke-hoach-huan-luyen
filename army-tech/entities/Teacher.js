const BaseEntity = require('./BaseEntity');

/**
 * Entity Teacher - Bảng [teachers]
 * Quản lý danh sách giảng viên / giám thị coi thi (examiner1, examiner2, supervisor)
 */
class Teacher extends BaseEntity {
  static tableName = 'teachers';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.name = BaseEntity.cleanString(data.name);
    this.role = ['examiner1', 'examiner2', 'supervisor'].includes(data.role) ? data.role : 'examiner1';
    this.unit = BaseEntity.cleanString(data.unit) || null;
    this.note = BaseEntity.cleanString(data.note) || null;
    this.is_active = BaseEntity.cleanBoolean(data.is_active, 1);
    this.created_at = data.created_at ?? null;
    this.exam_session_id = data.exam_session_id !== undefined && data.exam_session_id !== null 
      ? BaseEntity.cleanInt(data.exam_session_id) 
      : null;
  }
}

module.exports = Teacher;
