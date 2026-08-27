const BaseEntity = require('./BaseEntity');

/**
 * Entity DailyTask - Bảng [daily_tasks]
 * Quản lý các đầu việc hàng ngày (nhắc việc cá nhân, ban, tiến độ hoàn thành)
 */
class DailyTask extends BaseEntity {
  static tableName = 'daily_tasks';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.title = BaseEntity.cleanString(data.title);
    this.description = BaseEntity.cleanString(data.description) || null;
    this.assignee = BaseEntity.cleanString(data.assignee) || null;
    this.due_date = BaseEntity.cleanString(data.due_date || data.dueDate) || null;
    this.priority = ['Low', 'Normal', 'High', 'Critical'].includes(data.priority) ? data.priority : 'Normal';
    this.status = ['New', 'InProgress', 'Pending', 'Completed', 'Overdue', 'Cancelled'].includes(data.status) 
      ? data.status 
      : 'New';
    this.progress = BaseEntity.cleanInt(data.progress, 0);
    this.color = BaseEntity.cleanString(data.color) || '#15803d';
    this.is_active = BaseEntity.cleanBoolean(data.is_active, 1);
    this.created_at = data.created_at ?? null;
    this.updated_at = data.updated_at ?? null;
  }
}

module.exports = DailyTask;
