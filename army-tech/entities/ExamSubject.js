const BaseEntity = require('./BaseEntity');

/**
 * Entity ExamSubject - Bảng [exam_subjects]
 * Quản lý môn thi và ngày thi của từng kỳ thi
 */
class ExamSubject extends BaseEntity {
  static tableName = 'exam_subjects';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.exam_session_id = BaseEntity.cleanInt(data.exam_session_id || data.examSessionId);
    this.exam_date = BaseEntity.cleanString(data.exam_date || data.examDate || data.date);
    this.subject_name = BaseEntity.cleanString(data.subject_name || data.subjectName || data.name);
    this.note = BaseEntity.cleanString(data.note) || null;
    this.is_active = BaseEntity.cleanBoolean(data.is_active, 1);
    this.created_at = data.created_at ?? null;
    this.updated_at = data.updated_at ?? null;
  }
}

module.exports = ExamSubject;
