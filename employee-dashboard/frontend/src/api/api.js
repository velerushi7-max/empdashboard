import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor for Auth Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 🔐 Auth
export const login = (data) => api.post('/auth/login', data);
export const logout = () => {
    api.post('/auth/logout').catch(console.error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};
export const getMe = () => api.get('/auth/me');

// 👤 Users
export const getUsers = () => api.get('/users');
export const fetchEmployees = getUsers; // Component compatibility
export const getTeamEmployees = getUsers; // Legacy alias
export const createUser = (data) => api.post('/users', data);
export const createEmployee = (data) => api.post('/admin/employees', data); // Explicit admin endpoint
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const updateEmployee = updateUser; // Component compatibility
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const deleteEmployee = deleteUser; // Component compatibility

// 📁 PROJECTS & TASKS MANAGEMENT (Revised)
export const createProject = (data) => api.post('/projects', data);
export const getManagerProjects = () => api.get('/projects/manager');
export const getEmployeeProjects = () => api.get('/projects/employee');
export const getProjectById = (id) => api.get(`/projects/${id}`);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

export const createTask = (data) => api.post('/tasks', data);
export const getEmployeeTasks = () => api.get('/tasks/employee');
export const updateTaskStatus = (id, status) => api.put(`/tasks/${id}/status`, { status }); // assignment_id
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// ⏱️ Work Sessions & Attendance
export const startSession = () => api.post('/work-session/start');
export const stopSession = () => api.post('/work-session/stop');
export const getSessions = (userId) => api.get(`/work-session/${userId}`);
export const getAttendance = (userId) => api.get(`/attendance/${userId || 'me'}`);
export const fetchAttendance = () => api.get('/work-session/logs'); // For dashboard recent list

// 📊 Dashboard Analytics
export const fetchDashboardStats = () => api.get('/dashboard/stats');
export const fetchLeaves = () => api.get('/leave/history'); // Alias for fetchLeaves
export const fetchBonuses = () => api.get('/bonuses');
export const createBonus = (data) => api.post('/bonuses', data);
export const updateBonus = (id, data) => api.put(`/bonuses/${id}`, data);

// 🏠 Re-add missing legacy exports for other components to avoid build crash
export const getStatus = () => api.get('/work-session/status').catch(() => ({ data: { status: 'None' } }));
export const startWork = () => api.post('/work-session/start');
export const stopWork = () => api.post('/work-session/stop');
export const pauseWork = () => api.post('/work-session/stop');
export const resumeWork = () => api.post('/work-session/start');
export const startBreak = () => api.post('/work-session/pause').catch(() => ({ data: {} }));
export const stopBreak = () => api.post('/work-session/resume').catch(() => ({ data: {} }));
export const getRecentLogs = () => api.get('/work-session/logs').catch(() => ({ data: [] }));
export const getPersonalReports = () => api.get('/attendance/report').catch(() => ({ data: [] }));

// 📅 Leave Management
export const applyLeave = (data) => api.post('/leave/apply', data);
export const getPersonalLeaves = () => api.get('/leave/history');
export const getTeamLeaves = () => api.get('/leave/team');
export const leaveAction = (id, status) => api.put(`/leave/${id}/status`, { status });

export const getTeamProductivity = () => api.get('/attendance/productivity').catch(() => ({ data: [] }));
export const getTeamAttendance = (date) => api.get('/attendance/report').catch(() => ({ data: { attendance: [], summary: { present: 0 } } }));

export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/notifications/read-all');

// 🤝 Meetings Management
export const createMeeting = (data) => api.post('/meetings', data);
export const getManagerMeetings = () => api.get('/meetings/manager');
export const getEmployeeMeetings = () => api.get('/meetings/employee');
export const deleteMeeting = (id) => api.delete(`/meetings/${id}`);

export default api;
