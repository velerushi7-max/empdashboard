import React, { useState, useEffect, useRef } from 'react';
import * as api from '../api/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
  Play, 
  Pause, 
  Square, 
  Coffee, 
  MessageSquare, 
  Clock, 
  Calendar, 
  History,
  AlertCircle,
  User,
  Video
} from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';
import '../styles/dashboard.css';

const WorkTracking = () => {
    const [status, setStatus] = useState({ work: null, break: null, meeting: null });
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [logs, setLogs] = useState([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef(null);

    const fetchData = async () => {
        try {
            const [sRes, lRes, mRes] = await Promise.all([
                api.getStatus(),
                api.getRecentLogs(),
                api.getEmployeeMeetings()
            ]);
            setStatus(sRes.data);
            setLogs(lRes.data);
            setUpcomingMeetings(mRes.data.filter(m => new Date(`${m.meeting_date}T${m.start_time}`) > new Date()));

            // Handle server-synced elapsed time for Work
            if (sRes.data.work?.status === 'Ongoing') {
                const start = new Date(sRes.data.work.start_time);
                const currentElapsed = (sRes.data.work.duration || 0) + differenceInSeconds(new Date(), start);
                setElapsedTime(currentElapsed);
            } else if (sRes.data.work?.status === 'Paused') {
                setElapsedTime(sRes.data.work.duration || 0);
            } else {
                setElapsedTime(0);
            }
        } catch (err) {
            console.error('Error fetching data', err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, []);

    // Live Timer Engine
    useEffect(() => {
        if (status.work?.status === 'Ongoing') {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [status.work?.status]);

    const handleWorkAction = async (action) => {
        try {
            if (action === 'start') await api.startWork();
            if (action === 'pause') await api.pauseWork();
            if (action === 'resume') await api.resumeWork();
            if (action === 'stop') await api.stopWork();
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating work session');
        }
    };

    const handleBreakToggle = async () => {
        try {
            if (status.break) {
                await api.stopBreak();
            } else {
                // If work is running, auto-stop or pause? 
                // Suggestion: pause work if it's running when break starts
                if (status.work?.status === 'Ongoing') {
                    await api.pauseWork();
                }
                await api.startBreak();
            }
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating break session');
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getCurrentRoleStatus = () => {
        if (status.meeting) return 'Meeting';
        if (status.break) return 'On Break';
        if (status.work?.status === 'Ongoing') return 'Working';
        if (status.work?.status === 'Paused') return 'Work Paused';
        return 'Idle';
    };

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <header className="mb-4 d-flex justify-content-between align-items-end">
                    <div>
                        <h1 className="mb-0">Daily Activity Tracker</h1>
                        <p className="text-secondary">Manage your productivity in real-time.</p>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <span className={`status-indicator ${getCurrentRoleStatus().toLowerCase().replace(' ', '-')}`}>
                           ● {getCurrentRoleStatus()}
                        </span>
                    </div>
                </header>

                <div className="row g-4 mb-5">
                    {/* Work Timer Card */}
                    <div className="col-md-4">
                        <div className={`activity-card work ${status.work?.status === 'Ongoing' ? 'active' : ''}`}>
                            <div className="activity-icon"><Clock /></div>
                            <h3>Work Session</h3>
                            <div className="timer-display">{formatTime(elapsedTime)}</div>
                            
                            <div className="activity-actions mt-3">
                                {!status.work ? (
                                    <button className="btn btn-primary w-100" onClick={() => handleWorkAction('start')}>
                                        <Play size={18} /> Start Work
                                    </button>
                                ) : (
                                    <div className="d-flex gap-2">
                                        {status.work.status === 'Ongoing' ? (
                                            <button className="btn btn-warning flex-grow-1" onClick={() => handleWorkAction('pause')}>
                                                <Pause size={18} /> Pause
                                            </button>
                                        ) : (
                                            <button className="btn btn-success flex-grow-1" onClick={() => handleWorkAction('resume')}>
                                                <Play size={18} /> Resume
                                            </button>
                                        )}
                                        <button className="btn btn-danger" onClick={() => handleWorkAction('stop')}>
                                            <Square size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Break Timer Card */}
                    <div className="col-md-4">
                        <div className={`activity-card break ${status.break ? 'active' : ''}`}>
                            <div className="activity-icon"><Coffee /></div>
                            <h3>Break Time</h3>
                            <div className="timer-display text-warning">
                                {status.break ? 'ON BREAK' : 'READY'}
                            </div>
                            <div className="activity-actions mt-3">
                                <button 
                                    className={`btn w-100 ${status.break ? 'btn-danger' : 'btn-outline-warning'}`} 
                                    onClick={handleBreakToggle}
                                >
                                    {status.break ? 'End Break' : 'Start Break'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Meeting Card */}
                    <div className="col-md-4">
                        <div className={`activity-card meeting ${status.meeting ? 'active pulse' : ''}`}>
                            <div className="activity-icon"><Video /></div>
                            <h3>Next Meeting</h3>
                            <div className="meeting-info-box h-100 d-flex flex-column justify-content-center">
                                {upcomingMeetings.length > 0 ? (
                                    <>
                                        <div className="fw-bold text-dark mb-1">{upcomingMeetings[0].title}</div>
                                        <div className="small text-primary fw-600 mb-1">
                                            <Calendar size={12} className="me-1" />
                                            {upcomingMeetings[0].meeting_date}
                                        </div>
                                        <div className="small text-secondary mb-2">
                                            <Clock size={12} className="me-1" />
                                            {upcomingMeetings[0].start_time} - {upcomingMeetings[0].end_time}
                                        </div>
                                        <div className="small text-muted border-top pt-2 mt-auto">
                                            <User size={12} className="me-1" />
                                            Hosted by: <span className="fw-bold">{upcomingMeetings[0].manager_name}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-muted small py-3">No upcoming meetings scheduled.</div>
                                )}
                            </div>
                            <div className="mt-3">
                                <button className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2" onClick={() => window.location.href = '/meetings'}>
                                    <Video size={16} /> View All Meetings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-8">
                        <div className="stat-card p-4">
                            <h4 className="mb-4 d-flex align-items-center gap-2"><History size={20} /> Recent Logs</h4>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Activity</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        {log.type === 'Work' && <Clock size={16} className="text-primary" />}
                                                        {log.type === 'Break' && <Coffee size={16} className="text-warning" />}
                                                        {log.type === 'Meeting' && <MessageSquare size={16} className="text-info" />}
                                                        <strong>{log.type}</strong>
                                                    </div>
                                                </td>
                                                <td>{log.date}</td>
                                                <td>
                                                    <span className={`badge ${log.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td>{log.duration ? formatTime(log.duration) : '--'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-lg-4">
                        <div className="stat-card p-4 bg-primary text-white highlight-card">
                            <h4 className="mb-3">Weekly Goal</h4>
                            <p className="small mb-4 opacity-75">You have completed 32 hours this week. 8 hours left for your target!</p>
                            <div className="progress-custom bg-white bg-opacity-25 rounded-pill overflow-hidden" style={{ height: '8px' }}>
                                <div className="progress-bar bg-white" style={{ width: '80%', height: '100%' }}></div>
                            </div>
                            <div className="mt-4 d-flex justify-content-between">
                                <span className="fw-bold">80% Efficient</span>
                                <span className="opacity-75">Target: 40h</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WorkTracking;
