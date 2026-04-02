import React, { useState, useEffect } from 'react';
import { getTeamEmployees } from '../api/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Users, UserCheck, Briefcase, Mail } from 'lucide-react';
import '../styles/dashboard.css';

const TeamData = () => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await getTeamEmployees();
                setTeam(res.data);
            } catch (err) {
                console.error('Error fetching team', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, []);

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <header className="mb-4">
                    <h1 className="mb-0">Team Management</h1>
                    <p className="text-secondary">View and manage employees assigned to your team.</p>
                </header>

                <div className="row g-4">
                    <div className="col-12">
                        <div className="stat-card p-4">
                            <h3 className="mb-4 d-flex align-items-center gap-2">
                                <Users size={20} /> Team Members ({team.length})
                            </h3>
                            
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Employee Name</th>
                                            <th>Department</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {team.length > 0 ? team.map(emp => (
                                            <tr key={emp.id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="avatar-small">{emp.username[0]}</div>
                                                        <strong>{emp.username}</strong>
                                                    </div>
                                                </td>
                                                <td>{emp.department || 'General'}</td>
                                                <td>
                                                    <span className="badge bg-light text-dark">{emp.role}</span>
                                                </td>
                                                <td>
                                                    <span className="badge badge-success">Active</span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-5 text-muted">No team members assigned yet.</td>
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

export default TeamData;
