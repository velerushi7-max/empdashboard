import React, { useState, useRef, useEffect } from 'react';
import { User, Bell, Search, Settings, LogOut, ChevronDown, Calendar, Briefcase, CheckCircle, FileText, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { logout, getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/api';
import { formatDistanceToNow } from 'date-fns';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const Navbar = () => {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const storedUser = localStorage.getItem('user');
    let user = { id: 0, name: 'User', username: 'User', role: 'Employee' };
    
    if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            user = { ...user, ...parsed };
            if (user.name && !user.username) user.username = user.name;
            if (user.username && !user.name) user.name = user.username;
        } catch (e) {
            console.error('Error parsing user from localStorage', e);
        }
    }
    
    const displayName = user.name || user.username || 'User';
    const initial = displayName[0]?.toUpperCase() || 'U';

    const fetchNotifs = async () => {
        try {
            const res = await getNotifications();
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.is_read).length);
        } catch (err) {
            console.error('Fetch notifs failed', err);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchNotifs();

        // 🔌 Socket.io Real-time Setup
        const socket = io(SOCKET_URL);
        
        socket.on('connect', () => {
            console.log('Connected to server via Socket.io');
        });

        // Specific listener for this user
        if (user.id) {
            socket.on(`notification_${user.id}`, (newNotif) => {
                console.log('New notification received:', newNotif);
                
                // Add to list and bump count
                setNotifications(prev => [newNotif, ...prev].slice(0, 50));
                setUnreadCount(prev => prev + 1);

                // Browser notification if supported and window not focused
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification(newNotif.title, { body: newNotif.message });
                }
            });
        }

        return () => {
            socket.disconnect();
        };
    }, [user.id]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
            // Recalculate accurately based on current notifications
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Mark read failed', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Mark all read failed', err);
        }
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'Leave': return <Calendar size={18} />;
            case 'Meeting': return <Calendar size={18} />;
            case 'Project': return <Briefcase size={18} />;
            case 'Task': return <CheckCircle size={18} />;
            case 'Payroll': return <FileText size={18} />; // CreditCard would be better but let's use what we have or FileText
            default: return <FileText size={18} />;
        }
    };

    const getColorClass = (type) => {
        switch (type) {
            case 'Leave': return 'notif-leave';
            case 'Meeting': return 'notif-meeting';
            case 'Project': return 'notif-project';
            case 'Task': return 'notif-task';
            case 'Payroll': return 'notif-payroll';
            default: return 'notif-default';
        }
    };

    return (
        <header className="top-navbar px-4">
            <div className="navbar-content">
                <div className="navbar-search position-relative d-none d-md-block me-4">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search tasks, teams..." 
                        className="form-control nav-search-input"
                    />
                </div>

                <div className="notification-bell cursor-pointer me-4" ref={notifRef} onClick={() => setIsNotifOpen(!isNotifOpen)}>
                    <Bell size={20} color="#64748b" />
                    {unreadCount > 0 && <span className="notification-indicator"></span>}
                    
                    {isNotifOpen && (
                        <div className="notifications-dropdown" onClick={(e) => e.stopPropagation()}>
                            <div className="notifications-header">
                                <h4>Notifications</h4>
                                {unreadCount > 0 && (
                                    <button className="mark-all-btn" onClick={handleMarkAllRead}>
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            
                            <div className="notifications-list">
                                {notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                                            onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                                        >
                                            <div className={`notification-icon-wrapper ${getColorClass(notif.type)}`}>
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="notification-content">
                                                <div className="notification-title">
                                                    {notif.title}
                                                    {!notif.is_read && <span className="unread-dot"></span>}
                                                </div>
                                                <div className="notification-msg">{notif.message}</div>
                                                <div className="notification-time">
                                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-5 text-center text-muted">
                                        No new notifications
                                    </div>
                                )}
                            </div>
                            
                            <div className="notification-footer">
                                <Link to="/notifications" className="text-decoration-none text-primary fw-600" onClick={() => setIsNotifOpen(false)}>
                                    View all activity
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="navbar-profile-section" ref={dropdownRef}>
                    <div 
                        className="profile-trigger d-flex align-items-center gap-2 cursor-pointer"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <div className="profile-avatar">
                            {initial}
                        </div>
                        <div className="profile-meta d-none d-sm-block">
                            <div className="profile-name">{displayName}</div>
                            <div className="profile-role">{user.role}</div>
                        </div>
                        <ChevronDown size={14} className={`dropdown-arrow ${isDropdownOpen ? 'active' : ''}`} />
                    </div>

                    {isDropdownOpen && (
                        <div className="profile-dropdown-menu">
                            <div className="dropdown-header d-sm-none">
                                <strong>{displayName}</strong>
                                <span>{user.role}</span>
                            </div>
                            <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                                <User size={16} />
                                <span>View Profile</span>
                            </Link>
                            <Link to="/profile?edit=true" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                                <Settings size={16} />
                                <span>Edit Profile</span>
                            </Link>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item text-danger border-0 bg-transparent w-100" onClick={handleLogout}>
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
