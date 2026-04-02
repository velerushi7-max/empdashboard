import React, { useState, useEffect } from 'react';
import { fetchEmployees, startBreak, endBreak, fetchDashboardStats } from '../api/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Coffee, UserCheck, Play, Pause, Save, History, Timer } from 'lucide-react';
import '../styles/dashboard.css';

const BreakTracker = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeBreaks, setActiveBreaks] = useState([]); // Mocking recent activities

    const loadData = async () => {
        try {
            const empRes = await fetchEmployees();
            setEmployees(empRes.data);
        } catch (err) {
            console.error('Error fetching data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleStartBreak = async () => {
        if (!selectedEmployee) return alert('Select an employee');
        setActionLoading(true);
        try {
            await startBreak(selectedEmployee);
            alert('Break started successfully');
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error starting break');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEndBreak = async () => {
        if (!selectedEmployee) return alert('Select an employee');
        setActionLoading(true);
        try {
            const res = await endBreak(selectedEmployee);
            alert(`Break ended successfully. Duration: ${res.data.duration} mins`);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error ending break');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"></div></div>;
    }

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="mb-0">Employee Break Tracker</h1>
                        <p className="text-secondary">Capture and monitor employee recovery periods.</p>
                    </div>
                </div>

                <div className="row g-4">
                    <div className="col-12 col-xl-5">
                        <div className="table-container p-4 h-100">
                            <div className="d-flex align-items-center gap-3 mb-5">
                                <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                                    <Coffee size={24} />
                                </div>
                                <div>
                                    <h3 className="mb-0">Manual Override</h3>
                                    <p className="small text-muted mb-0">Start or stop a break for a staff member</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-600">Employee Select</label>
                                <div className="position-relative">
                                    <UserCheck size={18} className="position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                    <select 
                                        className="form-select py-3 px-5 border-0 bg-light"
                                        style={{ fontSize: '1rem', borderRadius: '1rem' }}
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                    >
                                        <option value="">Choose Staff Member</option>
                                        {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="d-flex gap-3">
                                <button 
                                    className="btn btn-warning flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-3 border-0 text-white fw-700"
                                    style={{ background: '#f59e0b', borderRadius: '1rem' }}
                                    onClick={handleStartBreak}
                                    disabled={actionLoading || !selectedEmployee}
                                >
                                    <Play size={20} />
                                    Start Break
                                </button>
                                <button 
                                    className="btn btn-dark flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-3 border-0 fw-700"
                                    style={{ borderRadius: '1rem' }}
                                    onClick={handleEndBreak}
                                    disabled={actionLoading || !selectedEmployee}
                                >
                                    <Pause size={20} />
                                    End Break
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-xl-7">
                        <div className="table-container p-4 h-100">
                             <div className="d-flex justify-content-between align-items-center mb-5">
                                 <h3 className="mb-0 d-flex align-items-center gap-2">
                                     <History size={20} color="#6366f1" />
                                     Recent Break Logs
                                 </h3>
                                 <div className="badge badge-info p-2 px-3">Visual History</div>
                             </div>

                             <div className="d-flex flex-column gap-3">
                                 {/* Mock entries as we don't have a GET breaks API that's paginated correctly in requirements, we use dashboard or just show empty */}
                                 <p className="text-center text-muted py-5 d-flex flex-column align-items-center gap-3">
                                     <Timer size={48} className="text-light" />
                                     Live break logs will appear here during session.
                                 </p>
                             </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BreakTracker;
