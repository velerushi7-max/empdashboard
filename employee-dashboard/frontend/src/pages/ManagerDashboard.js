import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
    Users, Briefcase, CheckCircle, Clock, AlertCircle, 
    BarChart2, Filter, Plus, Search, MoreHorizontal,
    TrendingUp, UserCheck, Trash2, Calendar, Edit2
} from 'lucide-react';
import { 
    getManagerProjects, getUsers, getAttendance, createProject, getTeamLeaves, 
    leaveAction, deleteProject, getProjectById, updateProject
} from '../api/api';
import LeaveTable from '../components/LeaveTable';
import { ProductivityChart, TeamPerformanceChart } from '../components/Charts';
import * as adminApi from '../api/adminApi';
import '../styles/dashboard.css';

const ManagerDashboard = () => {
    const [activeTab, setActiveTab] = useState('productivity');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        activeProjects: 0,
        attendanceRate: 0,
        productivityScore: 0
    });
    const [attendance, setAttendance] = useState([]);
    const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0, onLeave: 0 });
    const [leaves, setLeaves] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [teamProductivity, setTeamProductivity] = useState([]);
    const [projects, setProjects] = useState([]);
    const [payroll, setPayroll] = useState([]);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [projectForm, setProjectForm] = useState({
        project_name: '',
        description: '',
        timeline: {
            start_date: new Date().toISOString().split('T')[0],
            end_date: ''
        },
        status: 'In Progress',
        progress: 0,
        team_members: [],
        tasks: [
            { title: '', description: '', assigned_to: '', deadline: '', status: 'Pending' }
        ]
    });

    const handleAddTask = () => {
        setProjectForm({
            ...projectForm,
            tasks: [...projectForm.tasks, { title: '', description: '', assigned_to: '', deadline: '', status: 'Pending' }]
        });
    };

    const handleRemoveTask = (index) => {
        const newTasks = projectForm.tasks.filter((_, i) => i !== index);
        setProjectForm({ ...projectForm, tasks: newTasks });
    };

    const handleTaskChange = (index, field, value) => {
        const newTasks = [...projectForm.tasks];
        newTasks[index][field] = value;
        setProjectForm({ ...projectForm, tasks: newTasks });
    };

    const toggleMember = (userId) => {
        const current = [...projectForm.team_members];
        if (current.includes(userId)) {
            setProjectForm({ ...projectForm, team_members: current.filter(id => id !== userId) });
        } else {
            setProjectForm({ ...projectForm, team_members: [...current, userId] });
        }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project and all associated tasks?")) return;
        try {
            // Instant UI remove (Optimistic update)
            setProjects(prev => prev.filter(p => p.id !== Number(id)));
            await deleteProject(id);
            fetchData(); // Sync with DB
        } catch (err) {
            console.error("Delete Project Error:", err);
            alert("Failed to delete project");
            fetchData(); // Rollback UI if failed
        }
    };

    const handleEditProject = async (id) => {
        try {
            const res = await getProjectById(id);
            const p = res.data;
            setProjectForm({
                ...p,
                timeline: { start_date: p.start_date, end_date: p.end_date }
            });
            setShowProjectModal(true);
        } catch (err) {
            alert("Failed to fetch project details");
        }
    };

    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        if (!projectForm.project_name) {
            alert("Project name is required!");
            return;
        }

        setIsSubmitting(true);
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            
            const taskUsers = projectForm.tasks.map(t => t.assigned_to).filter(id => id !== '');
            const combinedTeam = Array.from(new Set([...(projectForm.team_members || []), ...taskUsers]));
            
            const validTasks = projectForm.tasks.filter(t => t.title && t.title.trim() !== '');
            
            const payload = {
                ...projectForm,
                tasks: validTasks,
                team_members: combinedTeam,
                manager_id: user?.id
            };

            if (projectForm.id) {
                await updateProject(projectForm.id, payload);
                alert("Project updated successfully");
            } else {
                await createProject(payload);
                alert("Project created and tasks assigned!");
            }
            
            setShowProjectModal(false);
            fetchData();
            // Reset form
            setProjectForm({
                project_name: '', description: '',
                timeline: { start_date: new Date().toISOString().split('T')[0], end_date: '' },
                status: 'In Progress', progress: 0, team_members: [],
                tasks: [{ title: '', description: '', assigned_to: '', deadline: '', status: 'Pending' }]
            });
        } catch (err) {
            console.error("Project action failed", err);
            alert("Action failed. Check console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchData();
        const pollInterval = setInterval(fetchData, 5000); // 5s Polling for Real-time Sync
        return () => clearInterval(pollInterval);
    }, [filterDate]);

    const fetchData = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (!user) return;

            const results = await Promise.allSettled([
                getManagerProjects(),
                getUsers(),
                getAttendance(user.id),
                getTeamLeaves(),
                adminApi.getManagerPayroll()
            ]);

            const projectsData = results[0].status === 'fulfilled' ? (results[0].value.data || []) : [];
            const usersData = results[1].status === 'fulfilled' ? (results[1].value.data || []) : [];
            const attendanceData = results[2].status === 'fulfilled' ? results[2].value.data : { daysPresent: 0, avgDailyHours: 0 };
            const leavesData = results[3].status === 'fulfilled' ? (results[3].value.data || []) : [];
            const payrollData = results[4].status === 'fulfilled' ? (results[4].value.data || []) : [];

            setProjects(projectsData);
            setTeamMembers(usersData);
            setLeaves(leavesData);
            setPayroll(payrollData);
            
            // Map new stats to dashboard UI
            setStats({
                totalEmployees: usersData.length,
                activeProjects: projectsData.filter(p => p.status === 'In Progress').length,
                attendanceRate: Math.round((attendanceData.daysPresent / 30) * 100) || 0,
                productivityScore: attendanceData.avgDailyHours * 10,
                pendingLeaves: leavesData.filter(l => l.status === 'Pending').length
            });

        } catch (err) {
            console.error('Error fetching dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <header className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="mb-1">Manager Dashboard</h1>
                        <p className="text-secondary">Insights and controls for your team's performance.</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-primary d-flex align-items-center gap-2">
                            <Filter size={18} /> Filter
                        </button>
                        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShowProjectModal(true)}>
                            <Plus size={18} /> New Project
                        </button>
                    </div>
                </header>

                {/* Overview Cards */}
                <div className="row g-4 mb-4">
                    <div className="col-md-3">
                        <div className="stat-card p-4">
                            <div className="d-flex justify-content-between mb-3">
                                <div className="icon-box bg-primary-light">
                                    <Users className="text-primary" size={24} />
                                </div>
                                <span className="text-success small fw-bold">+2 New</span>
                            </div>
                            <h3 className="mb-1">{stats.totalEmployees}</h3>
                            <p className="text-secondary mb-0">Total Team Members</p>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card p-4">
                            <div className="d-flex justify-content-between mb-3">
                                <div className="icon-box bg-success-light">
                                    <Briefcase className="text-success" size={24} />
                                </div>
                                <span className="text-success small fw-bold">{stats.activeProjects} Active</span>
                            </div>
                            <h3 className="mb-1">{projects.length}</h3>
                            <p className="text-secondary mb-0">Total Projects</p>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card p-4">
                            <div className="d-flex justify-content-between mb-3">
                                <div className="icon-box bg-info-light">
                                    <UserCheck className="text-info" size={24} />
                                </div>
                                <span className="text-info small fw-bold">{stats.attendanceRate}%</span>
                            </div>
                            <h3 className="mb-1">{attendance.filter(a => a.status === 'Present').length}</h3>
                            <p className="text-secondary mb-0">Present Today</p>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card p-4">
                            <div className="d-flex justify-content-between mb-3">
                                <div className="icon-box bg-warning-light">
                                    <Clock className="text-warning" size={24} />
                                </div>
                                {stats.pendingLeaves > 0 && <span className="badge bg-danger pulse-dot-red" style={{ borderRadius: '50%', padding: '5px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> {stats.pendingLeaves} </span>}
                            </div>
                            <h3 className="mb-1">{stats.pendingLeaves || 0}</h3>
                            <p className="text-secondary mb-0">Pending Leave Requests</p>
                        </div>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="dashboard-tabs mb-4">
                    <button 
                        className={`tab-btn ${activeTab === 'productivity' ? 'active' : ''}`}
                        onClick={() => setActiveTab('productivity')}
                    >
                        🚀 Project Productivity
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'allocation' ? 'active' : ''}`}
                        onClick={() => setActiveTab('allocation')}
                    >
                        📁 Project Allocation
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
                        onClick={() => setActiveTab('leaves')}
                    >
                        📅 Leave Approvals
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('attendance')}
                    >
                        🧑🤝🧑 Team Attendance
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'payroll' ? 'active' : ''}`}
                        onClick={() => setActiveTab('payroll')}
                    >
                        🏦 Team Payroll
                    </button>
                </div>

                {/* Productivity Section */}
                {activeTab === 'productivity' && (
                    <div className="row g-4">
                        <div className="col-lg-8">
                            <div className="stat-card p-4 h-100">
                                <h3 className="mb-4 d-flex align-items-center gap-2">
                                    <BarChart2 size={20} /> Team Productivity Trends
                                </h3>
                                <ProductivityChart data={[
                                    { name: 'Mon', completed: 12, pending: 5 },
                                    { name: 'Tue', completed: 19, pending: 3 },
                                    { name: 'Wed', completed: 15, pending: 8 },
                                    { name: 'Thu', completed: 22, pending: 4 },
                                    { name: 'Fri', completed: 18, pending: 6 },
                                ]} />
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="stat-card p-4 h-100">
                                <h3 className="mb-4">Top Performers</h3>
                                <div className="performer-list">
                                    {teamProductivity.sort((a,b) => b.efficiency - a.efficiency).slice(0, 5).map(p => (
                                        <div key={p.employee_id} className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom border-light">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="avatar-small">{p.employee_name[0]}</div>
                                                <div>
                                                    <h6 className="mb-0">{p.employee_name}</h6>
                                                    <small className="text-secondary">{p.completed_tasks} Tasks Done</small>
                                                </div>
                                            </div>
                                            <div className="text-end">
                                                <div className="fw-bold text-success">{p.efficiency}%</div>
                                                <small className="text-muted">Efficiency</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 p-3 bg-light rounded-3">
                                    <div className="d-flex align-items-center gap-2 text-warning mb-2">
                                        <AlertCircle size={18} />
                                        <h6 className="mb-0">Needs Attention</h6>
                                    </div>
                                    <p className="small text-secondary mb-0">
                                        2 team members have efficiency below 60%. Review their pending tasks.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="stat-card p-4">
                                <h3 className="mb-4">Member Efficiency %</h3>
                                <TeamPerformanceChart data={teamProductivity} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Allocation Section */}
                {activeTab === 'allocation' && (
                    <div className="row g-4">
                        <div className="col-12">
                            <div className="stat-card p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h3 className="mb-0">Active Projects</h3>
                                    <div className="search-bar">
                                        <Search size={18} className="text-muted" />
                                        <input type="text" placeholder="Search projects..." className="form-control" />
                                    </div>
                                </div>
                                <div className="table-responsive">
                                    <table className="table hover-table">
                                        <thead>
                                            <tr>
                                                <th>Project Name</th>
                                                <th>Timeline</th>
                                                <th>Status</th>
                                                <th>Progress</th>
                                                <th>Tasks</th>
                                                <th className="text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projects.map(project => (
                                                <tr key={project.id}>
                                                    <td>
                                                        <div className="fw-bold">{project.project_name}</div>
                                                        <small className="text-secondary">{project.description}</small>
                                                    </td>
                                                    <td>
                                                        <small className="d-block">{project.start_date}</small>
                                                        <small className="text-secondary">to {project.end_date}</small>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${
                                                            project.status === 'Completed' ? 'bg-success-light text-success' : 
                                                            project.status === 'Delayed' ? 'bg-danger-light text-danger' : 
                                                            'bg-primary-light text-primary'
                                                        }`}>
                                                            {project.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                                                <div 
                                                                    className="progress-bar bg-primary" 
                                                                    role="progressbar" 
                                                                    style={{ width: `${project.progress}%` }}
                                                                ></div>
                                                            </div>
                                                            <small className="fw-bold">{project.progress}%</small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="text-secondary small">Project Team Active</span>
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-flex gap-2 justify-content-end">
                                                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditProject(project.id)} title="Edit Project">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteProject(project.id)} title="Delete Project">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {projects.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-5 text-muted">No projects found. Create one to get started.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="row g-4">
                        <div className="col-12">
                            <div className="stat-card p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                                    <h3 className="mb-0">Team Attendance: {filterDate}</h3>
                                    <div className="d-flex gap-3 align-items-center flex-wrap">
                                        <div className="attendance-summary-pills d-flex gap-2">
                                            <span className="badge bg-success-light text-success">{attendanceSummary.present} Present</span>
                                            <span className="badge bg-danger-light text-danger">{attendanceSummary.absent} Absent</span>
                                            <span className="badge bg-warning-light text-warning">{attendanceSummary.onLeave} Leave</span>
                                            <span className="badge bg-warning-light text-warning">{attendanceSummary.late || 0} Late</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="small text-secondary fw-bold">Month</span>
                                            <input 
                                                type="month" 
                                                className="form-control form-control-sm" 
                                                onChange={(e) => {
                                                    // This will set a date representing the start of the month to trigger the filter
                                                    setFilterDate(e.target.value + '-01');
                                                }}
                                            />
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="small text-secondary fw-bold">Daily</span>
                                            <input 
                                                type="date" 
                                                className="form-control form-control-sm" 
                                                value={filterDate}
                                                onChange={(e) => setFilterDate(e.target.value)}
                                            />
                                        </div>
                                        <button className="btn btn-sm btn-outline-secondary">Export CSV</button>
                                    </div>
                                </div>
                                <div className="table-responsive">
                                    <table className="table align-middle">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Status</th>
                                                <th>Check In</th>
                                                <th>Check Out</th>
                                                <th>Breaks</th>
                                                <th>Net Hours</th>
                                                <th>Productivity</th>
                                                <th>Insights</th>
                                                <th>Activity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendance.map((record, index) => (
                                                <tr key={index} className={record.is_late || record.is_early_logout ? 'bg-warn-light' : ''}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="avatar-small">{record.name[0]}</div>
                                                            <div>
                                                                <div className="fw-bold">{record.name}</div>
                                                                <small className="text-secondary">ERP-{record.id}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {record.status === 'On Leave' ? (
                                                            <span className="badge bg-warning-light text-warning">On Leave</span>
                                                        ) : record.status === 'Present' ? (
                                                            <span className="badge bg-success-light text-success">Present</span>
                                                        ) : (
                                                            <span className="badge bg-danger-light text-danger">Absent</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-1">
                                                            <Clock size={14} className="text-muted" />
                                                            {record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-1">
                                                            <Clock size={14} className="text-muted" />
                                                            {record.check_out && record.check_out !== 'null' ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="small">{record.break_time ? (record.break_time/100).toFixed(2) : '0.00'}h</div>
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold">{record.hours}h</div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="progress flex-grow-1" style={{height: '4px', minWidth: '40px'}}>
                                                                <div className={`progress-bar ${record.productivity > 80 ? 'bg-success' : 'bg-warning'}`} style={{width: `${record.productivity}%`}}></div>
                                                            </div>
                                                            <small className="fw-bold">{record.productivity}%</small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex flex-column gap-1">
                                                            {record.is_late && <span className="text-danger small fw-bold">⚠️ Late Login</span>}
                                                            {record.is_early_logout && <span className="text-warning small fw-bold">🕘 Early Logout</span>}
                                                            {!record.is_late && !record.is_early_logout && record.status === 'Present' && <span className="text-success small">Target Met</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            {record.activity === 'Working' ? (
                                                                <div className="status-indicator-active">
                                                                    <div className="pulse-dot"></div>
                                                                    <span>Working</span>
                                                                </div>
                                                            ) : record.activity === 'On Break' ? (
                                                                <div className="status-indicator-paused">
                                                                    <div className="pulse-dot-orange"></div>
                                                                    <span>On Break</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted small">Offline</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {attendance.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-5 text-muted">No attendance data found for this date.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leaves Section */}
                {activeTab === 'leaves' && (
                    <div className="row g-4">
                        <div className="col-12">
                            <div className="stat-card p-4">
                                <LeaveTable 
                                    leaves={leaves} 
                                    onUpdateStatus={async (id, status) => {
                                        try {
                                            await leaveAction(id, status);
                                            fetchData();
                                        } catch (e) {
                                            alert("Failed to update status");
                                        }
                                    }} 
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Payroll Section */}
                {activeTab === 'payroll' && (
                    <div className="animate-in">
                        <div className="stat-card p-4">
                            <h3 className="mb-4">🏦 Direct Reports Payroll Overview</h3>
                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Month / Year</th>
                                            <th>Basic Salary</th>
                                            <th>Bonus</th>
                                            <th>Deductions</th>
                                            <th>Net Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payroll.map(p => (
                                            <tr key={p.id}>
                                                <td>
                                                    <div className="fw-bold">{p.employee_name}</div>
                                                    <small className="text-secondary">{p.department}</small>
                                                </td>
                                                <td>{p.month} {p.year}</td>
                                                <td>₹{(p.basic_salary || 0).toLocaleString()}</td>
                                                <td className="text-success">+₹{(p.bonus || 0).toLocaleString()}</td>
                                                <td className="text-danger">-₹{(p.deductions || 0).toLocaleString()}</td>
                                                <td className="fw-bold fs-6">₹{(p.net_salary || 0).toLocaleString()}</td>
                                                <td>
                                                    <span className={`badge rounded-pill ${p.status === 'Paid' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                <ProjectModal 
                    show={showProjectModal}
                    onClose={() => setShowProjectModal(false)}
                    form={projectForm}
                    setForm={setProjectForm}
                    team={teamMembers}
                    onAddTask={handleAddTask}
                    onRemoveTask={handleRemoveTask}
                    onTaskChange={handleTaskChange}
                    onToggleMember={toggleMember}
                    onSubmit={handleProjectSubmit}
                    loading={isSubmitting}
                />
            </main>
        </div>
    );
};

const ProjectModal = ({ show, onClose, form, setForm, team, onAddTask, onRemoveTask, onTaskChange, onToggleMember, onSubmit, loading }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content project-modal animate-in">
                <div className="modal-header">
                    <h3>🚀 Create New Project</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <form onSubmit={onSubmit} className="modal-body">
                    {/* Project Basic Info */}
                    <section className="modal-section">
                        <h4 className="section-title"><Briefcase size={18} /> Project Details</h4>
                        <div className="form-group mb-3">
                            <label className="form-label">Project Name*</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                required 
                                value={form.project_name}
                                onChange={(e) => setForm({...form, project_name: e.target.value})}
                                placeholder="Enter project name..."
                            />
                        </div>
                        <div className="form-group mb-3">
                            <label className="form-label">Description</label>
                            <textarea 
                                className="form-control" 
                                rows="2"
                                value={form.description}
                                onChange={(e) => setForm({...form, description: e.target.value})}
                                placeholder="Core objectives..."
                            ></textarea>
                        </div>
                    </section>

                    {/* Timeline & Status */}
                    <div className="row">
                        <div className="col-md-6">
                            <section className="modal-section">
                                <h4 className="section-title"><Calendar size={18} /> Timeline</h4>
                                <div className="d-flex gap-2">
                                    <div className="mb-2 w-100">
                                        <label className="small text-secondary">Start Date</label>
                                        <input type="date" className="form-control" value={form.timeline.start_date} onChange={(e) => setForm({...form, timeline: {...form.timeline, start_date: e.target.value}})} />
                                    </div>
                                    <div className="mb-2 w-100">
                                        <label className="small text-secondary">End Date*</label>
                                        <input type="date" className="form-control" required value={form.timeline.end_date} onChange={(e) => setForm({...form, timeline: {...form.timeline, end_date: e.target.value}})} />
                                    </div>
                                </div>
                            </section>
                        </div>
                        <div className="col-md-6">
                            <section className="modal-section">
                                <h4 className="section-title"><TrendingUp size={18} /> Status & Progress</h4>
                                <div className="d-flex gap-2 align-items-center">
                                    <select className="form-select w-50" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                                        <option>Not Started</option>
                                        <option>In Progress</option>
                                        <option>Completed</option>
                                        <option>Delayed</option>
                                    </select>
                                    <div className="w-50">
                                        <label className="small d-flex justify-content-between">Progress <span>{form.progress}%</span></label>
                                        <input type="range" className="form-range" min="0" max="100" value={form.progress} onChange={(e) => setForm({...form, progress: e.target.value})} />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Team Allotment */}
                    <section className="modal-section">
                        <h4 className="section-title"><Users size={18} /> Team Allotment*</h4>
                        <p className="small text-secondary mb-2">Assign employees who will be working on this project.</p>
                        <div className="team-selector-box mb-3">
                            {(team || []).map(member => (
                                <div 
                                    key={member.id} 
                                    className={`team-chip ${form.team_members.includes(member.id) ? 'active' : ''}`}
                                    onClick={() => onToggleMember(member.id)}
                                >
                                    <div className="chip-avatar">{member.name?.[0] || 'U'}</div>
                                    <div className="chip-info">
                                        <span className="name">{member.name || 'Unspecified'}</span>
                                        <span className="role">{member.role}</span>
                                    </div>
                                    {form.team_members.includes(member.id) && <CheckCircle size={14} className="active-check" />}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Tasks Dynamic List */}
                    <section className="modal-section">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="section-title mb-0"><AlertCircle size={18} /> Initial Tasks</h4>
                            <button type="button" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={onAddTask}>
                                <Plus size={14} /> Add Task
                            </button>
                        </div>
                        <div className="task-list-container">
                            {form.tasks.map((task, idx) => (
                                <div key={idx} className="task-row mb-3 p-3 bg-light rounded-3 position-relative">
                                    <button type="button" className="btn-close-small" onClick={() => onRemoveTask(idx)}><Trash2 size={14} /></button>
                                    <div className="row g-2">
                                        <div className="col-md-5">
                                            <input type="text" className="form-control form-control-sm" placeholder="Task Title" value={task.title} onChange={(e) => onTaskChange(idx, 'title', e.target.value)} required />
                                        </div>
                                        <div className="col-md-4">
                                            <select className="form-select form-select-sm" value={task.assigned_to} onChange={(e) => onTaskChange(idx, 'assigned_to', e.target.value)} required>
                                                <option value="">Assign To...</option>
                                                {(team || []).map(m => (
                                                    <option key={m.id} value={m.id}>{m.name || 'User'} ({m.role})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <input type="date" className="form-control form-control-sm" value={task.deadline} onChange={(e) => onTaskChange(idx, 'deadline', e.target.value)} />
                                        </div>
                                        <div className="col-12 mt-2">
                                            <input type="text" className="form-control form-control-sm" placeholder="Brief description (optional)" value={task.description} onChange={(e) => onTaskChange(idx, 'description', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="modal-footer border-top pt-4 mt-4 d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                            {loading ? 'Creating...' : '🚀 Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManagerDashboard;
