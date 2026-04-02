import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { User, Mail, Shield, Calendar, Edit3, Save, X, Lock } from 'lucide-react';
import axios from 'axios';

const Profile = () => {
    const location = useLocation();
    const [isEditing, setIsEditing] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        // Check if we should start in edit mode
        const params = new URLSearchParams(location.search);
        if (params.get('edit') === 'true') {
            setIsEditing(true);
        }
        fetchProfile();
    }, [location]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
            setFormData({
                username: res.data.username,
                email: res.data.email || '',
                password: '',
                confirmPassword: ''
            });
        } catch (err) {
            console.error('Error fetching profile', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (formData.password && formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/auth/profile', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Profile updated successfully!');
            setIsEditing(false);
            fetchProfile();
            
            // Update local storage if username changed
            const localUser = JSON.parse(localStorage.getItem('user'));
            localUser.username = formData.username;
            localStorage.setItem('user', JSON.stringify(localUser));
            
        } catch (err) {
            console.error('Error updating profile', err);
            setMessage('Error updating profile');
        }
    };

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />

            <main className="main-content">
                <div className="profile-container py-4">
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div className="stat-card p-0 overflow-hidden">
                                <div className="profile-header-bg"></div>
                                <div className="profile-content p-4 px-lg-5">
                                    <div className="d-flex flex-column flex-sm-row align-items-center align-items-sm-end gap-4 profile-avatar-overlap">
                                        <div className="profile-avatar-large">
                                            {user?.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="profile-title-section flex-grow-1 text-center text-sm-start">
                                            <h1 className="mb-0">{user?.username || 'Loading...'}</h1>
                                            <p className="text-secondary mb-0">{user?.role || 'User'}</p>
                                        </div>
                                        {!isEditing && (
                                            <button 
                                                className="btn btn-outline-primary d-flex align-items-center gap-2 mb-2"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                <Edit3 size={18} /> Edit Profile
                                            </button>
                                        )}
                                    </div>

                                    {message && (
                                        <div className={`alert mt-4 ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
                                            {message}
                                        </div>
                                    )}

                                    <div className="profile-details-grid mt-5">
                                        {isEditing ? (
                                            <form onSubmit={handleUpdate} className="row g-4">
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold">Username</label>
                                                    <input 
                                                        type="text" 
                                                        className="form-control"
                                                        value={formData.username}
                                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold">Email Address</label>
                                                    <input 
                                                        type="email" 
                                                        className="form-control"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold">New Password (Leave blank to keep current)</label>
                                                    <input 
                                                        type="password" 
                                                        className="form-control"
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold">Confirm Password</label>
                                                    <input 
                                                        type="password" 
                                                        className="form-control"
                                                        value={formData.confirmPassword}
                                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                                    />
                                                </div>
                                                <div className="col-12 d-flex gap-3 mt-4">
                                                    <button type="submit" className="btn btn-primary d-flex align-items-center gap-2 px-4">
                                                        <Save size={18} /> Save Changes
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-outline-secondary d-flex align-items-center gap-2 px-4"
                                                        onClick={() => setIsEditing(false)}
                                                    >
                                                        <X size={18} /> Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="row g-4">
                                                <div className="col-md-6">
                                                    <div className="detail-item p-3 rounded-4 bg-light d-flex align-items-center gap-3">
                                                        <User className="text-primary" />
                                                        <div>
                                                            <div className="text-muted small">Username</div>
                                                            <div className="fw-bold">{user?.username}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="detail-item p-3 rounded-4 bg-light d-flex align-items-center gap-3">
                                                        <Mail className="text-primary" />
                                                        <div>
                                                            <div className="text-muted small">Email Address</div>
                                                            <div className="fw-bold">{user?.email || 'Not set'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="detail-item p-3 rounded-4 bg-light d-flex align-items-center gap-3">
                                                        <Shield className="text-primary" />
                                                        <div>
                                                            <div className="text-muted small">Account Role</div>
                                                            <div className="fw-bold">{user?.role}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="detail-item p-3 rounded-4 bg-light d-flex align-items-center gap-3">
                                                        <Calendar className="text-primary" />
                                                        <div>
                                                            <div className="text-muted small">Member Since</div>
                                                            <div className="fw-bold">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                .profile-header-bg {
                    height: 160px;
                    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                }
                .profile-avatar-overlap {
                    margin-top: -60px;
                }
                .profile-avatar-large {
                    width: 120px;
                    height: 120px;
                    background: white;
                    border: 5px solid white;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    font-weight: 800;
                    color: var(--primary-color);
                    box-shadow: var(--shadow-lg);
                }
                .detail-item {
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }
                .detail-item:hover {
                    border-color: var(--primary-color);
                    background: white !important;
                    box-shadow: var(--shadow-sm);
                }
            `}</style>
        </div>
    );
};

export default Profile;
