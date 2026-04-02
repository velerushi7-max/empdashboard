import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
    Plus, Folder, Calendar, Users as UsersIcon, Clock, 
    MoreHorizontal, Trash2, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import * as api from '../api/api';
import '../styles/dashboard.css';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    const [projectForm, setProjectForm] = useState({
        project_name: '', description: '', start_date: '', end_date: ''
    });

    const [taskForm, setTaskForm] = useState({
        title: '', description: '', employee_ids: []
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projRes, userRes] = await Promise.all([
                api.getManagerProjects(),
                api.getUsers()
            ]);
            setProjects(projRes.data);
            setEmployees(userRes.data.filter(u => u.role.toLowerCase() === 'employee'));
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.createProject(projectForm);
            setShowProjectModal(false);
            setProjectForm({ project_name: '', description: '', start_date: '', end_date: '' });
            fetchData();
        } catch (err) {
            alert('Failed to create project');
        }
    };

    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.createTask({ ...taskForm, project_id: selectedProject.id });
            setShowTaskModal(false);
            setTaskForm({ title: '', description: '', employee_ids: [] });
            fetchData();
        } catch (err) {
            alert('Failed to assign task');
        }
    };

    const toggleEmployee = (id) => {
        const current = [...taskForm.employee_ids];
        if (current.includes(id)) {
            setTaskForm({ ...taskForm, employee_ids: current.filter(empId => empId !== id) });
        } else {
            setTaskForm({ ...taskForm, employee_ids: [...current, id] });
        }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm("Delete this project and all associated tasks?")) return;
        try {
            await api.deleteProject(id);
            fetchData();
        } catch (err) {
            alert("Failed to delete");
        }
    };

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <header className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1>📁 Team Projects</h1>
                        <p className="text-secondary">Orchestrate deliverables and track team progress.</p>
                    </div>
                    <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShowProjectModal(true)}>
                        <Plus size={18} /> New Project
                    </button>
                </header>

                <div className="row g-4">
                    {loading ? (
                        <div className="col-12 text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                        </div>
                    ) : projects.map(proj => (
                        <div key={proj.id} className="col-lg-6">
                            <div className="stat-card p-4 transition-all hover-glow">
                                <div className="d-flex justify-content-between align-items-start mb-4">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="icon-box bg-primary-light">
                                            <Folder className="text-primary" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="mb-0">{proj.project_name}</h3>
                                            <div className="d-flex gap-3 text-secondary small">
                                                <span className="d-flex align-items-center gap-1"><Calendar size={14} /> {proj.start_date}</span>
                                                <span className="d-flex align-items-center gap-1"><ChevronRight size={14} /> {proj.end_date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="dropdown">
                                        <button className="btn btn-icon text-muted" onClick={() => handleDeleteProject(proj.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                
                                <p className="text-muted small mb-4">{proj.description || 'No description provided.'}</p>

                                <div className="project-tasks mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0 section-title"><Clock size={16} /> Active Tasks</h5>
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => { setSelectedProject(proj); setShowTaskModal(true); }}>
                                            <Plus size={14} /> Add Task
                                        </button>
                                    </div>
                                    
                                    <div className="task-stack">
                                        {proj.tasks && proj.tasks.length > 0 ? proj.tasks.map(task => (
                                            <div key={task.id} className="task-card-sm p-3 mb-2 rounded-3 border bg-light d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div className="fw-600 text-dark small">{task.title}</div>
                                                    <div className="text-primary small fw-bold mt-1">
                                                        <UsersIcon size={12} className="me-1" />
                                                        {task.assigned_employees || 'Unassigned'}
                                                    </div>
                                                </div>
                                                <span className={`badge ${
                                                    task.statuses?.includes('completed') ? 'bg-success' : 
                                                    task.statuses?.includes('in-progress') ? 'bg-warning' : 'bg-secondary'
                                                } rounded-pill px-3`}>
                                                    Status Tracker
                                                </span>
                                            </div>
                                        )) : (
                                            <p className="text-center text-muted small py-3 border-dashed rounded-3">No tasks assigned yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && !loading && (
                        <div className="col-12 text-center py-5">
                            <Folder size={64} className="text-light mb-3" />
                            <h3 className="text-muted">No Projects Found</h3>
                            <p>Get started by creating your first team project.</p>
                        </div>
                    )}
                </div>

                {/* Project Modal */}
                {showProjectModal && (
                    <div className="modal-overlay">
                        <div className="modal-container p-4 animate-in">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3>🚀 Launch New Project</h3>
                                <button className="close-btn" onClick={() => setShowProjectModal(false)}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleProjectSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-600">Project Name*</label>
                                    <input type="text" className="form-control" required value={projectForm.project_name} onChange={(e) => setProjectForm({...projectForm, project_name: e.target.value})} placeholder="e.g. Q3 Sales Expansion" />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-600">Description</label>
                                    <textarea className="form-control" rows="3" value={projectForm.description} onChange={(e) => setProjectForm({...projectForm, description: e.target.value})} placeholder="Project objectives and goals..." />
                                </div>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-600">Start Date*</label>
                                        <input type="date" className="form-control" required value={projectForm.start_date} onChange={(e) => setProjectForm({...projectForm, start_date: e.target.value})} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-600">End Date*</label>
                                        <input type="date" className="form-control" required value={projectForm.end_date} onChange={(e) => setProjectForm({...projectForm, end_date: e.target.value})} />
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-top d-flex gap-2">
                                    <button type="submit" className="btn btn-primary flex-grow-1 py-3">Create Project</button>
                                    <button type="button" className="btn btn-outline-secondary px-4 py-3" onClick={() => setShowProjectModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Task Modal */}
                {showTaskModal && (
                    <div className="modal-overlay">
                        <div className="modal-container p-4 animate-in">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3>📋 Assign Task to {selectedProject?.project_name}</h3>
                                <button className="close-btn" onClick={() => setShowTaskModal(false)}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleTaskSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-600">Task Title*</label>
                                    <input type="text" className="form-control" required value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} placeholder="e.g. Technical Documentation" />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-600">Task Description</label>
                                    <textarea className="form-control" rows="2" value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} placeholder="Action items..." />
                                </div>
                                <label className="form-label fw-600">Assign Employees*</label>
                                <div className="employee-selection-grid p-3 bg-light rounded-3 border mb-3">
                                    {employees.map(emp => (
                                        <div 
                                            key={emp.id} 
                                            className={`selection-chip ${taskForm.employee_ids.includes(emp.id) ? 'active' : ''}`}
                                            onClick={() => toggleEmployee(emp.id)}
                                        >
                                            <div className="chip-avatar-sm">{emp.name[0]}</div>
                                            <span>{emp.name}</span>
                                            {taskForm.employee_ids.includes(emp.id) && <CheckCircle2 size={14} className="ms-auto" />}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-3 border-top d-flex gap-2">
                                    <button type="submit" className="btn btn-primary flex-grow-1 py-3">🚀 Assign Task</button>
                                    <button type="button" className="btn btn-outline-secondary px-4 py-3" onClick={() => setShowTaskModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
            
            <style>{`
                .task-card-sm {
                    transition: all 0.2s;
                }
                .task-card-sm:hover {
                    border-color: #6366f1 !important;
                    background: #f8faff !important;
                }
                .employee-selection-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                    gap: 10px;
                    max-height: 180px;
                    overflow-y: auto;
                }
                .selection-chip {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.85rem;
                }
                .selection-chip.active {
                    background: #6366f1;
                    color: white;
                    border-color: #6366f1;
                }
                .chip-avatar-sm {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #e2e8f0;
                    color: #475569;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: 700;
                }
                .selection-chip.active .chip-avatar-sm {
                    background: rgba(255,255,255,0.2);
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default Projects;
