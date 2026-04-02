import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
    Briefcase, Folder, User, Calendar, CheckSquare, 
    MoreHorizontal, TrendingUp, AlertCircle, Clock
} from 'lucide-react';
import * as api from '../api/api';
import '../styles/dashboard.css';

const MyProjects = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.getEmployeeTasks();
            setTasks(res.data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusUpdate = async (assignmentId, newStatus) => {
        try {
            await api.updateTaskStatus(assignmentId, newStatus);
            fetchData();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const getStatusStyle = (status) => {
        const s = status.toLowerCase();
        if (s === 'completed') return 'bg-success text-white px-3 fw-bold';
        if (s === 'in-progress' || s === 'in progress') return 'bg-warning text-dark px-3 fw-bold';
        return 'bg-secondary text-white px-3 fw-bold';
    };

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <header className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1>💪 My Projects & Tasks</h1>
                        <p className="text-secondary">Track your responsibilities and update your progress.</p>
                    </div>
                </header>

                <div className="row g-4">
                    {loading ? (
                        <div className="col-12 text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                        </div>
                    ) : tasks.length > 0 ? (
                        tasks.map(task => (
                            <div key={task.assignment_id} className="col-12">
                                <div className="stat-card p-4 transition-all hover-translate">
                                    <div className="row align-items-center g-3">
                                        {/* Project Info */}
                                        <div className="col-md-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="icon-box bg-primary-light">
                                                    <Briefcase className="text-primary" size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="mb-0 fw-bold">{task.project_name}</h5>
                                                    <p className="text-secondary small mb-0">{task.project_description || 'Team Project'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Task Details */}
                                        <div className="col-md-5 ps-md-4 border-start">
                                            <h5 className="mb-1 text-dark d-flex align-items-center gap-2">
                                                <CheckSquare size={18} className="text-primary" /> {task.title}
                                            </h5>
                                            <p className="text-muted small mb-0">{task.description || 'Deliver the assigned outcomes.'}</p>
                                        </div>

                                        {/* Status Control */}
                                        <div className="col-md-2 text-center">
                                            <span className={`badge ${getStatusStyle(task.status)} rounded-pill`}>
                                                {task.status.toUpperCase()}
                                            </span>
                                            <div className="mt-1 small text-secondary">
                                                <Clock size={12} className="me-1" /> Assigned {new Date(task.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-md-2 text-end">
                                            <div className="btn-group w-100 shadow-sm rounded-pill overflow-hidden">
                                                <button 
                                                    className={`btn btn-sm btn-outline-warning w-50 border-0 ${task.status.toLowerCase() === 'in-progress' ? 'bg-warning-light' : ''}`}
                                                    onClick={() => handleStatusUpdate(task.assignment_id, 'in-progress')}
                                                    title="Mark as In Progress"
                                                >
                                                    Working
                                                </button>
                                                <button 
                                                    className={`btn btn-sm btn-outline-success w-50 border-0 ${task.status.toLowerCase() === 'completed' ? 'bg-success-light' : ''}`}
                                                    onClick={() => handleStatusUpdate(task.assignment_id, 'completed')}
                                                    title="Mark as Completed"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12 text-center py-5">
                            <TrendingUp size={64} className="text-light mb-3" />
                            <h3 className="text-muted">No Tasks Found</h3>
                            <p>You haven't been assigned to any projects yet. Good time to rest! ☕</p>
                        </div>
                    )}
                </div>

                <div className="mt-5 p-4 bg-light rounded-4 border-dashed text-center">
                    <p className="mb-0 text-secondary small d-flex align-items-center justify-content-center gap-2">
                        <AlertCircle size={16} /> 
                        Manager notifications for status updates are delivered in real-time. Keep your tasks updated for accurate team reporting.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default MyProjects;
