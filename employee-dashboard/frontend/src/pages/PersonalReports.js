import React, { useState, useEffect } from 'react';
import { getPersonalReports } from '../api/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { FileBarChart, Clock, Coffee, MessageSquare, Briefcase, ListFilter } from 'lucide-react';
import '../styles/dashboard.css';

const PersonalReports = () => {
    const [reports, setReports] = useState({ summary: { work: 0, break: 0, meeting: 0 }, logs: [] });
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const res = await getPersonalReports();
            if (res.data && res.data.summary) {
                setReports(res.data);
            } else if (Array.isArray(res.data)) {
                // Fallback if backend returned array instead of object
                setReports({ summary: { work: 0, break: 0, meeting: 0 }, logs: res.data });
            }
        } catch (err) {
            console.error('Error fetching reports', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const formatDuration = (mins) => {
        const hours = Math.floor(mins / 60);
        const m = mins % 60;
        return `${hours}h ${m}m`;
    };

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"></div></div>;
    }

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <header className="mb-4">
                    <h1 className="mb-0 text-dark">Personal Performance Reports</h1>
                    <p className="text-secondary">Review your total work hours and activity summaries.</p>
                </header>

                {/* Summary Cards */}
                <div className="stats-grid mb-5">
                    <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
                        <div className="stat-info">
                            <span>Work Hours</span>
                            <h2>{formatDuration(reports.summary.work)}</h2>
                        </div>
                        <div className="stat-icon" style={{ background: '#e0e7ff', color: '#6366f1' }}>
                            <Briefcase size={28} />
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                        <div className="stat-info">
                            <span>Break Time</span>
                            <h2>{formatDuration(reports.summary.break)}</h2>
                        </div>
                        <div className="stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                            <Coffee size={28} />
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid #0ea5e9' }}>
                        <div className="stat-info">
                            <span>Meeting Time</span>
                            <h2>{formatDuration(reports.summary.meeting)}</h2>
                        </div>
                        <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
                            <MessageSquare size={28} />
                        </div>
                    </div>
                </div>

                {/* All Activities List */}
                <div className="table-container">
                    <div className="table-header bg-white border-0">
                        <h3 className="table-title d-flex align-items-center gap-2">
                            <Clock size={22} color="#6366f1" />
                            Activity History
                        </h3>
                    </div>
                    <table className="custom-table w-100">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Activity Type</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Duration</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.logs.length > 0 ? reports.logs.map(log => (
                                <tr key={log.id}>
                                    <td className="fw-600">{log.date}</td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            {log.activity_type === 'Work' && <Briefcase size={16} color="#6366f1" />}
                                            {log.activity_type === 'Break' && <Coffee size={16} color="#f59e0b" />}
                                            {log.activity_type === 'Meeting' && <MessageSquare size={16} color="#0ea5e9" />}
                                            {log.activity_type}
                                        </div>
                                    </td>
                                    <td>{log.start_time.split(' ')[1]}</td>
                                    <td>{log.end_time?.split(' ')[1] || '-'}</td>
                                    <td className="fw-700">{log.duration ? `${log.duration} min` : '-'}</td>
                                    <td>
                                        <span className={`badge ${log.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-5 text-muted">No activities recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default PersonalReports;
