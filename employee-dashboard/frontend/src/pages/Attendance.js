import React, { useState, useEffect } from 'react';
import { fetchAttendance, fetchEmployees, checkIn, checkOut } from '../api/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import AttendanceTable from '../components/AttendanceTable';
import { MapPin, LogIn, LogOut, Search, Filter } from 'lucide-react';
import '../styles/dashboard.css';

const Attendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const loadData = async () => {
        try {
            const [attRes, empRes] = await Promise.all([
                fetchAttendance(),
                fetchEmployees()
            ]);
            setAttendance(attRes.data);
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

    const handleCheckIn = async () => {
        if (!selectedEmployee) return alert('Select an employee');
        setActionLoading(true);
        try {
            await checkIn(selectedEmployee);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error checking in');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!selectedEmployee) return alert('Select an employee');
        setActionLoading(true);
        try {
            await checkOut(selectedEmployee);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error checking out');
        } finally {
            setActionLoading(false);
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
                        <h1 className="mb-0">Attendance Tracking</h1>
                        <p className="text-muted">Monitor clock-in/out and calculate working hours.</p>
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="table-container mb-4 p-4">
                    <h3 className="section-title mb-4 d-flex align-items-center gap-2">
                        <MapPin size={20} color="#6366f1" />
                        Gate Entry Mockup
                    </h3>
                    <div className="row align-items-end g-3">
                        <div className="col-md-5">
                            <label className="form-label">Employee</label>
                            <select 
                                className="form-select py-2"
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                            >
                                <option value="">Select Employee to Clock In/Out</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
                            </select>
                        </div>
                        <div className="col-md-7 d-flex gap-2">
                            <button 
                                className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 border-0" 
                                style={{ background: '#22c55e', borderRadius: '0.75rem' }}
                                onClick={handleCheckIn}
                                disabled={actionLoading || !selectedEmployee}
                            >
                                <LogIn size={18} />
                                {actionLoading ? 'Processing...' : 'Clock In'}
                            </button>
                            <button 
                                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 border-0"
                                style={{ background: '#ef4444', borderRadius: '0.75rem' }}
                                onClick={handleCheckOut}
                                disabled={actionLoading || !selectedEmployee}
                            >
                                <LogOut size={18} />
                                {actionLoading ? 'Processing...' : 'Clock Out'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <div className="table-header d-flex justify-content-between align-items-center">
                        <h3 className="table-title">Daily Attendance Records</h3>
                        <div className="d-flex gap-2">
                             <button className="btn btn-light btn-sm d-flex align-items-center gap-2 px-3 border">
                                <Filter size={14} /> Filter
                             </button>
                             <button className="btn btn-light btn-sm d-flex align-items-center gap-2 px-3 border">
                                <Search size={14} /> Search
                             </button>
                        </div>
                    </div>
                    <AttendanceTable attendance={attendance} />
                </div>
            </main>
        </div>
    );
};

export default Attendance;
