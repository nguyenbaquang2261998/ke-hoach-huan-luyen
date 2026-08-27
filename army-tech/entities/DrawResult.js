const BaseEntity = require('./BaseEntity');

/**
 * Entity DrawResult - Bảng [draw_results]
 * Quản lý kết quả phân công từng phòng thi trong một phiên bốc thăm
 */
class DrawResult extends BaseEntity {
  static tableName = 'draw_results';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.session_id = BaseEntity.cleanInt(data.session_id || data.sessionId);
    this.room_id = BaseEntity.cleanInt(data.room_id || data.roomId);
    this.room_name = BaseEntity.cleanString(data.room_name || data.roomName);
    this.examiner1_id = BaseEntity.cleanInt(data.examiner1_id || data.examiner1Id);
    this.examiner1_name = BaseEntity.cleanString(data.examiner1_name || data.examiner1Name);
    this.examiner2_id = BaseEntity.cleanInt(data.examiner2_id || data.examiner2Id);
    this.examiner2_name = BaseEntity.cleanString(data.examiner2_name || data.examiner2Name);
    this.supervisor_id = BaseEntity.cleanInt(data.supervisor_id || data.supervisorId);
    this.supervisor_name = BaseEntity.cleanString(data.supervisor_name || data.supervisorName);
  }
}

module.exports = DrawResult;
