const express = require('express');
const router = express.Router();
const userController = require('./controllers/userController');
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const sessionController = require('./controllers/sessionController');
const leaveController = require('./controllers/leaveController');
const meetingController = require('./controllers/meetingController');
const projectController = require('./controllers/projectController');
const notificationController = require('./controllers/notificationController');
const authMiddleware = require('./middleware/authMiddleware');
const roleMiddleware = require('./middleware/roleMiddleware');
const dashboardRoutes = require('./routes/dashboardRoutes');
const bonusRoutes = require('./routes/bonusRoutes');

// 🔔 Notifications
router.get('/notifications', authMiddleware, notificationController.getNotifications);
router.put('/notifications/:id/read', authMiddleware, notificationController.markAsRead);
router.put('/notifications/read-all', authMiddleware, notificationController.markAllAsRead);

// 🔐 Auth Routes
router.post('/auth/login', authController.login);
router.post('/auth/logout', authMiddleware, authController.logout);
router.get('/auth/me', authMiddleware, authController.getMe);
router.post('/users/register', userController.register);
router.use('/dashboard', dashboardRoutes);
router.use('/bonuses', bonusRoutes);

// 🛡️ ADMIN MANAGEMENT ROUTES
const adminOnly = [authMiddleware, roleMiddleware(['admin', 'Admin'])];
const managerOrAdmin = [authMiddleware, roleMiddleware(['admin', 'Admin', 'manager', 'Manager'])];

router.get('/admin/summary', adminOnly, adminController.getSummary);
router.get('/admin/users', managerOrAdmin, adminController.getAllUsers);
router.post('/admin/users', adminOnly, adminController.createUser);
router.put('/admin/users/:id', adminOnly, adminController.updateUser);
router.put('/admin/users', adminOnly, adminController.updateUser); // Fallback for body-only
router.delete('/admin/users/:id', adminOnly, adminController.deleteUser);
router.get('/admin/salaries', adminOnly, adminController.getSalaries);
router.get('/admin/leaves', adminOnly, adminController.getAllLeaves);
router.get('/admin/attendance', adminOnly, adminController.getAllAttendance);
router.get('/admin/projects', adminOnly, adminController.getAdminProjects);
router.get('/admin/managers', managerOrAdmin, adminController.getManagers);

// 👤 User CRUD Routes
router.get('/users', managerOrAdmin, userController.getAllUsers);
router.get('/users/:id', authMiddleware, userController.getUserById);
router.put('/users/:id', adminOnly, userController.updateUser);
router.delete('/users/:id', adminOnly, userController.deleteUser);

// ⏱️ Work Sessions
router.post('/work-session/start', authMiddleware, sessionController.startSession);
router.post('/work-session/stop', authMiddleware, sessionController.stopSession);
router.get('/work-session/status', authMiddleware, sessionController.getStatus);
router.get('/work-session/logs', authMiddleware, sessionController.getRecentLogs);
router.get('/attendance/report', authMiddleware, sessionController.getReport);
router.get('/attendance/:userId', authMiddleware, sessionController.getAttendance);

// 📅 Leave Management
router.post('/leave/apply', authMiddleware, leaveController.applyLeave);
router.get('/leave/history', authMiddleware, leaveController.getEmployeeLeaves);
router.get('/leave/team', managerOrAdmin, leaveController.getManagerLeaves);
router.put('/leave/:id/status', managerOrAdmin, leaveController.updateLeaveStatus);

// 🤝 MEETINGS MANAGEMENT 
router.post('/meetings', managerOrAdmin, meetingController.createMeeting);
router.get('/meetings/manager', managerOrAdmin, meetingController.getManagerMeetings);
router.get('/meetings/employee', authMiddleware, meetingController.getEmployeeMeetings);
router.delete('/meetings/:id', managerOrAdmin, meetingController.deleteMeeting);

// 📁 PROJECTS & TASKS MANAGEMENT (Revised)
router.post('/projects', managerOrAdmin, projectController.createProject);
router.get('/projects/employee', authMiddleware, projectController.getEmployeeProjects);
router.get('/projects/manager', managerOrAdmin, projectController.getManagerProjects);
router.get('/projects/:id', managerOrAdmin, projectController.getProjectById);
router.put('/projects/:id', managerOrAdmin, projectController.updateProject);
router.delete('/projects/:id', managerOrAdmin, projectController.deleteProject);
router.get('/employee/:employeeId/projects', authMiddleware, projectController.getEmployeeProjectsById);

router.post('/tasks', managerOrAdmin, projectController.createTask);
router.get('/tasks/employee', authMiddleware, projectController.getEmployeeTasks);
router.put('/tasks/:id/status', authMiddleware, projectController.updateTaskStatus);
router.delete('/tasks/:id', managerOrAdmin, projectController.deleteTask); // assignment_id

// 💰 Payroll Routes
router.post('/admin/payroll', adminOnly, adminController.payroll.create);
router.get('/admin/payroll', adminOnly, adminController.payroll.getAll);
router.get('/manager/payroll', managerOrAdmin, adminController.payroll.getManagerPayroll);
router.put('/admin/payroll/:id', adminOnly, adminController.payroll.update);
router.delete('/admin/payroll/:id', adminOnly, adminController.payroll.delete);
router.put('/admin/payroll/:id/status', adminOnly, adminController.payroll.updateStatus);
router.get('/payroll/:employeeId', authMiddleware, adminController.payroll.getEmployeePayslips);
router.get('/employee/:employeeId/payslips', authMiddleware, adminController.payroll.getEmployeePayslips); // User requested alias

// 👤 User Aliases (Defined earlier for clarity)
// router.get('/admin/managers', ...)
router.get('/managers', authMiddleware, adminController.getManagers);
router.post('/admin/employees', adminOnly, adminController.createUser);
router.post('/admin/managers', adminOnly, adminController.createUser);

module.exports = router;
