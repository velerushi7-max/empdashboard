import React from 'react';
import { Clock, UserCheck, Calendar } from 'lucide-react';

const AttendanceTable = ({ attendance }) => {
    return (
        <div className="table-responsive">
            <table className="custom-table">
                <thead>
                    <tr>
                        <th className="px-4">Employee</th>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Status</th>
                        <th>Hours</th>
                    </tr>
                </thead>
                <tbody>
                    {attendance.map((record) => (
                        <tr key={record.id}>
                            <td className="px-4">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="user-avatar" style={{ height: '32px', width: '32px' }}>
                                        {record.employee_name?.charAt(0)}
                                    </div>
                                    <span className="fw-600">{record.employee_name}</span>
                                </div>
                            </td>
                            <td>
                                <div className="d-flex align-items-center text-muted small">
                                    <Calendar size={14} className="me-2" />
                                    {record.date}
                                </div>
                            </td>
                            <td>
                                <div className="d-flex align-items-center">
                                    <Clock size={14} className="me-2 text-success" />
                                    {new Date(record.check_in.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </td>
                            <td>
                                {record.check_out ? (
                                    <div className="d-flex align-items-center">
                                        <Clock size={14} className="me-2 text-danger" />
                                        {new Date(record.check_out.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                ) : (
                                    <span className="text-warning fw-500">-</span>
                                )}
                            </td>
                            <td>
                                {record.check_out ? (
                                    <div className="badge badge-success">Completed</div>
                                ) : (
                                    <div className="badge badge-warning">Active</div>
                                )}
                            </td>
                            <td>
                                <div className="fw-bold">
                                    {record.work_hours !== null ? `${record.work_hours}h` : '--'}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {attendance.length === 0 && (
                        <tr>
                            <td colSpan="6" className="text-center py-5 text-muted">
                                No attendance records for this period.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AttendanceTable;
