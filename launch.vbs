Set WShell = CreateObject("WScript.Shell")

' Run npm install first
WShell.Run "cmd /c ""cd /d ""k:\assignment\temp\Smart Hostel Complaint Management System\backend"" && npm install && npm run dev"" ", 1, False

WScript.Echo "Server started! Open http://localhost:5000/login in your browser."
