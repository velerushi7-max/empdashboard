import React, { useState, useEffect } from 'react';
import { getTeamProductivity } from '../api/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { BarChart3, Clock, Coffee, MessageSquare } from 'lucide-react';
import '../styles/dashboard.css';

const TeamProductivity = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getTeamProductivity();
                setStats(res.data);
            } catch (err) {
                console.error('Error fetching productivity', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <header className="mb-4">
                    <h1 className="mb-0">Team Productivity</h1>
                    <p className="text-secondary">Analyze work hours and activity patterns of your team.</p>
                </header>

                <div className="row g-4">
                    {stats.length > 0 ? stats.map((emp, index) => (
                        <div key={index} className="col-12 col-xl-6">
                            <div className="stat-card p-4 h-100">
                                <h3 className="mb-4 d-flex align-items-center gap-2">
                                    <div className="avatar-small">{emp.employee_name[0]}</div> {emp.employee_name}
                                </h3>
                                
                                <div className="row g-3">
                                    <div className="col-4">
                                        <div className="p-3 bg-primary bg-opacity-10 rounded-3 text-center">
                                            <div className="text-primary mb-1"><Clock size={20} /></div>
                                            <div className="fw-800 text-primary">{Math.round(emp.work_hours / 60)}h</div>
                                            <small className="text-muted">Work</small>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="p-3 bg-warning bg-opacity-10 rounded-3 text-center">
                                            <div className="text-warning mb-1"><Coffee size={20} /></div>
                                            <div className="fw-800 text-warning">{Math.round(emp.break_time / 60)}h</div>
                                            <small className="text-muted">Break</small>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="p-3 bg-info bg-opacity-10 rounded-3 text-center">
                                            <div className="text-info mb-1"><MessageSquare size={20} /></div>
                                            <div className="fw-800 text-info">{Math.round(emp.meeting_time / 60)}h</div>
                                            <small className="text-muted">Meeting</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-12 text-center py-5 text-muted">No productivity data available yet.</div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TeamProductivity;
