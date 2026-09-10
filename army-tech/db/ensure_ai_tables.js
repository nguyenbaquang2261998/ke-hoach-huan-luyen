const db = require('./sqlserver');

async function ensureSharedAiTables() {
  try {
    // 1. Tạo bảng shared_ai_assistants nếu chưa tồn tại
    await db.exec(`
      IF OBJECT_ID('dbo.shared_ai_assistants', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.shared_ai_assistants (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          url NVARCHAR(1000) NOT NULL,
          description NVARCHAR(MAX) NULL,
          category NVARCHAR(100) DEFAULT N'Chung',
          icon_type NVARCHAR(50) DEFAULT 'bot',
          badge NVARCHAR(100) NULL,
          color NVARCHAR(50) DEFAULT '#166534',
          access_scope NVARCHAR(100) DEFAULT N'Dùng chung',
          created_by NVARCHAR(255) NULL,
          order_index INT DEFAULT 0,
          is_active INT DEFAULT 1,
          created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
          updated_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120)
        );
      END
    `);

    // 2. Kiểm tra nếu bảng chưa có dữ liệu thì nạp dữ liệu khởi tạo
    const check = await db.get('SELECT COUNT(*) AS total FROM dbo.shared_ai_assistants');
    if (!check || check.total === 0) {
      console.log('🤖 Đang khởi tạo danh mục Trợ lý AI dùng chung mặc định...');
      const defaultTools = [
        {
          name: 'ChatGPT (OpenAI)',
          url: 'https://chatgpt.com',
          description: 'Mô hình AI tổng hợp hỗ trợ soạn thảo văn bản, tổng hợp tài liệu, dịch thuật và lập luận chuyên sâu.',
          category: 'Văn bản & Báo cáo',
          icon_type: 'bot',
          badge: 'Phổ biến',
          color: '#10a37f',
          order_index: 1
        },
        {
          name: 'Google Gemini',
          url: 'https://gemini.google.com',
          description: 'Trợ lý AI đa phương thức từ Google, tra cứu thông tin thời gian thực, tóm tắt tài liệu và phân tích dữ liệu.',
          category: 'Tra cứu & Nghiên cứu',
          icon_type: 'sparkles',
          badge: 'Đa phương thức',
          color: '#1a73e8',
          order_index: 2
        },
        {
          name: 'Claude (Anthropic)',
          url: 'https://claude.ai',
          description: 'AI chuyên sâu về đọc hiểu văn bản dung lượng lớn, viết báo cáo nghiên cứu và lập luận học thuật logic cao.',
          category: 'Văn bản & Báo cáo',
          icon_type: 'brain',
          badge: 'Phân tích mạnh',
          color: '#d97706',
          order_index: 3
        },
        {
          name: 'Microsoft Copilot',
          url: 'https://copilot.microsoft.com',
          description: 'Trợ lý hỗ trợ công tác văn phòng, soạn bài thuyết trình, phân tích bảng tính và tổng hợp thông tin.',
          category: 'Văn bản & Báo cáo',
          icon_type: 'bot',
          badge: 'Office 365',
          color: '#0078d4',
          order_index: 4
        },
        {
          name: 'DeepSeek',
          url: 'https://chat.deepseek.com',
          description: 'Mô hình AI mã nguồn mở thông minh về tư duy toán học, thuật toán và giải quyết bài toán kỹ thuật.',
          category: 'Lập trình & Kỹ thuật',
          icon_type: 'code',
          badge: 'Kỹ thuật',
          color: '#4f46e5',
          order_index: 5
        },
        {
          name: 'Perplexity AI',
          url: 'https://www.perplexity.ai',
          description: 'Công cụ tìm kiếm thông minh tổng hợp kiến thức kèm nguồn trích dẫn học thuật xác thực và chuẩn xác.',
          category: 'Tra cứu & Nghiên cứu',
          icon_type: 'search',
          badge: 'Trích dẫn nguồn',
          color: '#0d9488',
          order_index: 6
        },
        {
          name: 'Canva Magic Studio',
          url: 'https://www.canva.com',
          description: 'Công cụ thiết kế đồ họa, infographic, slide bài giảng trực quan và hình ảnh báo cáo thông minh.',
          category: 'Đồ họa & Thiết kế',
          icon_type: 'image',
          badge: 'Thiết kế',
          color: '#7c3aed',
          order_index: 7
        },
        {
          name: 'Học viện GPT (Quy chế & Đào tạo)',
          url: '#internal-docs',
          description: 'Trợ lý thông minh hỏi đáp quy chế đào tạo, lịch công tác, tiếp nhận học viên và tài liệu nội bộ Học viện.',
          category: 'Tra cứu & Nghiên cứu',
          icon_type: 'book',
          badge: 'Nội bộ',
          color: '#166534',
          order_index: 8
        }
      ];

      for (const item of defaultTools) {
        await db.run(`
          INSERT INTO dbo.shared_ai_assistants (name, url, description, category, icon_type, badge, color, order_index, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.name,
          item.url,
          item.description,
          item.category,
          item.icon_type,
          item.badge,
          item.color,
          item.order_index,
          'Hệ thống'
        ]);
      }
      console.log('✅ Đã nạp thành công 8 Trợ lý AI dùng chung mặc định.');
    }
  } catch (error) {
    console.error('⚠️ Lỗi khi kiểm tra/khởi tạo bảng shared_ai_assistants:', error.message);
  }
}

module.exports = {
  ensureSharedAiTables
};
