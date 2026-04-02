import React, { useState, useEffect } from 'react';
import api from '../api/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
    Folder, CheckCircle, Calendar,
    ChevronDown, ChevronUp, Briefcase
} from 'lucide-react';
import '../styles/dashboard.css';

const EmployeeProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProject, setExpandedProject] = useState(null);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const fetchProjects = async () => {
        try {
            if (!user?.id) return;
            const res = await api.get(`/employee/${user.id}/projects`);
            
            // Manual Grouping for Project + Task Sync
            const grouped = (res.data || []).reduce((acc, item) => {
                const pid = item.project_id;
                if (!acc[pid]) {
                    acc[pid] = { 
                        id: pid,
                        project_name: item.project_name,
                        description: item.project_description || item.description,
                        start_date: item.start_date,
                        end_date: item.end_date,
                        status: 'Active',
                        tasks: [] 
                    };
                }
                if (item.task_id) {
                    acc[pid].tasks.push({
                        id: item.task_id,
                        assignment_id: item.assignment_id,
                        title: item.task_title || item.title,
                        status: item.task_status || item.status || 'Pending'
                    });
                }
                return acc;
            }, {});

            setProjects(Object.values(grouped));
        } catch (err) {
            console.error("Error fetching projects", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
        const poll = setInterval(fetchProjects, 15000); // 15s High-fidelity sync
        return () => clearInterval(poll);
    }, []);

    const handleStatusUpdate = async (assignmentId, newStatus) => {
        try {
            await api.put(`/tasks/${assignmentId}/status`, { status: newStatus });
            fetchProjects();
        } catch (err) {
            console.error("Failed to update task status", err);
            alert("Error updating status");
        }
    };

    const toggleExpand = (id) => {
        setExpandedProject(expandedProject === id ? null : id);
    };

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <header className="page-header d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 fw-bold mb-1">📂 My Assigned Projects</h1>
                        <p className="text-secondary mb-0">Projects and tasks specifically assigned to your account.</p>
                    </div>
                </header>

                {loading ? (
                    <div className="d-flex justify-content-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : projects.length > 0 ? (
                    <div className="project-grid-flex">
                        {projects.map(project => (
                            <div key={project.id} className="project-card-v2 mb-4 bg-white rounded-4 shadow-sm border overflow-hidden">
                                <div 
                                    className="project-card-header p-4 d-flex justify-content-between align-items-center cursor-pointer hover-bg-light"
                                    onClick={() => toggleExpand(project.id)}
                                >
                                    <div className="d-flex gap-4 align-items-center">
                                        <div className="project-id-badge bg-primary text-white">
                                            {project.id}
                                        </div>
                                        <div>
                                            <h3 className="h5 fw-bold mb-1">{project.project_name}</h3>
                                            <div className="d-flex gap-3 text-secondary small">
                                                <span className="d-flex align-items-center gap-1">
                                                    <Calendar size={14} /> {project.start_date} - {project.end_date}
                                                </span>
                                                <span className="d-flex align-items-center gap-1 text-primary fw-bold">
                                                    <Briefcase size={14} /> {project.tasks.length} Assigned Tasks
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {expandedProject === project.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>

                                {expandedProject === project.id && (
                                    <div className="project-card-details p-4 bg-light-alt animate-in">
                                        <div className="mb-4">
                                            <h4 className="small fw-bold text-uppercase text-secondary mb-2">Project Description</h4>
                                            <p className="mb-0 text-dark">{project.description || 'No description provided.'}</p>
                                        </div>

                                        <div className="project-tasks-list">
                                            <h4 className="small fw-bold text-uppercase text-secondary mb-3">Tasks Assigned To Me</h4>
                                            {project.tasks.length > 0 ? (
                                                <div className="row g-3">
                                                    {project.tasks.map(task => (
                                                        <div key={task.id} className="col-md-6">
                                                            <div className="task-mini-card p-3 bg-white rounded-3 border d-flex flex-column gap-2">
                                                                <div className="d-flex justify-content-between align-items-start">
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <div className={`status-dot ${task.status.toLowerCase() === 'completed' ? 'bg-success' : 'bg-warning'}`}></div>
                                                                        <span className="fw-bold small">{task.title}</span>
                                                                    </div>
                                                                    {task.status.toLowerCase() === 'completed' && <CheckCircle size={14} className="text-success" />}
                                                                </div>
                                                                
                                                                <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                                                    <span className="small text-secondary">Status:</span>
                                                                    <select 
                                                                        className={`form-select form-select-sm w-auto py-0 px-2 ${task.status.toLowerCase() === 'completed' ? 'text-success' : 'text-warning'}`}
                                                                        value={task.status}
                                                                        onChange={(e) => handleStatusUpdate(task.assignment_id, e.target.value)}
                                                                        style={{ fontSize: '0.8rem', height: '24px' }}
                                                                    >
                                                                        <option value="pending">Pending</option>
                                                                        <option value="active">Active</option>
                                                                        <option value="completed">Completed</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-3 bg-white rounded-3 border border-dashed text-muted">
                                                    You have no specific tasks assigned under this project yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-dashed">
                        <Folder className="text-muted mb-3" size={48} />
                        <h3 className="h5 text-muted">No Projects Found</h3>
                        <p className="text-secondary">You haven't been assigned to any projects or tasks yet.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default EmployeeProjects;
