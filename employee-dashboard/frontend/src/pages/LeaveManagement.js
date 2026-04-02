import React, { useState, useEffect } from 'react';
import { getTeamLeaves, getUsers, applyLeave, leaveAction } from '../api/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import LeaveTable from '../components/LeaveTable';
import { Mail, Calendar, X, Plus, Save, Activity } from 'lucide-react';
import '../styles/dashboard.css';

const LeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentLeave, setCurrentLeave] = useState({
        employee_id: '', leave_type: '', start_date: '', end_date: '', reason: ''
    });

    const loadData = async () => {
        try {
            const [leavesRes, empRes] = await Promise.all([
                getTeamLeaves(),
                getUsers()
            ]);
            setLeaves(leavesRes.data);
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

    const handleUpdateStatus = async (id, status) => {
        try {
            await leaveAction(id, status);
            loadData();
        } catch (err) {
            alert('Error updating leave status');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await applyLeave(currentLeave);
            setShowModal(false);
            setCurrentLeave({ employee_id: '', leave_type: '', start_date: '', end_date: '', reason: '' });
            loadData();
        } catch (err) {
            alert('Error applying for leave');
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
                        <h1 className="mb-0 text-dark">Leave Management</h1>
                        <p className="text-secondary">Approve or reject employee absence requests.</p>
                    </div>
                </div>

                {/* Dashboard Stats Panel */}
                <div className="stats-grid mb-4">
                     <div className="stat-card">
                        <div className="stat-info">
                            <span>Pending Requests</span>
                            <h2>{leaves.filter(l => l.status === 'Pending').length}</h2>
                        </div>
                        <div className="stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
                             <Activity size={24} />
                        </div>
                     </div>
                     <div className="stat-card">
                        <div className="stat-info">
                            <span>Today on Leave</span>
                            <h2>{leaves.filter(l => l.status === 'Approved' && new Date(l.start_date) <= new Date() && new Date(l.end_date) >= new Date()).length}</h2>
                        </div>
                        <div className="stat-icon" style={{ background: '#eef2ff', color: '#6366f1' }}>
                             <Calendar size={24} />
                        </div>
                     </div>
                     <div className="stat-card border-dashed d-flex align-items-center justify-content-center cursor-pointer hover-bg-light" style={{ borderStyle: 'dashed', background: 'transparent' }} onClick={() => setShowModal(true)}>
                         <div className="d-flex align-items-center gap-2 text-primary fw-600">
                             <Plus size={20} /> Apply Leave on Behalf
                         </div>
                     </div>
                </div>

                <div className="table-container">
                    <LeaveTable leaves={leaves} onUpdateStatus={handleUpdateStatus} />
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-container p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2 className="mb-0 d-flex align-items-center gap-2">
                                    <Mail color="#6366f1" />
                                    Employee Leave Application
                                </h2>
                                <button className="btn btn-light rounded-circle p-2" onClick={() => setShowModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-12 mb-3">
                                        <label className="form-label">Employee</label>
                                        <select 
                                            className="form-select py-2 border-0 bg-light"
                                            value={currentLeave.employee_id}
                                            onChange={(e) => setCurrentLeave({...currentLeave, employee_id: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Employee</option>
                                            {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Leave Type</label>
                                        <select 
                                            className="form-select py-2 border-0 bg-light"
                                            value={currentLeave.leave_type}
                                            onChange={(e) => setCurrentLeave({...currentLeave, leave_type: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Type</option>
                                            <option value="Sick">Sick Leave</option>
                                            <option value="Casual">Casual Leave</option>
                                            <option value="Vacation">Vacation</option>
                                            <option value="Work From Home">Work From Home</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Start Date</label>
                                        <input 
                                            type="date" 
                                            className="form-control py-2 border-0 bg-light" 
                                            value={currentLeave.start_date}
                                            onChange={(e) => setCurrentLeave({...currentLeave, start_date: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">End Date</label>
                                        <input 
                                            type="date" 
                                            className="form-control py-2 border-0 bg-light" 
                                            value={currentLeave.end_date}
                                            onChange={(e) => setCurrentLeave({...currentLeave, end_date: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="col-12 mb-3">
                                        <label className="form-label">Reason</label>
                                        <textarea 
                                            className="form-control py-2 border-0 bg-light"
                                            rows="3"
                                            value={currentLeave.reason}
                                            onChange={(e) => setCurrentLeave({...currentLeave, reason: e.target.value})}
                                            placeholder="Briefly describe the reason for leave"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 d-flex gap-2">
                                    <button type="submit" className="btn-primary-custom flex-grow-1 border-0 d-flex justify-content-center align-items-center gap-2 py-3 rounded-3">
                                        <Save size={20} />
                                        Submit Request
                                    </button>
                                    <button type="button" className="btn btn-light flex-grow-1 py-3 border rounded-3" onClick={() => setShowModal(false)}>
                                        Discard
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LeaveManagement;
