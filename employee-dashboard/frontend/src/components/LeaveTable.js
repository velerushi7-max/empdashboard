import React from 'react';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

const LeaveTable = ({ leaves, onUpdateStatus }) => {
    return (
        <div className="table-responsive">
            <table className="custom-table">
                <thead>
                    <tr>
                        <th className="px-4">Employee</th>
                        <th>Leave Type</th>
                        <th>Dates</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {leaves.map((leave) => (
                        <tr key={leave.id}>
                            <td className="px-4">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="user-avatar" style={{ height: '32px', width: '32px' }}>
                                        {leave.employee_name?.charAt(0)}
                                    </div>
                                    <span className="fw-600">{leave.employee_name}</span>
                                </div>
                            </td>
                            <td>
                                <div className="badge badge-info">{leave.leave_type}</div>
                            </td>
                            <td>
                                <div className="d-flex align-items-center small text-muted">
                                    <Calendar size={14} className="me-2 text-primary" />
                                    {leave.start_date} <span className="mx-1">→</span> {leave.end_date}
                                </div>
                            </td>
                            <td>
                                <div className="text-truncate" style={{ maxWidth: '150px' }} title={leave.reason}>
                                    {leave.reason}
                                </div>
                            </td>
                            <td>
                                <div className={`badge badge-${leave.status === 'Approved' ? 'success' : leave.status === 'Rejected' ? 'danger' : 'warning'}`}>
                                    {leave.status}
                                </div>
                            </td>
                            <td>
                                {leave.status === 'Pending' && (
                                    <div className="d-flex gap-2">
                                        <button 
                                            className="btn btn-sm btn-light p-2 rounded-circle border-0"
                                            onClick={() => onUpdateStatus(leave.id, 'Approved')}
                                            title="Approve"
                                        >
                                            <CheckCircle size={18} color="#16a34a" />
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-light p-2 rounded-circle border-0"
                                            onClick={() => onUpdateStatus(leave.id, 'Rejected')}
                                            title="Reject"
                                        >
                                            <XCircle size={18} color="#dc2626" />
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    {leaves.length === 0 && (
                        <tr>
                            <td colSpan="6" className="text-center py-5 text-muted">
                                No leave requests found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default LeaveTable;
