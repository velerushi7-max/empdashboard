import React, { useState, useEffect } from 'react';
import * as api from '../api/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
  Plus, 
  Send, 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  History
} from 'lucide-react';
import '../styles/dashboard.css';

const EmployeeLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [formData, setFormData] = useState({
        leave_type: 'Annual',
        start_date: '',
        end_date: '',
        reason: ''
    });
    const [loading, setLoading] = useState(true);

    const fetchLeaves = async () => {
        try {
            const res = await api.getPersonalLeaves();
            setLeaves(res.data);
        } catch (err) {
            console.error('Error fetching leaves', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.applyLeave(formData);
            setFormData({ leave_type: 'Annual', start_date: '', end_date: '', reason: '' });
            fetchLeaves();
            alert('Leave request submitted successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Error submitting leave');
        }
    };

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <header className="mb-4">
                    <h1 className="mb-0">Leave Management</h1>
                    <p className="text-secondary">Apply for leave and track your request status.</p>
                </header>

                <div className="row g-4">
                    {/* Leave Form */}
                    <div className="col-lg-5">
                        <div className="stat-card p-4 h-100">
                            <h3 className="mb-4 d-flex align-items-center gap-2">
                                <Plus size={20} className="text-primary" /> Apply for Leave
                            </h3>
                            
                            <form onSubmit={handleSubmit} className="row g-3">
                                <div className="col-12">
                                    <label className="form-label fw-600 small">Leave Type</label>
                                    <select 
                                        className="form-select border-0 bg-light" 
                                        value={formData.leave_type}
                                        onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                                    >
                                        <option value="Annual">Annual Leave</option>
                                        <option value="Sick">Sick Leave</option>
                                        <option value="Casual">Casual Leave</option>
                                        <option value="Unpaid">Unpaid Leave</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-600 small">From Date</label>
                                    <input 
                                        type="date" 
                                        className="form-control border-0 bg-light" 
                                        required 
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-600 small">To Date</label>
                                    <input 
                                        type="date" 
                                        className="form-control border-0 bg-light" 
                                        required 
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-600 small">Reason</label>
                                    <textarea 
                                        className="form-control border-0 bg-light" 
                                        rows="3" 
                                        placeholder="Briefly describe the reason for leave..." 
                                        required 
                                        value={formData.reason}
                                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                    ></textarea>
                                </div>
                                <div className="col-12 mt-4">
                                    <button type="submit" className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2">
                                        <Send size={18} /> Submit Application
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Request History */}
                    <div className="col-lg-7">
                        <div className="stat-card p-4 h-100">
                            <h3 className="mb-4 d-flex align-items-center gap-2">
                                <History size={20} className="text-primary" /> Request History
                            </h3>
                            
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Type</th>
                                            <th>Dates</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaves.length > 0 ? leaves.map(leave => (
                                            <tr key={leave.id}>
                                                <td>
                                                    <div className="fw-bold">{leave.leave_type}</div>
                                                    <small className="text-secondary d-block text-truncate" style={{ maxWidth: '150px' }}>{leave.reason}</small>
                                                </td>
                                                <td>
                                                    <div className="small fw-600">{leave.start_date}</div>
                                                    <div className="small text-muted">{leave.end_date}</div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${
                                                        leave.status === 'Approved' ? 'badge-success' : 
                                                        leave.status === 'Rejected' ? 'badge-danger' : 
                                                        'badge-warning'
                                                    } d-flex align-items-center gap-1 w-fit`}>
                                                        {leave.status === 'Approved' && <CheckCircle size={12} />}
                                                        {leave.status === 'Rejected' && <XCircle size={12} />}
                                                        {leave.status === 'Pending' && <Clock size={12} />}
                                                        {leave.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="3" className="text-center py-5 text-muted">No leave requests found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EmployeeLeaves;
