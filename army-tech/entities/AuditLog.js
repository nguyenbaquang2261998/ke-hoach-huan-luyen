const BaseEntity = require('./BaseEntity');

/**
 * Entity AuditLog - Bảng [audit_logs]
 * Ghi vết toàn bộ hành động thay đổi dữ liệu của người dùng trên hệ thống
 */
class AuditLog extends BaseEntity {
  static tableName = 'audit_logs';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.username = BaseEntity.cleanString(data.username) || 'system';
    this.action = BaseEntity.cleanString(data.action);
    this.entity_name = BaseEntity.cleanString(data.entity_name || data.entityName);
    this.entity_id = data.entity_id !== undefined && data.entity_id !== null ? String(data.entity_id) : null;
    this.old_value = typeof data.old_value === 'object' ? JSON.stringify(data.old_value) : (data.old_value || null);
    this.new_value = typeof data.new_value === 'object' ? JSON.stringify(data.new_value) : (data.new_value || null);
    this.ip = BaseEntity.cleanString(data.ip) || null;
    this.device = BaseEntity.cleanString(data.device) || null;
    this.created_at = data.created_at ?? null;
  }
}

module.exports = AuditLog;
