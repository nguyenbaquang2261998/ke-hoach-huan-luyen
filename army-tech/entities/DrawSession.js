const BaseEntity = require('./BaseEntity');

/**
 * Entity DrawSession - Bảng [draw_sessions]
 * Quản lý phiên bốc thăm phân công cán bộ coi thi
 */
class DrawSession extends BaseEntity {
  static tableName = 'draw_sessions';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.plan_name = BaseEntity.cleanString(data.plan_name || data.planName);
    this.result_hash = typeof data.result_hash === 'object' 
      ? JSON.stringify(data.result_hash) 
      : (data.result_hash || data.resultHash || '');
    this.created_at = data.created_at ?? null;
    this.exam_session_id = data.exam_session_id !== undefined && data.exam_session_id !== null 
      ? BaseEntity.cleanInt(data.exam_session_id) 
      : null;
    this.exam_subject_id = data.exam_subject_id !== undefined && data.exam_subject_id !== null 
      ? BaseEntity.cleanInt(data.exam_subject_id) 
      : null;
  }
}

module.exports = DrawSession;
