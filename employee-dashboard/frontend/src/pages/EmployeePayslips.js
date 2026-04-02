import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import * as adminApi from '../api/adminApi';
import { 
    DollarSign, Download, Calendar, User, Briefcase, 
    CreditCard, TrendingUp, FileText, CheckCircle, Clock, Info, ShieldCheck
} from 'lucide-react';
import '../styles/dashboard.css';

import { downloadPayslipPDF } from '../utils/generatePayslip';

const EmployeePayslips = () => {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchPayslips = async () => {
            try {
                const res = await adminApi.getEmployeePayslips(user.id);
                setPayslips(res.data);
            } catch (err) {
                console.error('Error fetching payslips:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPayslips();
    }, [user.id]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <div className="app-container">
            <Sidebar />
            <Navbar />
            
            <main className="main-content">
                <header className="mb-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="h3 fw-bold mb-1">💸 My Payslips</h1>
                        <p className="text-secondary">Redesigned professional payslip management system.</p>
                    </div>
                </header>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="loading-spinner"></div>
                    </div>
                ) : (
                    <div className="row g-4">
                        {payslips.length > 0 ? payslips.map(slip => (
                            <div key={slip.id} className="col-12">
                                <div id={`slip-card-${slip.id}`} className="bg-white rounded-4 border shadow-sm overflow-hidden mb-3">
                                    {/* Header Section */}
                                    <div className="p-4 border-bottom bg-light d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="icon-box bg-primary-light">
                                                <Calendar className="text-primary" size={24} />
                                            </div>
                                            <div>
                                                <h4 className="mb-0 fw-bold">{slip.month} {slip.year}</h4>
                                                <span className="text-muted small">Generated on {new Date(slip.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3 text-end">
                                            <div className="me-3">
                                                <span className={`badge rounded-pill d-flex align-items-center gap-1 py-2 px-3 ${slip.status === 'Paid' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>
                                                    {slip.status === 'Paid' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                    {slip.status}
                                                </span>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                                                    <Info size={16} /> View Details
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                                                    onClick={() => downloadPayslipPDF(`slip-card-${slip.id}`, `payslip_${slip.month}_${slip.year}.pdf`)}
                                                >
                                                    <Download size={16} /> Download PDF
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Grid */}
                                    <div className="p-4">
                                        <div className="row g-4">
                                            {/* Employee Section */}
                                            <div className="col-md-3 border-end">
                                                <div className="d-flex align-items-center gap-2 mb-3 text-primary">
                                                    <User size={18} />
                                                    <h6 className="mb-0 fw-bold uppercase small">Employee Details</h6>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="mb-2">
                                                        <label className="text-muted small d-block">Name</label>
                                                        <span className="fw-semibold">{slip.employee_name || user.name}</span>
                                                    </div>
                                                    <div className="mb-2">
                                                        <label className="text-muted small d-block">Employee ID</label>
                                                        <span className="fw-semibold">EMP-{slip.employee_id || user.id}</span>
                                                    </div>
                                                    <div className="mb-2">
                                                        <label className="text-muted small d-block">Department</label>
                                                        <span className="fw-semibold">{slip.department || 'General'}</span>
                                                    </div>
                                                    <div>
                                                        <label className="text-muted small d-block">Reporting Manager</label>
                                                        <span className="fw-semibold">{slip.manager_name || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payslip Details Section */}
                                            <div className="col-md-3 border-end">
                                                <div className="d-flex align-items-center gap-2 mb-3 text-success">
                                                    <CreditCard size={18} />
                                                    <h6 className="mb-0 fw-bold uppercase small">Payment Info</h6>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="mb-2">
                                                        <label className="text-muted small d-block">Payment Method</label>
                                                        <span className="fw-semibold">Bank Transfer</span>
                                                    </div>
                                                    <div className="mb-2">
                                                        <label className="text-muted small d-block">Payment Date</label>
                                                        <span className="fw-semibold">{slip.payment_date ? new Date(slip.payment_date).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                    <div className="mb-2">
                                                        <label className="text-muted small d-block">Pay Period</label>
                                                        <span className="fw-semibold">Monthly ({slip.month})</span>
                                                    </div>
                                                    <div>
                                                        <label className="text-muted small d-block">Status</label>
                                                        <span className={`fw-bold ${slip.status === 'Paid' ? 'text-success' : 'text-warning'}`}>
                                                            {slip.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Salary Breakdown Section */}
                                            <div className="col-md-3 border-end">
                                                <div className="d-flex align-items-center gap-2 mb-3 text-info">
                                                    <Briefcase size={18} />
                                                    <h6 className="mb-0 fw-bold uppercase small">Salary Breakdown</h6>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="text-muted small">Highlights</span>
                                                        <span className="fw-semibold">{formatCurrency(slip.basic_salary)}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="text-muted small">Bonus</span>
                                                        <span className="fw-semibold text-success">+{formatCurrency(slip.bonus)}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="text-muted small">Allowances</span>
                                                        <span className="fw-semibold text-success">+{formatCurrency(slip.allowances)}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="text-muted small">Deductions</span>
                                                        <span className="fw-semibold text-danger">-{formatCurrency(slip.deductions)}</span>
                                                    </div>
                                                    <hr className="my-2" />
                                                    <div className="d-flex justify-content-between">
                                                        <span className="fw-bold">Net Salary</span>
                                                        <span className="fw-bold text-primary">{formatCurrency(slip.net_salary)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Summary Section */}
                                            <div className="col-md-3 bg-primary-light bg-opacity-10 rounded-3 p-3">
                                                <div className="d-flex align-items-center gap-2 mb-3 text-primary">
                                                    <TrendingUp size={18} />
                                                    <h6 className="mb-0 fw-bold uppercase small">Earnings Summary</h6>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="text-muted small d-block mb-1">Total Earnings</label>
                                                    <h5 className="fw-bold text-success">{formatCurrency((slip.basic_salary || 0) + (slip.bonus || 0) + (slip.allowances || 0))}</h5>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="text-muted small d-block mb-1">Total Deductions</label>
                                                    <h5 className="fw-bold text-danger">{formatCurrency(slip.deductions)}</h5>
                                                </div>
                                                <div className="mt-4 pt-3 border-top border-primary border-opacity-25">
                                                    <label className="text-primary small d-block mb-1 fw-bold">FINAL PAYABLE AMOUNT</label>
                                                    <h3 className="fw-extrabold text-primary mb-0">{formatCurrency(slip.net_salary)}</h3>
                                                    <div className="mt-1 d-flex align-items-center gap-1 text-primary small opacity-75">
                                                        <ShieldCheck size={14} /> Legally Verified
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-12 text-center py-5">
                                <div className="p-5 bg-white rounded-4 border shadow-sm">
                                    <FileText size={64} className="text-light mb-3" />
                                    <h3 className="text-muted">No Payslips Available</h3>
                                    <p className="text-secondary">Your monthly payslips will appear here once they are generated by the admin.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default EmployeePayslips;
