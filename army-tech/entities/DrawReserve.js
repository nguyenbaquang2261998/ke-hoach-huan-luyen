const BaseEntity = require('./BaseEntity');

/**
 * Entity DrawReserve - Bảng [draw_reserves]
 * Quản lý danh sách cán bộ dự bị trong một phiên bốc thăm
 */
class DrawReserve extends BaseEntity {
  static tableName = 'draw_reserves';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.session_id = BaseEntity.cleanInt(data.session_id || data.sessionId);
    this.role = ['examiner1', 'examiner2', 'supervisor'].includes(data.role) ? data.role : 'examiner1';
    this.staff_id = BaseEntity.cleanInt(data.staff_id || data.staffId);
    this.staff_name = BaseEntity.cleanString(data.staff_name || data.staffName);
  }
}

module.exports = DrawReserve;
