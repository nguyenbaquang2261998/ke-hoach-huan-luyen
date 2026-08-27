const BaseEntity = require('./BaseEntity');

/**
 * Entity AiDocument - Bảng [ai_documents]
 * Quản lý văn bản, tài liệu huấn luyện cho trợ lý AI
 */
class AiDocument extends BaseEntity {
  static tableName = 'ai_documents';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.file_name = BaseEntity.cleanString(data.file_name || data.fileName);
    this.file_type = BaseEntity.cleanString(data.file_type || data.fileType) || null;
    this.scope = BaseEntity.cleanString(data.scope) || 'Công khai';
    this.uploaded_by = BaseEntity.cleanString(data.uploaded_by || data.uploadedBy) || null;
    this.status = BaseEntity.cleanString(data.status) || 'Indexed';
    this.created_at = data.created_at ?? null;
  }
}

module.exports = AiDocument;
