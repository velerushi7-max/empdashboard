import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
    Calendar, Clock, Users, Plus, X, Video, 
    MoreHorizontal, Trash2, CheckCircle, AlertCircle,
    ChevronRight, MapPin, User
} from 'lucide-react';
import { 
    getManagerMeetings, getEmployeeMeetings, createMeeting, deleteMeeting, getUsers 
} from '../api/api';
import '../styles/dashboard.css';

const Meetings = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [meetings, setMeetings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        meeting_date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        employee_ids: []
    });

    const isManager = user?.role?.toLowerCase() === 'manager' || user?.role?.toLowerCase() === 'admin';

    const fetchData = async () => {
        try {
            setLoading(true);
            const [meetingsRes, usersRes] = await Promise.all([
                isManager ? getManagerMeetings() : getEmployeeMeetings(),
                isManager ? getUsers() : Promise.resolve({ data: [] })
            ]);
            setMeetings(meetingsRes.data);
            setEmployees(usersRes.data.filter(u => u.role.toLowerCase() === 'employee'));
        } catch (error) {
            console.error('Error fetching meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const toggleEmployee = (id) => {
        const current = [...form.employee_ids];
        if (current.includes(id)) {
            setForm({ ...form, employee_ids: current.filter(empId => empId !== id) });
        } else {
            setForm({ ...form, employee_ids: [...current, id] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.employee_ids.length === 0) {
            alert("Please select at least one employee.");
            return;
        }
        if (form.start_time >= form.end_time) {
            alert("End time must be after start time.");
            return;
        }

        setIsSubmitting(true);
        try {
            await createMeeting(form);
            setShowModal(false);
            setForm({
                title: '', description: '',
                meeting_date: new Date().toISOString().split('T')[0],
                start_time: '', end_time: '', employee_ids: []
            });
            fetchData();
        } catch (error) {
            console.error('Failed to schedule meeting:', error);
            alert(error.response?.data?.message || "Failed to schedule meeting.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this meeting?")) return;
        try {
            await deleteMeeting(id);
            fetchData();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const isUpcoming = (date, startTime) => {
        const meetingDateTime = new Date(`${date}T${startTime}`);
        return meetingDateTime > new Date();
    };

    const upcomingMeetings = meetings.filter(m => isUpcoming(m.meeting_date, m.start_time));
    const pastMeetings = meetings.filter(m => !isUpcoming(m.meeting_date, m.start_time));

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <header className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="mb-1">🤝 Team Meetings</h1>
                        <p className="text-secondary">
                            {isManager ? 'Manage and coordinate sessions with your team.' : 'View your upcoming and past meeting sessions.'}
                        </p>
                    </div>
                    {isManager && (
                        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
                            <Plus size={18} /> Schedule Meeting
                        </button>
                    )}
                </header>

                <div className="row g-4">
                    {/* Left: Summary Stats (Optional) */}
                    <div className="col-12">
                        <div className="row g-4 mb-2">
                             <div className="col-md-4">
                                <div className="stat-card p-4 d-flex align-items-center gap-3">
                                    <div className="icon-box bg-primary-light">
                                        <Calendar className="text-primary" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="mb-0">{upcomingMeetings.length}</h3>
                                        <p className="text-secondary small mb-0">Upcoming Sessions</p>
                                    </div>
                                </div>
                             </div>
                             <div className="col-md-4">
                                <div className="stat-card p-4 d-flex align-items-center gap-3">
                                    <div className="icon-box bg-success-light">
                                        <Video className="text-success" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="mb-0">{pastMeetings.length}</h3>
                                        <p className="text-secondary small mb-0">Past Meetings</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Main List */}
                    <div className="col-12">
                        <div className="stat-card p-0 overflow-hidden">
                            <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light">
                                <h4 className="mb-0 d-flex align-items-center gap-2">
                                    <Clock size={20} className="text-primary" /> Upcoming Meetings
                                </h4>
                                <span className={`badge ${upcomingMeetings.length > 0 ? 'bg-primary' : 'bg-secondary'}`}>
                                    {upcomingMeetings.length} Total
                                </span>
                            </div>
                            
                            <div className="meeting-list">
                                {upcomingMeetings.length > 0 ? upcomingMeetings.map(meeting => (
                                    <div key={meeting.id} className="meeting-row p-4 border-bottom hover-bg-light transition-all">
                                        <div className="row align-items-center g-3">
                                            <div className="col-md-2 text-center text-md-start">
                                                <div className="date-badge">
                                                    <div className="month">{new Date(meeting.meeting_date).toLocaleDateString('en-US', { month: 'short' })}</div>
                                                    <div className="day">{new Date(meeting.meeting_date).getDate()}</div>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <h5 className="mb-1 text-dark fw-bold">{meeting.title}</h5>
                                                <p className="text-secondary small mb-0 d-flex align-items-center gap-2">
                                                    <MapPin size={14} /> Virtual Session
                                                </p>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="d-flex align-items-center gap-2 text-primary fw-600">
                                                    <Clock size={16} />
                                                    {meeting.start_time} - {meeting.end_time}
                                                </div>
                                                {!isManager && (
                                                    <div className="small text-secondary mt-1">
                                                        <User size={12} className="me-1" />
                                                        Hosted by: {meeting.manager_name}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-md-2">
                                                <div className="participants-stack">
                                                    <div className="avatar-group">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="avatar-tiny" style={{ background: '#eef2ff' }}>
                                                                <Users size={12} className="text-primary" />
                                                            </div>
                                                        ))}
                                                        {meeting.participants_count > 3 && (
                                                            <span className="plus-count">+{meeting.participants_count - 3}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-1 text-end">
                                                {isManager ? (
                                                    <button className="btn btn-sm btn-icon text-danger" onClick={() => handleDelete(meeting.id)}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                ) : (
                                                    <button className="btn btn-sm btn-outline-primary rounded-pill">
                                                        Join
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-5 text-center text-muted">
                                        <AlertCircle size={40} className="mb-3 opacity-25" />
                                        <p>No upcoming meetings scheduled.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Past Meetings List */}
                    <div className="col-12 mt-4">
                        <div className="stat-card p-4">
                            <h4 className="mb-4 text-secondary">Past Meetings</h4>
                            <div className="table-responsive">
                                <table className="table hover-table align-middle">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Participants</th>
                                            <th className="text-end">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pastMeetings.map(m => (
                                            <tr key={m.id}>
                                                <td><span className="fw-600">{m.title}</span></td>
                                                <td>{m.meeting_date}</td>
                                                <td>{m.start_time} - {m.end_time}</td>
                                                <td>{isManager ? `${m.participants_count} Employees` : 'You were there'}</td>
                                                <td className="text-end">
                                                    <span className="badge bg-light text-secondary rounded-pill px-3">Completed</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {pastMeetings.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4 text-muted">No past meetings found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scheduling Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-container p-4 animate-in">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="mb-0">📅 Schedule New Meeting</h3>
                                <button className="close-btn" onClick={() => setShowModal(false)}><X size={24} /></button>
                            </div>
                            
                            <form onSubmit={handleSubmit}>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label fw-600">Meeting Title*</label>
                                        <input type="text" name="title" className="form-control" required value={form.title} onChange={handleFormChange} placeholder="e.g. Weekly Sync" />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-600">Description</label>
                                        <textarea name="description" className="form-control" rows="2" value={form.description} onChange={handleFormChange} placeholder="Detailed agenda..." />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-600">Date*</label>
                                        <input type="date" name="meeting_date" className="form-control" required value={form.meeting_date} onChange={handleFormChange} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-600">Start Time*</label>
                                        <input type="time" name="start_time" className="form-control" required value={form.start_time} onChange={handleFormChange} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-600">End Time*</label>
                                        <input type="time" name="end_time" className="form-control" required value={form.end_time} onChange={handleFormChange} />
                                    </div>
                                    
                                    <div className="col-12 mt-3">
                                        <label className="form-label fw-600">Select Invitees*</label>
                                        <div className="employee-selection-grid p-3 bg-light rounded-3 border">
                                            {employees.map(emp => (
                                                <div 
                                                    key={emp.id} 
                                                    className={`selection-chip ${form.employee_ids.includes(emp.id) ? 'active' : ''}`}
                                                    onClick={() => toggleEmployee(emp.id)}
                                                >
                                                    <div className="chip-avatar-sm">{emp.name[0]}</div>
                                                    <span>{emp.name}</span>
                                                    {form.employee_ids.includes(emp.id) && <CheckCircle size={14} className="ms-auto" />}
                                                </div>
                                            ))}
                                        </div>
                                        <small className="text-secondary mt-1">{form.employee_ids.length} selected</small>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-top d-flex gap-2">
                                    <button type="submit" className="btn btn-primary flex-grow-1 py-3" disabled={isSubmitting}>
                                        {isSubmitting ? 'Scheduling...' : '🚀 Schedule Session'}
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary px-4 py-3" onClick={() => setShowModal(false)}>Discard</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                .date-badge {
                    width: 70px;
                    text-align: center;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                }
                .date-badge .month {
                    background: #6366f1;
                    color: white;
                    font-size: 0.75rem;
                    padding: 2px 0;
                    text-transform: uppercase;
                    font-weight: 700;
                }
                .date-badge .day {
                    font-size: 1.5rem;
                    font-weight: 700;
                    padding: 5px 0;
                    color: #1e293b;
                }
                .employee-selection-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 10px;
                    max-height: 200px;
                    overflow-y: auto;
                }
                .selection-chip {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.2s;
                }
                .selection-chip:hover {
                    border-color: #6366f1;
                    background: #f8faff;
                }
                .selection-chip.active {
                    background: #6366f1;
                    color: white;
                    border-color: #6366f1;
                }
                .chip-avatar-sm {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #e2e8f0;
                    color: #475569;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: 700;
                }
                .selection-chip.active .chip-avatar-sm {
                    background: rgba(255,255,255,0.2);
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default Meetings;
