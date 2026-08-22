erDiagram

USERS ||--o{ USER_ROLES : has
ROLES ||--o{ USER_ROLES : contains

WEEKLY_CALENDAR ||--o{ WEEKLY_TASKS : contains

STUDENTS ||--o{ STUDENT_ADMISSION : has

EXAM_SESSIONS ||--o{ EXAM_ROOMS : contains

EXAM_ROOMS ||--o{ EXAM_ASSIGNMENTS : contains

AI_DOCUMENTS ||--o{ AI_DOCUMENT_CHUNKS : contains

NOTIFICATIONS ||--o{ NOTIFICATION_RECEIVERS : contains

AUDIT_LOGS }o--|| USERS : createdBy


Bảng chính
Users
Id
Username
FullName
Email
Status
Roles
Id
Name
Description
WeeklyCalendar
Id
Week
Content
Students
Id
StudentCode
FullName
ExamSession
Id
Name
StartDate
ExamRoom
Id
RoomName
ExamAssignment
Id
SessionId
RoomId
Examiner1
Examiner2
Supervisor
AiDocuments
Id
FileName
FileType
UploadedBy
AuditLogs
Id
Action
EntityName
EntityId
UserId
Timestamp

---

## MVP Node/SQLite đã triển khai

Bản triển khai hiện tại dùng SQLite để phục vụ MVP trong repo này.

Các bảng bổ sung:

WeeklyTasks
Id
Title
TaskDate
StartTime
EndTime
Content
Location
TtHv
TtPhong
Ban
PersonInCharge
DutyOfficer
Color
Status
IsActive

WeeklyScheduleMeta
Id
WeekStart
DutySummary
RoomSummary

Students
Id
StudentCode
FullName
Birthday
Rank
Unit
Phone
Email
ClassName
AdmissionDate
Status
IsActive

DailyTasks
Id
Title
Description
Assignee
DueDate
Priority
Status
Progress
IsActive

Notifications
Id
Title
Message
Channel
Priority
Status
EntityName
EntityId
IsRead

AiDocuments
Id
FileName
FileType
Scope
UploadedBy
Status

AiConversations
Id
Question
Answer
Sources

AuditLogs
Id
Username
Action
EntityName
EntityId
OldValue
NewValue
IP
Device
CreatedAt
