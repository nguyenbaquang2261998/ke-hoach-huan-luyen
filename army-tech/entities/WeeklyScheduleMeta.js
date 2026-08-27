const BaseEntity = require('./BaseEntity');

/**
 * Entity WeeklyScheduleMeta - Bảng [weekly_schedule_meta]
 * Quản lý thông tin trực ban, trực chỉ huy, phòng hội trường theo tuần
 */
class WeeklyScheduleMeta extends BaseEntity {
  static tableName = 'weekly_schedule_meta';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.week_start = BaseEntity.cleanString(data.week_start || data.weekStart);
    this.duty_summary = BaseEntity.cleanString(data.duty_summary || data.dutySummary) || null;
    this.room_summary = BaseEntity.cleanString(data.room_summary || data.roomSummary) || null;
    this.created_at = data.created_at ?? null;
    this.updated_at = data.updated_at ?? null;
  }
}

module.exports = WeeklyScheduleMeta;
