import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Briefcase, CheckCircle, FileText, MarkAsRead } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/api';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifs = async () => {
        try {
            const res = await getNotifications();
            setNotifications(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Fetch notifs failed', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifs();
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (err) {
            console.error('Mark read failed', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
        } catch (err) {
            console.error('Mark all read failed', err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Leave': return <Calendar size={20} />;
            case 'Meeting': return <Calendar size={20} />;
            case 'Project': return <Briefcase size={20} />;
            case 'Task': return <CheckCircle size={20} />;
            case 'Payroll': return <FileText size={20} />;
            default: return <FileText size={20} />;
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
        <div className="app-container">
            <Sidebar />
            <div className="main-content">
                <Navbar />
                
                <div className="content-header d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="mb-1">Notifications Center</h2>
                        <p className="text-muted">Stay updated with your latest workplace activities</p>
                    </div>
                    <button className="btn-primary-custom d-flex align-items-center gap-2" onClick={handleMarkAllRead}>
                        Mark all as read
                    </button>
                </div>

                <div className="table-container p-4">
                    {loading ? (
                        <div className="loading-spinner"></div>
                    ) : notifications.length > 0 ? (
                        <div className="notifications-full-list">
                            {notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    className={`notification-row ${!notif.is_read ? 'unread' : ''}`}
                                    onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                                >
                                    <div className={`notification-icon-wrapper ${getColorClass(notif.type)}`}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="notification-main">
                                        <div className="notification-header-row">
                                            <span className="notif-category-badge">{notif.type}</span>
                                            <span className="notif-timestamp">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <h5 className="notif-title">{notif.title}</h5>
                                        <p className="notif-description">{notif.message}</p>
                                    </div>
                                    {!notif.is_read && <div className="unread-pulse"></div>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <Bell size={48} className="text-muted mb-3" opacity={0.3} />
                            <h4>No notifications yet</h4>
                            <p className="text-muted">You're all caught up!</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .notification-row {
                    display: flex;
                    gap: 1.5rem;
                    padding: 1.5rem;
                    border-radius: 1rem;
                    border: 1px solid var(--border-color);
                    margin-bottom: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                .notification-row:hover {
                    background: #f8fafc;
                    transform: translateX(5px);
                }
                .notification-row.unread {
                    background: rgba(99, 102, 241, 0.05);
                    border-left: 4px solid var(--primary);
                }
                .notification-header-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                }
                .notif-category-badge {
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 2px 8px;
                    background: #f1f5f9;
                    border-radius: 4px;
                    color: #64748b;
                }
                .notif-timestamp {
                    font-size: 0.8rem;
                    color: #94a3b8;
                }
                .notif-title {
                    margin: 0 0 0.25rem;
                    font-weight: 700;
                }
                .notif-description {
                    margin: 0;
                    color: var(--secondary);
                }
                .unread-pulse {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                    width: 10px;
                    height: 10px;
                    background: var(--primary);
                    border-radius: 50%;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                }
            `}</style>
        </div>
    );
};

export default Notifications;
