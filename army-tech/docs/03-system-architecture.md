flowchart LR

User --> SSO

SSO --> WebApp

WebApp --> API

API --> SQLServer

API --> Redis

API --> FileStorage

API --> AIService

AIService --> OpenAI

AIService --> KnowledgeBase

flowchart TB

subgraph Client
Browser
Mobile
Tablet
end

subgraph Frontend
NextJS
end

subgraph Backend
WebAPI
AuthService
NotificationService
AIService
end

subgraph Data
SQLServer
Redis
MinIO
end

Client --> Frontend
Frontend --> Backend
Backend --> Data