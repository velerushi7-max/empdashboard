import React, { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Building2,
  Clock,
  FileBarChart,
  CalendarDays,
  Users,
  CheckCircle,
  BarChart3,
  LogOut,
  Shield,
  Folder,
  DollarSign,
  Video
} from 'lucide-react';
import { logout } from '../api/api';

const Sidebar = () => {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const role = (user?.role || 'Employee').toLowerCase();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = useMemo(() => {
        if (role === 'manager') {
            return [
                { path: '/', name: 'Overview', icon: <BarChart3 /> },
                { path: '/leave-approvals', name: 'Leave Approvals', icon: <CheckCircle /> },
                { path: '/team-productivity', name: 'Team Productivity', icon: <Users /> },
                { path: '/meetings', name: 'Meetings', icon: <Video /> },
                { path: '/manager-projects', name: 'Projects', icon: <Folder /> },
            ];
        } else if (role === 'admin') {
            return [
                { path: '/', name: 'Dashboard', icon: <BarChart3 /> },
                { path: '/admin-users', name: 'Employees', icon: <Users /> },
                { path: '/admin-managers', name: 'Managers', icon: <Shield /> },
                { path: '/admin-attendance', name: 'Attendance', icon: <Clock /> },
                { path: '/admin-leaves', name: 'Leaves', icon: <CalendarDays /> },
                { path: '/admin-payroll', name: 'Payroll', icon: <DollarSign /> },
                { path: '/admin-projects', name: 'Projects', icon: <Folder /> },
            ];
        } else {
            // Employee Default
            return [
                { path: '/', name: 'Track Work', icon: <Clock /> },
                { path: '/projects', name: 'My Projects', icon: <Folder /> },
                { path: '/attendance', name: 'Attendance', icon: <CheckCircle /> },
                { path: '/reports', name: 'Reports', icon: <FileBarChart /> },
                { path: '/leaves', name: 'Leaves', icon: <CalendarDays /> },
                { path: '/payslips', name: 'My Payslips', icon: <DollarSign /> },
                { path: '/meetings', name: 'Meetings', icon: <Video /> },
            ];
        }
    }, [role]);

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <Building2 size={32} color="#6366f1" />
                <span className="sidebar-logo-text">EmpDash</span>
            </div>
            
            <nav className="sidebar-menu">
                {menuItems.map((item) => (
                    <div key={item.path} className="sidebar-item">
                        <NavLink
                            to={item.path}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </NavLink>
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
