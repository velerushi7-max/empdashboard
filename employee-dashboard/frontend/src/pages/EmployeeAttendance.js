import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Calendar, Clock, BarChart, FileText } from 'lucide-react';
import { format } from 'date-fns';

const EmployeeAttendance = () => {
    const [data, setData] = useState({ summary: {}, history: [] });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/activities/attendance', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error('Error fetching attendance', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const renderSummary = () => (
        <div className="stats-grid mb-5">
            <div className="stat-card">
                <div className="stat-info">
                    <span>Days Present ({data.summary.month})</span>
                    <h2>{data.summary.days_present || 0}</h2>
                </div>
                <div className="stat-icon bg-primary-light text-primary"><Calendar /></div>
            </div>
            <div className="stat-card text-start">
                <div className="stat-info">
                    <span>Total Monthly Hours</span>
                    <h2>{data.summary.total_hours || 0}h</h2>
                </div>
                <div className="stat-icon bg-success-light text-success"><Clock /></div>
            </div>
            <div className="stat-card text-start">
                <div className="stat-info">
                    <span>Avg. Daily Hours</span>
                    <h2>{data.summary.avg_hours || 0}h</h2>
                </div>
                <div className="stat-icon bg-info-light text-info"><BarChart /></div>
            </div>
        </div>
    );

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <header className="mb-4">
                    <h1 className="mb-1">Attendance History</h1>
                    <p className="text-secondary">Track your daily logins and monthly consistency.</p>
                </header>

                {renderSummary()}

                <div className="table-container">
                    <div className="table-header">
                        <h3 className="table-title">Daily Activity Log</h3>
                    </div>
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Total Hours</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.history.map((h, i) => (
                                    <tr key={i}>
                                        <td className="fw-bold">{h.date}</td>
                                        <td>{h.check_in ? format(new Date(h.check_in), 'hh:mm a') : '--'}</td>
                                        <td>{h.check_out && h.check_out !== 'null' ? format(new Date(h.check_out), 'hh:mm a') : '--'}</td>
                                        <td>{h.total_hours}h</td>
                                        <td>
                                            {h.leave_status ? (
                                                <span className="badge badge-info">On Leave</span>
                                            ) : h.check_in ? (
                                                <span className="badge badge-success">Present</span>
                                            ) : (
                                                <span className="badge badge-secondary">Absent</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EmployeeAttendance;
