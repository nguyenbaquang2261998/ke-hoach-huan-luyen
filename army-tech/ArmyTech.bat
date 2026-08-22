@echo off
Phần mềm do ban KHHL - PĐT phát triển

set PORT=6001

start "" cmd /c "npm run dev"

start chrome http://localhost:6001

exit