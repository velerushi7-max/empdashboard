import React, { useState, useEffect } from 'react';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '../api/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import EmployeeTable from '../components/EmployeeTable';
import { Plus, X, UserPlus, Save, Briefcase, Mail, DollarSign, Calendar } from 'lucide-react';
import '../styles/dashboard.css';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState({
        name: '', email: '', role: '', department: '', salary: '', joining_date: ''
    });
    const [loading, setLoading] = useState(true);

    const loadEmployees = async () => {
        try {
            const res = await fetchEmployees();
            setEmployees(res.data);
        } catch (err) {
            console.error('Error fetching employees', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();
    }, []);

    const handleEdit = (emp) => {
        setCurrentEmployee(emp);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await deleteEmployee(id);
                loadEmployees();
            } catch (err) {
                alert('Error deleting employee');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await updateEmployee(currentEmployee.id, currentEmployee);
            } else {
                await createEmployee(currentEmployee);
            }
            setShowModal(false);
            setCurrentEmployee({ name: '', email: '', role: '', department: '', salary: '', joining_date: '' });
            setIsEditing(false);
            loadEmployees();
        } catch (err) {
            alert('Error saving employee');
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
                        <h1 className="mb-0">Employee Management</h1>
                        <p className="text-muted">Register, edit, or remove staff members.</p>
                    </div>
                    <button 
                        className="btn-primary-custom d-flex align-items-center gap-2"
                        onClick={() => {
                            setIsEditing(false);
                            setCurrentEmployee({ name: '', email: '', role: '', department: '', salary: '', joining_date: '' });
                            setShowModal(true);
                        }}
                    >
                        <Plus size={20} />
                        Add New Employee
                    </button>
                </div>

                <div className="table-container">
                    <EmployeeTable 
                        employees={employees} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                    />
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-container">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2 className="mb-0 d-flex align-items-center gap-2">
                                    <UserPlus color="#6366f1" />
                                    {isEditing ? 'Edit Employee' : 'Add Employee'}
                                </h2>
                                <button className="btn btn-light rounded-circle p-2" onClick={() => setShowModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label d-flex align-items-center gap-2"><Plus size={14} /> Full Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={currentEmployee.name}
                                            onChange={(e) => setCurrentEmployee({...currentEmployee, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label d-flex align-items-center gap-2"><Mail size={14} /> Email</label>
                                        <input 
                                            type="email" 
                                            className="form-control" 
                                            value={currentEmployee.email}
                                            onChange={(e) => setCurrentEmployee({...currentEmployee, email: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label d-flex align-items-center gap-2"><Briefcase size={14} /> Job Role</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={currentEmployee.role}
                                            placeholder="e.g. Senior Backend Dev"
                                            onChange={(e) => setCurrentEmployee({...currentEmployee, role: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Department</label>
                                        <select 
                                            className="form-select"
                                            value={currentEmployee.department}
                                            onChange={(e) => setCurrentEmployee({...currentEmployee, department: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Dept</option>
                                            <option value="IT">IT</option>
                                            <option value="HR">HR</option>
                                            <option value="Finance">Finance</option>
                                            <option value="Sales">Sales</option>
                                            <option value="Marketing">Marketing</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label d-flex align-items-center gap-2"><DollarSign size={14} /> Salary</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            value={currentEmployee.salary}
                                            onChange={(e) => setCurrentEmployee({...currentEmployee, salary: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label d-flex align-items-center gap-2"><Calendar size={14} /> Joining Date</label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            value={currentEmployee.joining_date}
                                            onChange={(e) => setCurrentEmployee({...currentEmployee, joining_date: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 d-flex gap-2">
                                    <button type="submit" className="btn-primary-custom flex-grow-1 border-0 d-flex justify-content-center align-items-center gap-2 py-3">
                                        <Save size={20} />
                                        {isEditing ? 'Update Records' : 'Create Record'}
                                    </button>
                                    <button type="button" className="btn btn-light flex-grow-1 py-3 border" onClick={() => setShowModal(false)}>
                                        Cancel
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

export default Employees;
