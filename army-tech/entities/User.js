const BaseEntity = require('./BaseEntity');

/**
 * Entity User - Bảng [users]
 * Quản lý người dùng, vai trò (admin, manager, viewer), phân quyền, chứng thực
 */
class User extends BaseEntity {
  static tableName = 'users';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.username = BaseEntity.cleanString(data.username).toLowerCase();
    this.password_hash = data.password_hash ?? null;
    this.google_sub = data.google_sub ?? null;
    this.full_name = BaseEntity.cleanString(data.full_name || data.fullName);
    this.rank = BaseEntity.cleanString(data.rank);
    this.unit = BaseEntity.cleanString(data.unit);
    this.role = ['admin', 'manager', 'viewer'].includes(data.role) ? data.role : 'viewer';
    this.email = BaseEntity.cleanString(data.email) || null;
    this.phone = BaseEntity.cleanString(data.phone) || null;
    this.avatar_url = data.avatar_url ?? null;
    this.auth_provider = data.auth_provider || 'password';
    this.permissions = typeof data.permissions === 'object' ? JSON.stringify(data.permissions) : (data.permissions || '{}');
    this.note = BaseEntity.cleanString(data.note);
    this.is_active = BaseEntity.cleanBoolean(data.is_active, 1);
    this.last_login_at = data.last_login_at ?? null;
    this.created_at = data.created_at ?? null;
    this.updated_at = data.updated_at ?? null;
  }

  get parsedPermissions() {
    try {
      return typeof this.permissions === 'string' ? JSON.parse(this.permissions) : (this.permissions || {});
    } catch {
      return {};
    }
  }
}

module.exports = User;
