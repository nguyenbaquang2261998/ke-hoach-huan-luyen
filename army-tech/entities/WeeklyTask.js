const BaseEntity = require('./BaseEntity');

/**
 * Entity WeeklyTask - Bảng [weekly_tasks]
 * Quản lý các sự kiện, nhiệm vụ trong lịch tuần công tác
 */
class WeeklyTask extends BaseEntity {
  static tableName = 'weekly_tasks';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.title = BaseEntity.cleanString(data.title);
    this.task_date = BaseEntity.cleanString(data.task_date || data.taskDate || data.date);
    this.start_time = BaseEntity.cleanString(data.start_time || data.startTime) || null;
    this.end_time = BaseEntity.cleanString(data.end_time || data.endTime) || null;
    this.content = BaseEntity.cleanString(data.content) || null;
    this.location = BaseEntity.cleanString(data.location) || null;
    this.tt_hv = BaseEntity.cleanString(data.tt_hv || data.ttHv) || null;
    this.tt_phong = BaseEntity.cleanString(data.tt_phong || data.ttPhong) || null;
    this.ban = BaseEntity.cleanString(data.ban) || null;
    this.person_in_charge = BaseEntity.cleanString(data.person_in_charge || data.personInCharge) || null;
    this.duty_officer = BaseEntity.cleanString(data.duty_officer || data.dutyOfficer) || null;
    this.color = BaseEntity.cleanString(data.color) || '#166534';
    this.status = ['Draft', 'Published', 'Archived'].includes(data.status) ? data.status : 'Draft';
    this.is_active = BaseEntity.cleanBoolean(data.is_active, 1);
    this.created_at = data.created_at ?? null;
    this.updated_at = data.updated_at ?? null;
  }
}

module.exports = WeeklyTask;
