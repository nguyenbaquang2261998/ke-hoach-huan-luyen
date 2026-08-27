const BaseEntity = require('./BaseEntity');

/**
 * Entity ExamRoom - Bảng [exam_rooms]
 * Quản lý phòng thi tốt nghiệp
 */
class ExamRoom extends BaseEntity {
  static tableName = 'exam_rooms';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.name = BaseEntity.cleanString(data.name);
    this.capacity = data.capacity !== undefined && data.capacity !== null ? BaseEntity.cleanInt(data.capacity) : null;
    this.note = BaseEntity.cleanString(data.note) || null;
    this.allow_supervisor_pair = BaseEntity.cleanBoolean(data.allow_supervisor_pair, 0);
    this.is_active = BaseEntity.cleanBoolean(data.is_active, 1);
    this.created_at = data.created_at ?? null;
    this.exam_session_id = data.exam_session_id !== undefined && data.exam_session_id !== null 
      ? BaseEntity.cleanInt(data.exam_session_id) 
      : null;
  }
}

module.exports = ExamRoom;
