import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import * as adminApi from '../api/adminApi';
import { 
  Users, 
  Briefcase, 
  Clock, 
  Calendar, 
  DollarSign, 
  Folder, 
  BarChart2, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  CheckCircle, 
  XCircle,
  MoreVertical,
  FileBarChart
} from 'lucide-react';
import '../styles/dashboard.css';
import { downloadPayslipPDF } from '../utils/generatePayslip';

const AdminDashboard = ({ tab }) => {
    const [activeTab, setActiveTab] = useState(tab || 'overview');
    const [summary, setSummary] = useState({});
    const [users, setUsers] = useState([]);
    const [managers, setManagers] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [adminProjects, setAdminProjects] = useState([]);
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form/Modal states
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPayrollModal, setShowPayrollModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [editingPayroll, setEditingPayroll] = useState(null);
    const [showPayslipModal, setShowPayslipModal] = useState(false);
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [payrollSearch, setPayrollSearch] = useState('');
    const [payrollFilterStatus, setPayrollFilterStatus] = useState('');
    const [payrollForm, setPayrollForm] = useState({ 
        month: new Date().toLocaleString('default', { month: 'long' }), 
        year: new Date().getFullYear(), 
        basic_salary: 0,
        bonus: 0,
        deductions: 0
    });
    const [formData, setFormData] = useState({
        username: '', password: '', role: 'Employee', manager_id: '',
        email: '', phone_number: '', department: '', joining_date: new Date().toISOString().split('T')[0],
        address: '', status: 'Active', basic_salary: 0
    });

    const resetForm = () => {
        setFormData({
            username: '', password: '', role: 'Employee', manager_id: '',
            email: '', phone_number: '', department: '', joining_date: new Date().toISOString().split('T')[0],
            address: '', status: 'Active', basic_salary: 0
        });
        setEditingUser(null);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                adminApi.getSummary(),
                adminApi.getUsers(),
                adminApi.getAllLeaves(),
                adminApi.getAllAttendance(),
                adminApi.getAdminProjects(),
                adminApi.getAllPayroll(payrollSearch, payrollFilterStatus),
                adminApi.getManagers()
            ]);

            if (results[0].status === 'fulfilled') setSummary(results[0].value.data);
            if (results[1].status === 'fulfilled') setUsers(results[1].value.data);
            if (results[2].status === 'fulfilled') setLeaves(results[2].value.data);
            if (results[3].status === 'fulfilled') setAttendance(results[3].value.data);
            if (results[4].status === 'fulfilled') setAdminProjects(results[4].value.data);
            if (results[5].status === 'fulfilled') setPayroll(results[5].value.data);
            if (results[6].status === 'fulfilled') setManagers(results[6].value.data);

            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                console.warn(`${failures.length} admin data requests failed.`);
            }
        } catch (err) {
            console.error('Critical internal error in fetchData', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (tab) setActiveTab(tab);
    }, [tab]);

    useEffect(() => {
        fetchData();
    }, [payrollSearch, payrollFilterStatus]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await adminApi.updateUser({ ...formData, id: editingUser.id, name: formData.username });
            } else {
                await adminApi.createUser({ ...formData, name: formData.username });
            }
            setShowUserModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            alert('Operation failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handlePayrollSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPayroll) {
                await adminApi.updatePayroll(editingPayroll.id, { ...payrollForm, status: editingPayroll.status });
            } else {
                await adminApi.createPayroll({ ...payrollForm, employee_id: selectedEmployee.id });
            }
            setShowPayrollModal(false);
            setEditingPayroll(null);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDeletePayroll = async (id) => {
        if (window.confirm("Permanently delete this payroll record?")) {
            try {
                await adminApi.deletePayroll(id);
                fetchData();
            } catch (err) {
                alert("Delete failed");
            }
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await adminApi.deleteUser(id);
                fetchData();
            } catch (err) {
                alert('Delete failed');
            }
        }
    };

    const renderOverview = () => (
        <div className="admin-overview animate-in">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-info">
                        <span>Total Employees</span>
                        <h2>{summary.totalEmployees || 0}</h2>
                    </div>
                    <div className="stat-icon bg-primary-light text-primary"><Users size={28} /></div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span>Total Managers</span>
                        <h2>{summary.totalManagers || 0}</h2>
                    </div>
                    <div className="stat-icon bg-success-light text-success"><Shield size={28} /></div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span>Active Projects</span>
                        <h2>{summary.activeProjects || 0}</h2>
                    </div>
                    <div className="stat-icon bg-info-light text-info"><Folder size={28} /></div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span>Pending Payroll</span>
                        <h2>{summary.pendingPayroll || 0}</h2>
                    </div>
                    <div className="stat-icon bg-danger-light text-danger"><DollarSign size={28} /></div>
                </div>
            </div>

            <div className="row mt-4">
                <div className="col-lg-8">
                    <div className="stat-card p-4 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="m-0">Recent Activity</h4>
                        </div>
                        <div className="table-responsive">
                            <table className="table hover-table">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th>Department</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.slice(0, 5).map(u => (
                                        <tr key={u.id}>
                                            <td className="fw-bold">{u.name || u.username}</td>
                                            <td><span className={`badge ${u.role?.toLowerCase() === 'manager' ? 'bg-info-light text-info' : 'bg-secondary-light text-secondary'}`}>{u.role}</span></td>
                                            <td>{u.department || 'N/A'}</td>
                                            <td><span className="status-indicator-active small">● {u.status || 'Active'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="stat-card p-4 h-100 highlight-card text-white bg-primary">
                        <h4>Annual Performance</h4>
                        <p className="opacity-75 small">System-wide employee productivity is up by 12% this quarter.</p>
                        <div className="mt-4">
                            <div className="d-flex justify-content-between small mb-1">
                                <span>Target Achievement</span>
                                <span>88%</span>
                            </div>
                            <div className="progress bg-white bg-opacity-25" style={{height: '6px'}}>
                                <div className="progress-bar bg-white" style={{width: '88%'}}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUserManagement = () => (
        <div className="user-management animate-in">
            <div className="table-container bg-white rounded-4 shadow-sm p-0 overflow-hidden">
                <div className="table-header p-4 border-bottom d-flex justify-content-between align-items-center">
                    <h3 className="m-0">Organization Directory</h3>
                </div>
                <div className="table-responsive">
                    <table className="custom-table m-0">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Manager</th>
                                <th>Salary</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.filter(u => {
                                if (activeTab === 'employees') return u.role?.toLowerCase() === 'employee';
                                if (activeTab === 'managers') return u.role?.toLowerCase() === 'manager';
                                return true;
                            }).map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="avatar-small">{(u.name?.[0] || u.username?.[0] || 'U').toUpperCase()}</div>
                                            <div>
                                                <div className="fw-bold">{u.name || u.username || 'No Name'}</div>
                                                <div className="text-muted smallest">{u.email || 'no email'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{u.role}</td>
                                    <td>{u.department || '--'}</td>
                                    <td>{u.manager_name || 'Organization'}</td>
                                    <td className="fw-bold">${(u.basic_salary || 0).toLocaleString()}</td>
                                    <td>
                                        <span className={`badge rounded-pill ${u.status === 'Active' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                                            {u.status || 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-sm btn-icon border" onClick={() => {
                                                setEditingUser(u);
                                                setFormData({
                                                    username: u.name || u.username || '',
                                                    password: '',
                                                    role: u.role || 'Employee',
                                                    manager_id: u.manager_id || '',
                                                    email: u.email || '',
                                                    phone_number: u.phone_number || '',
                                                    department: u.department || '',
                                                    joining_date: u.joining_date || '',
                                                    address: u.address || '',
                                                    status: u.status || 'Active',
                                                    basic_salary: u.basic_salary || 0
                                                });
                                                setShowUserModal(true);
                                            }}><Edit size={14} /></button>
                                            <button className="btn btn-sm btn-icon border text-success" onClick={() => {
                                                setSelectedEmployee(u);
                                                setPayrollForm({
                                                    month: new Date().toLocaleString('default', { month: 'long' }),
                                                    year: new Date().getFullYear(),
                                                    basic_salary: u.basic_salary || 0,
                                                    bonus: 0,
                                                    deductions: 0
                                                });
                                                setShowPayrollModal(true);
                                            }}><DollarSign size={14} /></button>
                                            <button className="btn btn-sm btn-icon border text-danger" onClick={() => handleDeleteUser(u.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderPayrollTab = () => (
        <div className="animate-in">
            <div className="table-container bg-white rounded-4 shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>🏦 Salary & Payroll Management</h3>
                    <div className="d-flex gap-2">
                        <div className="input-group" style={{width: '250px'}}>
                            <input type="text" className="form-control" placeholder="Search name/month..." value={payrollSearch} onChange={e => setPayrollSearch(e.target.value)} />
                        </div>
                        <select className="form-select w-auto" value={payrollFilterStatus} onChange={e => setPayrollFilterStatus(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                        </select>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="custom-table m-0">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Month / Year</th>
                                <th>Basic Salary</th>
                                <th>Bonus</th>
                                <th>Deductions</th>
                                <th>Net Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payroll.length > 0 ? payroll.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="fw-bold">{p.employee_name}</div>
                                        <div className="small text-muted">{p.department}</div>
                                    </td>
                                    <td>{p.month} {p.year}</td>
                                    <td>₹{(p.basic_salary || 0).toLocaleString()}</td>
                                    <td className="text-success">+₹{(p.bonus || 0).toLocaleString()}</td>
                                    <td className="text-danger">-₹{(p.deductions || 0).toLocaleString()}</td>
                                    <td className="fw-bold text-primary fs-6">₹{(p.net_salary || 0).toLocaleString()}</td>
                                    <td>
                                        <span className={`badge rounded-pill ${p.status === 'Paid' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            {p.status !== 'Paid' && (
                                                <button className="btn btn-sm btn-primary" onClick={async () => {
                                                    await adminApi.updatePayrollStatus(p.id, 'Paid');
                                                    fetchData();
                                                }}>Mark Paid</button>
                                            )}
                                            <button className="btn btn-sm btn-icon border" title="Edit" onClick={() => {
                                                setEditingPayroll(p);
                                                setPayrollForm({
                                                    month: p.month,
                                                    year: p.year,
                                                    basic_salary: p.basic_salary,
                                                    bonus: p.bonus,
                                                    deductions: p.deductions
                                                });
                                                setShowPayrollModal(true);
                                            }}><Edit size={14} /></button>
                                            <button className="btn btn-sm btn-icon border text-info" title="View Payslip" onClick={() => {
                                                setSelectedPayslip(p);
                                                setShowPayslipModal(true);
                                            }}><FileBarChart size={14} /></button>
                                            <button className="btn btn-sm btn-icon border text-danger" title="Delete" onClick={() => handleDeletePayroll(p.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-5 text-muted">No payroll records found for this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderAttendance = () => (
        <div className="animate-in">
            <div className="table-container bg-white rounded-4 shadow-sm p-4">
                <h3 className="mb-4">🕒 Attendance Logs</h3>
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Role</th>
                            <th>Check-In</th>
                            <th>Check-Out</th>
                            <th>Work Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendance.map(a => (
                            <tr key={a.id}>
                                <td>{a.employee_name}</td>
                                <td>{a.role}</td>
                                <td>{a.start_time}</td>
                                <td>{a.end_time || '--'}</td>
                                <td>{Math.round(a.duration / 36) / 100}h</td>
                                <td><span className={`badge ${a.status === 'Ongoing' ? 'bg-success-light text-success' : 'bg-info-light text-info'}`}>{a.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderLeaves = () => (
        <div className="animate-in">
            <div className="table-container bg-white rounded-4 shadow-sm p-4">
                <h3 className="mb-4">📅 Organization Leaves</h3>
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Period</th>
                            <th>Reason</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.map(l => (
                            <tr key={l.id}>
                                <td>{l.employee_name}</td>
                                <td>{l.leave_type}</td>
                                <td>{l.start_date} to {l.end_date}</td>
                                <td className="small">{l.reason}</td>
                                <td><span className={`badge ${l.status === 'Approved' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>{l.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Dashboard', icon: <BarChart2 size={18} /> },
        { id: 'employees', label: 'Employees', icon: <Users size={18} /> },
        { id: 'managers', label: 'Managers', icon: <Shield size={18} /> },
        { id: 'attendance', label: 'Attendance', icon: <Clock size={18} /> },
        { id: 'leaves', label: 'Leaves', icon: <Calendar size={18} /> },
        { id: 'payroll', label: 'Payroll', icon: <DollarSign size={18} /> },
        { id: 'projects', label: 'Projects', icon: <Folder size={18} /> },
    ];

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <div className="tab-header d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h2 mb-1">Organization Control</h1>
                        <p className="text-secondary mb-0">Management interface for employees, payroll, and productivity.</p>
                    </div>
                    {(activeTab === 'employees' || activeTab === 'managers') && (
                        <button className="btn btn-primary-custom d-flex align-items-center gap-2" onClick={() => { resetForm(); setShowUserModal(true); }}>
                            <Plus size={18} /> Add {activeTab === 'employees' ? 'Employee' : 'Manager'}
                        </button>
                    )}
                </div>

                <div className="dashboard-tabs mb-4 overflow-auto">
                    <div className="d-flex gap-2">
                        {tabs.map(t => (
                            <button 
                                key={t.id}
                                className={`tab-btn flex-shrink-0 ${activeTab === t.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(t.id)}
                            >
                                <span className="d-flex align-items-center gap-2">
                                    {t.icon} {t.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="tab-render-area">
                    {activeTab === 'overview' && renderOverview()}
                    {(activeTab === 'employees' || activeTab === 'managers') && renderUserManagement()}
                    {activeTab === 'payroll' && renderPayrollTab()}
                    {activeTab === 'attendance' && renderAttendance()}
                    {activeTab === 'leaves' && renderLeaves()}
                    {activeTab === 'projects' && (
                        <div className="table-container bg-white rounded-4 shadow-sm p-4 animate-in">
                            <h3>📂 Active Projects & Responsibilities</h3>
                            <div className="table-responsive">
                                <table className="custom-table m-0">
                                    <thead>
                                        <tr>
                                            <th>Project</th>
                                            <th>Employee</th>
                                            <th>Task</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adminProjects.map((p, idx) => (
                                            <tr key={`${p.project_id}-${idx}`}>
                                                <td className="fw-700 text-primary">{p.project_name}</td>
                                                <td>{p.employee_name || 'N/A'}</td>
                                                <td>{p.task_title || '--'}</td>
                                                <td><span className={`badge ${p.status?.toLowerCase() === 'completed' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>{p.status || '--'}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS */}
            {showUserModal && (
                <div className="modal-overlay">
                    <div className="modal-container p-4 animate-in" style={{maxWidth: '800px'}}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h3>{editingUser ? 'Edit User' : `Add New User`}</h3>
                            <button className="btn-icon" onClick={() => setShowUserModal(false)}><XCircle /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6 text-start">
                                    <label className="form-label small fw-bold">Name / Username</label>
                                    <input type="text" className="form-control" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                                </div>
                                {!editingUser && (
                                    <div className="col-md-6 text-start">
                                        <label className="form-label small fw-bold">Password</label>
                                        <input type="password" className="form-control" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                                    </div>
                                )}
                                <div className="col-md-6 text-start">
                                    <label className="form-label small fw-bold">Email Address</label>
                                    <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                                </div>
                                <div className="col-md-3 text-start">
                                    <label className="form-label small fw-bold">Role</label>
                                    <select className="form-select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                        <option value="Employee">Employee</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div className="col-md-3 text-start">
                                    <label className="form-label small fw-bold">Department</label>
                                    <input type="text" className="form-control" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                                </div>
                                <div className="col-md-4 text-start">
                                    <label className="form-label small fw-bold">Basic Salary ($)</label>
                                    <input type="number" className="form-control" value={formData.basic_salary} onChange={e => setFormData({...formData, basic_salary: e.target.value})} required />
                                </div>
                                <div className="col-md-4 text-start">
                                    <label className="form-label small fw-bold">Reporting To (Manager)</label>
                                    <select 
                                        className="form-select" 
                                        value={formData.manager_id || ""} 
                                        onChange={e => setFormData({...formData, manager_id: e.target.value})}
                                    >
                                        <option value="">Organization (No Manager)</option>
                                        {managers.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} (ID: {m.id})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4 text-start">
                                    <label className="form-label small fw-bold">Joining Date</label>
                                    <input type="date" className="form-control" value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} />
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                                <button type="button" className="btn btn-light" onClick={() => setShowUserModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary-custom">{editingUser ? 'Save Changes' : 'Create User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPayrollModal && (
                <div className="modal-overlay">
                    <div className="modal-container p-4 animate-in" style={{maxWidth: '600px'}}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h3>{editingPayroll ? 'Edit Payroll' : `Create Payroll - ${selectedEmployee?.name}`}</h3>
                            <button className="btn-icon" onClick={() => { setShowPayrollModal(false); setEditingPayroll(null); }}><XCircle /></button>
                        </div>
                        <form onSubmit={handlePayrollSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6 text-start">
                                    <label className="form-label small fw-bold">Month</label>
                                    <select className="form-select" value={payrollForm.month} onChange={e => setPayrollForm({...payrollForm, month: e.target.value})} required>
                                        <option value="">Select Month</option>
                                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6 text-start">
                                    <label className="form-label small fw-bold">Year</label>
                                    <input type="number" className="form-control" value={payrollForm.year} onChange={e => setPayrollForm({...payrollForm, year: Number(e.target.value)})} required />
                                </div>
                                <div className="col-md-6 text-start">
                                    <label className="form-label small fw-bold">Basic Salary (₹)</label>
                                    <input type="number" className="form-control" value={payrollForm.basic_salary} onChange={e => setPayrollForm({...payrollForm, basic_salary: Number(e.target.value)})} required />
                                </div>
                                <div className="col-md-3 text-start">
                                    <label className="form-label small fw-bold">Bonus (₹)</label>
                                    <input type="number" className="form-control" value={payrollForm.bonus} onChange={e => setPayrollForm({...payrollForm, bonus: Number(e.target.value)})} />
                                </div>
                                <div className="col-md-3 text-start">
                                    <label className="form-label small fw-bold">Deductions (₹)</label>
                                    <input type="number" className="form-control" value={payrollForm.deductions} onChange={e => setPayrollForm({...payrollForm, deductions: Number(e.target.value)})} />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-top d-flex justify-content-end gap-2 text-end">
                                <div className="me-auto text-start">
                                    <div className="small text-muted">Estimated Net Pay</div>
                                    <h4 className="m-0 text-primary">₹{(Number(payrollForm.basic_salary) + Number(payrollForm.bonus || 0) - Number(payrollForm.deductions || 0)).toLocaleString()}</h4>
                                </div>
                                <button type="button" className="btn btn-light" onClick={() => { setShowPayrollModal(false); setEditingPayroll(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary-custom">{editingPayroll ? 'Update Record' : 'Generate Payslip'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPayslipModal && selectedPayslip && (
                <div className="modal-overlay">
                    <div className="modal-container p-5 animate-in" style={{maxWidth: '800px', background: '#fff'}}>
                        <div id="printable-payslip">
                            <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
                                <div>
                                    <h2 className="fw-bold text-primary mb-1">COMPANY NAME</h2>
                                    <p className="text-muted small mb-0">123 Corporate Tower, Silicon Valley, CA</p>
                                </div>
                                <div className="text-end">
                                    <h4 className="fw-bold mb-1">PAYSLIP</h4>
                                    <div className="badge bg-primary-light text-primary">{selectedPayslip.month} {selectedPayslip.year}</div>
                                </div>
                            </div>

                            <div className="row mb-5">
                                <div className="col-6">
                                    <div className="small text-muted text-uppercase fw-bold mb-2">Employee Information</div>
                                    <div className="fw-bold fs-5">{selectedPayslip.employee_name}</div>
                                    <div className="text-secondary">{selectedPayslip.role} | {selectedPayslip.department}</div>
                                </div>
                                <div className="col-6 text-end">
                                    <div className="small text-muted text-uppercase fw-bold mb-2">Payment Details</div>
                                    <div className="small">Status: <span className="fw-bold">{selectedPayslip.status}</span></div>
                                    {selectedPayslip.payment_date && (
                                        <div className="small">Date: <span className="fw-bold">{new Date(selectedPayslip.payment_date).toLocaleDateString()}</span></div>
                                    )}
                                    <div className="small">ID: <span className="fw-bold">#SLP-{selectedPayslip.id}</span></div>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-12">
                                    <div className="p-4 bg-light rounded-4">
                                        <h6 className="fw-bold border-bottom pb-2 mb-3">Payment Summary</h6>
                                        <div className="d-flex justify-content-between mb-2"><span>Base Salary</span> <span>₹{(selectedPayslip.basic_salary || 0).toLocaleString()}</span></div>
                                        <div className="d-flex justify-content-between mb-2 text-success"><span>Performance Bonus</span> <span>+₹{(selectedPayslip.bonus || 0).toLocaleString()}</span></div>
                                        <div className="d-flex justify-content-between mb-2 text-danger"><span>Deductions / Taxes</span> <span>-₹{(selectedPayslip.deductions || 0).toLocaleString()}</span></div>
                                        <div className="d-flex justify-content-between border-top pt-2 mt-2 fw-bold text-primary fs-5">
                                            <span>Net Payable Amount</span> <span>₹{(selectedPayslip.net_salary || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 p-4 rounded-4 bg-primary text-white d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="small opacity-75 fw-bold text-uppercase">Monthly Salary</div>
                                    <h2 className="mb-0 fw-bold">₹{(selectedPayslip.net_salary || 0).toLocaleString()}</h2>
                                </div>
                                <div className="text-end small opacity-75">
                                    <div>Status: {selectedPayslip.status}</div>
                                    <div className="fst-italic">Electronic Statement</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 d-flex justify-content-end gap-2">
                            <button className="btn btn-light" onClick={() => setShowPayslipModal(false)}>Close</button>
                            <button className="btn btn-primary" onClick={() => downloadPayslipPDF('printable-payslip', `payslip_${selectedPayslip.employee_name}_${selectedPayslip.month}.pdf`)}>Download PDF</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
