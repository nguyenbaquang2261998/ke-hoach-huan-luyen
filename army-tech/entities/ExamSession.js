const BaseEntity = require('./BaseEntity');

/**
 * Entity ExamSession - Bảng [exam_sessions]
 * Quản lý kỳ thi tốt nghiệp
 */
class ExamSession extends BaseEntity {
  static tableName = 'exam_sessions';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.target_name = BaseEntity.cleanString(data.target_name || data.targetName);
    this.student_count = BaseEntity.cleanInt(data.student_count || data.studentCount, 0);
    this.note = BaseEntity.cleanString(data.note);
    this.is_active = BaseEntity.cleanBoolean(data.is_active, 1);
    this.created_at = data.created_at ?? null;
    this.updated_at = data.updated_at ?? null;
  }
}

module.exports = ExamSession;
