import React, { useState, useEffect, useCallback } from 'react';
import { fetchDashboardStats, fetchAttendance, fetchLeaves, fetchBonuses } from '../api/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { AttendanceChart, LeaveChart } from '../components/Charts';
import AttendanceTable from '../components/AttendanceTable';
import { 
  Users, 
  UserCheck, 
  CalendarOff, 
  Coins, 
  TrendingUp,
  Clock,
  Briefcase,
  AlertTriangle,
  RefreshCcw
} from 'lucide-react';
import '../styles/dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        employeesPresent: 0,
        pendingLeaves: 0,
        totalBonuses: 0,
        totalWorkingHours: 0
    });
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const results = await Promise.allSettled([
                fetchDashboardStats(),
                fetchAttendance(),
                fetchLeaves(),
                fetchBonuses()
            ]);
            
            if (results[0].status === 'fulfilled') setStats(results[0].value.data);
            if (results[1].status === 'fulfilled') setAttendance(results[1].value.data.slice(0, 5));
            if (results[2].status === 'fulfilled') setLeaves(results[2].value.data.slice(0, 5));
            // Bonuses state not being used yet but handled
        } catch (err) {
            console.error('Error loading dashboard data', err);
            setError('System reported an initialization error.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mock chart data based on loaded data
    const attendanceChartData = [
        { date: 'Mon', hours: 45 },
        { date: 'Tue', hours: 52 },
        { date: 'Wed', hours: 48 },
        { date: 'Thu', hours: stats.totalWorkingHours || 30 },
        { date: 'Fri', hours: 0 },
        { date: 'Sat', hours: 0 },
        { date: 'Sun', hours: 0 },
    ];

    const leaveChartData = [
        { type: 'Sick', count: 12 },
        { type: 'Casual', count: 8 },
        { type: 'Vacation', count: 5 },
        { type: 'Maternity', count: 2 },
    ];

    if (loading) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
                <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
                <h4 className="fw-bold text-dark mb-1">Initialising Dashboard Analytics...</h4>
                <p className="text-muted">Fetching latest organisational metrics</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-container">
                <Sidebar />
                <Navbar />
                <main className="main-content d-flex flex-column align-items-center justify-content-center">
                    <div className="text-center p-5 bg-white rounded-4 shadow-sm border max-width-500">
                        <div className="bg-danger-light text-danger p-3 rounded-circle d-inline-block mb-4">
                            <AlertTriangle size={48} />
                        </div>
                        <h2 className="fw-bold mb-3">Unable to Load Dashboard</h2>
                        <p className="text-muted mb-4">{error}</p>
                        <button 
                            className="btn btn-primary px-4 py-2 rounded-3 d-flex align-items-center gap-2 mx-auto"
                            onClick={loadDashboardData}
                        >
                            <RefreshCcw size={18} />
                            Try Again
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <div className="d-flex justify-content-between align-items-end mb-4">
                    <div>
                        <h1 className="mb-1">Dashboard Overview</h1>
                        <p className="text-muted">Welcome back! Here's what's happening today.</p>
                    </div>
                    <div className="btn-primary-custom d-flex align-items-center gap-2 shadow-sm">
                        <TrendingUp size={18} />
                        Live Reports
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-info">
                            <span>Total Employees</span>
                            <h2>{stats.totalEmployees}</h2>
                        </div>
                        <div className="stat-icon" style={{ background: '#eef2ff', color: '#6366f1' }}>
                            <Users size={28} />
                        </div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-info">
                            <span>Employees Present</span>
                            <h2>{stats.employeesPresent}</h2>
                        </div>
                        <div className="stat-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}>
                            <UserCheck size={28} />
                        </div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-info">
                            <span>Leave Requests</span>
                            <h2>{stats.pendingLeaves}</h2>
                        </div>
                        <div className="stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
                            <CalendarOff size={28} />
                        </div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-info">
                            <span>Total Bonuses</span>
                            <h2>${Number(stats.totalBonuses).toLocaleString()}</h2>
                        </div>
                        <div className="stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
                            <Coins size={28} />
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="charts-grid">
                    <div className="chart-card">
                        <div className="chart-title">
                            <Clock size={20} color="#6366f1" />
                            Weekly Attendance Trend
                        </div>
                        <AttendanceChart data={attendanceChartData} />
                    </div>
                    
                    <div className="chart-card">
                        <div className="chart-title">
                            <Briefcase size={20} color="#6366f1" />
                            Leave Distribution
                        </div>
                        <LeaveChart data={leaveChartData} />
                    </div>
                </div>

                {/* Tables Sections */}
                <div className="row">
                    <div className="col-12 col-xl-8">
                        <div className="table-container">
                            <div className="table-header">
                                <h3 className="table-title">Recent Attendance</h3>
                            </div>
                            <AttendanceTable attendance={attendance} />
                        </div>
                    </div>
                    
                    <div className="col-12 col-xl-4">
                        <div className="table-container">
                            <div className="table-header">
                                <h3 className="table-title">Pending Leaves</h3>
                            </div>
                            <div className="p-3">
                                {leaves.filter(l => l.status === 'Pending').length > 0 ? (
                                    leaves.filter(l => l.status === 'Pending').map(leave => (
                                        <div key={leave.id} className="d-flex justify-content-between align-items-center mb-3 p-3 border rounded-3 bg-light">
                                            <div>
                                                <div className="fw-700">{leave.employee_name}</div>
                                                <div className="small text-muted">{leave.leave_type} - {leave.start_date}</div>
                                            </div>
                                            <div className="badge badge-warning">Pending</div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted py-4">No pending leave requests</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
