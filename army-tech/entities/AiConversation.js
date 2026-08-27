const BaseEntity = require('./BaseEntity');

/**
 * Entity AiConversation - Bảng [ai_conversations]
 * Quản lý lịch sử câu hỏi - câu trả lời và trích dẫn tài liệu với AI
 */
class AiConversation extends BaseEntity {
  static tableName = 'ai_conversations';

  constructor(data = {}) {
    super();
    this.id = data.id !== undefined ? BaseEntity.cleanInt(data.id) : undefined;
    this.question = BaseEntity.cleanString(data.question);
    this.answer = BaseEntity.cleanString(data.answer);
    this.sources = typeof data.sources === 'object' ? JSON.stringify(data.sources) : (data.sources || null);
    this.created_at = data.created_at ?? null;
  }
}

module.exports = AiConversation;
