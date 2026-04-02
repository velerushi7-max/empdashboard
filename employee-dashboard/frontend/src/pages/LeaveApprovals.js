import React, { useState, useEffect } from 'react';
import * as api from '../api/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  FileText, 
  AlertCircle,
  Users
} from 'lucide-react';
import '../styles/dashboard.css';

const LeaveApprovals = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaves = async () => {
        try {
            const res = await api.getTeamLeaves();
            setLeaves(res.data);
        } catch (err) {
            console.error('Error fetching leaves', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const handleAction = async (id, status) => {
        try {
            await api.leaveAction(id, status);
            fetchLeaves();
            // Optional: Notification or Alert? 
            // alert(`Leave ${status} successfully.`);
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating leave status');
        }
    };

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <header className="mb-4">
                    <h1 className="mb-0">Leave Approvals</h1>
                    <p className="text-secondary">Process and manage leave requests from your subordinates.</p>
                </header>

                <div className="row g-4">
                    <div className="col-12">
                        <div className="stat-card p-4">
                            <h3 className="mb-4 d-flex align-items-center gap-2">
                                <Users size={20} className="text-primary" /> Active Requests
                            </h3>
                            
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Employee Name</th>
                                            <th>Leave Type</th>
                                            <th>Dates</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaves.length > 0 ? leaves.map(leave => (
                                            <tr key={leave.id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="avatar-small">{leave.employee_name[0]}</div>
                                                        <strong>{leave.employee_name}</strong>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-light text-dark">{leave.leave_type}</span>
                                                </td>
                                                <td>
                                                    <div className="small fw-600">{leave.start_date}</div>
                                                    <div className="small text-muted">{leave.end_date}</div>
                                                </td>
                                                <td>
                                                    <div className="small text-secondary" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {leave.reason}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${
                                                        leave.status === 'Approved' ? 'badge-success' : 
                                                        leave.status === 'Rejected' ? 'badge-danger' : 
                                                        'badge-warning'
                                                    } d-flex align-items-center gap-1 w-fit`}>
                                                        {leave.status}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    {leave.status === 'Pending' ? (
                                                        <div className="d-flex gap-2 justify-content-center">
                                                            <button 
                                                                className="btn btn-sm btn-success d-flex align-items-center gap-1 px-3" 
                                                                onClick={() => handleAction(leave.id, 'Approved')}
                                                            >
                                                                <CheckCircle size={14} /> Approve
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-danger d-flex align-items-center gap-1 px-3"
                                                                onClick={() => handleAction(leave.id, 'Rejected')}
                                                            >
                                                                <XCircle size={14} /> Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted small italic">Processed</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-5 text-muted">No leave requests found at this time.</td>
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

export default LeaveApprovals;
