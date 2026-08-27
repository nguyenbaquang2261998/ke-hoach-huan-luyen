const BaseEntity = require('./BaseEntity');

/**
 * Entity ExamDocument - Bảng [exam_documents]
 * Quản lý văn bản, tài liệu đính kèm của kỳ thi (kế hoạch, quyết định)
 */
class ExamDocument extends BaseEntity {
  static tableName = 'exam_documents';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.exam_session_id = BaseEntity.cleanInt(data.exam_session_id || data.examSessionId);
    this.document_type = ['plan', 'decision'].includes(data.document_type || data.documentType) 
      ? (data.document_type || data.documentType) 
      : 'plan';
    this.original_name = BaseEntity.cleanString(data.original_name || data.originalName);
    this.stored_name = BaseEntity.cleanString(data.stored_name || data.storedName);
    this.file_type = BaseEntity.cleanString(data.file_type || data.fileType) || null;
    this.size = BaseEntity.cleanInt(data.size, 0);
    this.relative_path = BaseEntity.cleanString(data.relative_path || data.relativePath);
    this.is_active = BaseEntity.cleanBoolean(data.is_active, 1);
    this.created_at = data.created_at ?? null;
  }
}

module.exports = ExamDocument;
