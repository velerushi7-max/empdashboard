import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/api';
import { Building2, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import '../styles/login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Redir if already logged in
        if (localStorage.getItem('token')) {
            navigate('/');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await login({ email: username, password });
            const { token, user } = res.data;
            
            // Save to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">
                    <Building2 size={48} color="#6366f1" />
                </div>
                
                <h1 className="login-title">EmpDash</h1>
                <p className="login-subtitle">Management Console Login</p>

                {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="position-relative">
                            <User size={20} className="position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                type="email"
                                className="login-input px-5"
                                placeholder="admin@example.com"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="position-relative">
                            <Lock size={20} className="position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="login-input px-5"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="position-absolute border-0 bg-transparent"
                                style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        ) : 'Sign In'}
                    </button>
                </form>
                
                <div className="mt-4 text-center">
                    <p className="text-muted small">Default Admin: admin@example.com / admin123</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
