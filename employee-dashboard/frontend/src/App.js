import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import WorkTracking from './pages/WorkTracking';
import PersonalReports from './pages/PersonalReports';
import EmployeeLeaves from './pages/EmployeeLeaves';
import EmployeeAttendance from './pages/EmployeeAttendance';
import EmployeeProjects from './pages/EmployeeProjects';
import EmployeePayslips from './pages/EmployeePayslips';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
// Manager Pages
import TeamData from './pages/TeamData';
import LeaveApprovals from './pages/LeaveApprovals';
import TeamProductivity from './pages/TeamProductivity';
import Profile from './pages/Profile';
import Meetings from './pages/Meetings';
import Projects from './pages/Projects';
import Notifications from './pages/Notifications';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Role-based Root Component
const DashboardRoot = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const role = (user?.role || 'Employee').toLowerCase();
    
    if (role === 'admin') {
        return <AdminDashboard />;
    }
    if (role === 'manager') {
        return <ManagerDashboard />;
    }
    return <WorkTracking />;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />

                {/* Shared/Role-based Routes */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <DashboardRoot />
                    </ProtectedRoute>
                } />

                {/* Employee Specific */}
                <Route path="/reports" element={
                    <ProtectedRoute>
                        <PersonalReports />
                    </ProtectedRoute>
                } />
                <Route path="/leaves" element={
                    <ProtectedRoute>
                        <EmployeeLeaves />
                    </ProtectedRoute>
                } />
                <Route path="/attendance" element={
                    <ProtectedRoute>
                        <EmployeeAttendance />
                    </ProtectedRoute>
                } />
                <Route path="/projects" element={
                    <ProtectedRoute>
                        <EmployeeProjects />
                    </ProtectedRoute>
                } />
                <Route path="/payslips" element={
                    <ProtectedRoute>
                        <EmployeePayslips />
                    </ProtectedRoute>
                } />

                {/* Manager Specific */}
                <Route path="/leave-approvals" element={
                    <ProtectedRoute>
                        <LeaveApprovals />
                    </ProtectedRoute>
                } />
                <Route path="/team-productivity" element={
                    <ProtectedRoute>
                        <TeamProductivity />
                    </ProtectedRoute>
                } />
                <Route path="/manager-projects" element={
                    <ProtectedRoute>
                        <Projects />
                    </ProtectedRoute>
                } />

                {/* Admin Specific */}
                <Route path="/admin-users" element={<ProtectedRoute><AdminDashboard tab="employees" /></ProtectedRoute>} />
                <Route path="/admin-managers" element={<ProtectedRoute><AdminDashboard tab="managers" /></ProtectedRoute>} />
                <Route path="/admin-attendance" element={<ProtectedRoute><AdminDashboard tab="attendance" /></ProtectedRoute>} />
                <Route path="/admin-leaves" element={<ProtectedRoute><AdminDashboard tab="leaves" /></ProtectedRoute>} />
                <Route path="/admin-payroll" element={<ProtectedRoute><AdminDashboard tab="payroll" /></ProtectedRoute>} />
                <Route path="/admin-projects" element={<ProtectedRoute><AdminDashboard tab="projects" /></ProtectedRoute>} />
                
                {/* 🤝 Meetings - Shared Room */}
                <Route path="/meetings" element={
                    <ProtectedRoute>
                        <Meetings />
                    </ProtectedRoute>
                } />

                <Route path="/notifications" element={
                    <ProtectedRoute>
                        <Notifications />
                    </ProtectedRoute>
                } />

                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                } />

                {/* Catch-all to Dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
