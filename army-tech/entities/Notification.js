const BaseEntity = require('./BaseEntity');

/**
 * Entity Notification - Bảng [notifications]
 * Quản lý thông báo hệ thống gửi đến người dùng
 */
class Notification extends BaseEntity {
  static tableName = 'notifications';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.title = BaseEntity.cleanString(data.title);
    this.message = BaseEntity.cleanString(data.message) || null;
    this.channel = BaseEntity.cleanString(data.channel) || 'In App';
    this.priority = ['Low', 'Normal', 'High', 'Critical'].includes(data.priority) ? data.priority : 'Normal';
    this.status = ['Pending', 'Queued', 'Sent', 'Failed', 'Read'].includes(data.status) ? data.status : 'Pending';
    this.entity_name = BaseEntity.cleanString(data.entity_name || data.entityName) || null;
    this.entity_id = data.entity_id !== undefined && data.entity_id !== null 
      ? BaseEntity.cleanInt(data.entity_id) 
      : null;
    this.is_read = BaseEntity.cleanBoolean(data.is_read, 0);
    this.created_at = data.created_at ?? null;
    this.read_at = data.read_at ?? null;
  }
}

module.exports = Notification;
