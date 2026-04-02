import React from 'react';
import { Edit, Trash, Mail, Briefcase } from 'lucide-react';

const EmployeeTable = ({ employees, onEdit, onDelete }) => {
    return (
        <div className="table-responsive">
            <table className="custom-table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Role</th>
                        <th>Salary</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((emp) => (
                        <tr key={emp.id}>
                            <td>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="user-avatar" style={{ minWidth: '40px' }}>
                                        {emp.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="fw-bold">{emp.name}</div>
                                        <div className="text-muted small">
                                            <Mail size={12} className="me-1" />
                                            {emp.email}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="badge badge-info">
                                    {emp.department}
                                </div>
                            </td>
                            <td>
                                <div className="d-flex align-items-center">
                                    <Briefcase size={14} className="me-2 text-muted" />
                                    {emp.role}
                                </div>
                            </td>
                            <td>
                                <div className="fw-bold text-success">
                                    ${emp.salary.toLocaleString()}
                                </div>
                            </td>
                            <td>{new Date(emp.joining_date).toLocaleDateString()}</td>
                            <td>
                                <div className="d-flex gap-2">
                                    <button 
                                        className="btn btn-sm btn-light p-2 rounded-circle"
                                        onClick={() => onEdit(emp)}
                                    >
                                        <Edit size={16} color="#4f46e5" />
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-light p-2 rounded-circle"
                                        onClick={() => onDelete(emp.id)}
                                    >
                                        <Trash size={16} color="#ef4444" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {employees.length === 0 && (
                        <tr>
                            <td colSpan="6" className="text-center py-5 text-muted">
                                No employees found. Start adding some!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default EmployeeTable;
