import React, { useState, useEffect } from 'react';
import { fetchBonuses, fetchEmployees, createBonus, updateBonus } from '../api/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import BonusTable from '../components/BonusTable';
import { Coins, Plus, X, UserPlus, Save, DollarSign, Calendar, FileText } from 'lucide-react';
import '../styles/dashboard.css';

const BonusManagement = () => {
    const [bonuses, setBonuses] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentBonus, setCurrentBonus] = useState({
        employee_id: '', bonus_amount: '', bonus_reason: '', date_given: new Date().toISOString().split('T')[0]
    });

    const loadData = async () => {
        try {
            const [bonusRes, empRes] = await Promise.all([
                fetchBonuses(),
                fetchEmployees()
            ]);
            setBonuses(bonusRes.data);
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

    const handleEdit = (bonus) => {
        setCurrentBonus(bonus);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await updateBonus(currentBonus.id, currentBonus);
            } else {
                await createBonus(currentBonus);
            }
            setShowModal(false);
            setCurrentBonus({ employee_id: '', bonus_amount: '', bonus_reason: '', date_given: new Date().toISOString().split('T')[0] });
            setIsEditing(false);
            loadData();
        } catch (err) {
            alert('Error assigning bonus');
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
                        <h1 className="mb-0">Payroll Bonuses</h1>
                        <p className="text-secondary">Track and issue discretionary payments.</p>
                    </div>
                    <button 
                        className="btn-primary-custom d-flex align-items-center gap-2"
                        onClick={() => {
                            setIsEditing(false);
                            setCurrentBonus({ employee_id: '', bonus_amount: '', bonus_reason: '', date_given: new Date().toISOString().split('T')[0] });
                            setShowModal(true);
                        }}
                    >
                        <Plus size={20} />
                        Issue New Bonus
                    </button>
                </div>

                {/* Dashboard Stats Panel */}
                <div className="stats-grid mb-4">
                     <div className="stat-card">
                        <div className="stat-info">
                            <span>Total Distributed</span>
                            <h2>${bonuses.reduce((acc, curr) => acc + curr.bonus_amount, 0).toLocaleString()}</h2>
                        </div>
                        <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                             <Coins size={24} />
                        </div>
                     </div>
                     <div className="stat-card">
                        <div className="stat-info">
                            <span>Awards This Month</span>
                            <h2>{bonuses.filter(b => b.date_given.includes(new Date().toISOString().slice(0, 7))).length}</h2>
                        </div>
                        <div className="stat-icon" style={{ background: '#eef2ff', color: '#6366f1' }}>
                             <DollarSign size={24} />
                        </div>
                     </div>
                </div>

                <div className="table-container">
                    <BonusTable bonuses={bonuses} onEdit={handleEdit} />
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-container p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h1 className="mb-0 fs-3 d-flex align-items-center gap-2">
                                    <Coins color="#6366f1" />
                                    {isEditing ? 'Modify Award' : 'Issue New Award'}
                                </h1>
                                <button className="btn btn-light rounded-circle p-2" onClick={() => setShowModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-12 mb-3">
                                        <label className="form-label d-flex align-items-center gap-2"><UserPlus size={14} /> Recipient</label>
                                        <select 
                                            className="form-select py-3 border-0 bg-light"
                                            value={currentBonus.employee_id}
                                            onChange={(e) => setCurrentBonus({...currentBonus, employee_id: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Employee</option>
                                            {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label d-flex align-items-center gap-2"><DollarSign size={14} /> Amount</label>
                                        <input 
                                            type="number" 
                                            placeholder="500.00"
                                            className="form-control py-3 border-0 bg-light" 
                                            value={currentBonus.bonus_amount}
                                            onChange={(e) => setCurrentBonus({...currentBonus, bonus_amount: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label d-flex align-items-center gap-2"><Calendar size={14} /> Issue Date</label>
                                        <input 
                                            type="date" 
                                            className="form-control py-3 border-0 bg-light" 
                                            value={currentBonus.date_given}
                                            onChange={(e) => setCurrentBonus({...currentBonus, date_given: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="col-12 mb-3">
                                        <label className="form-label d-flex align-items-center gap-2"><FileText size={14} /> Reason/Memo</label>
                                        <textarea 
                                            className="form-control py-3 border-0 bg-light"
                                            rows="3"
                                            value={currentBonus.bonus_reason}
                                            onChange={(e) => setCurrentBonus({...currentBonus, bonus_reason: e.target.value})}
                                            placeholder="Brief description of reward performance"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 d-flex gap-2">
                                    <button type="submit" className="btn-primary-custom flex-grow-1 border-0 d-flex justify-content-center align-items-center gap-2 py-4 rounded-4 shadow-lg hover-scale">
                                        <Save size={20} />
                                        {isEditing ? 'Commit Changes' : 'Confirm Award'}
                                    </button>
                                    <button type="button" className="btn btn-light flex-grow-1 py-4 border rounded-4 d-flex justify-content-center align-items-center gap-2 shadow-sm" onClick={() => setShowModal(false)}>
                                        Discard
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

export default BonusManagement;
