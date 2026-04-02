import React from 'react';
import { Coins, Calendar, Gift, FileText } from 'lucide-react';

const BonusTable = ({ bonuses }) => {
    return (
        <div className="table-responsive">
            <table className="custom-table">
                <thead>
                    <tr>
                        <th className="px-4">Employee</th>
                        <th>Amount</th>
                        <th>Reason</th>
                        <th>Awarded On</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {bonuses.map((bonus) => (
                        <tr key={bonus.id}>
                            <td className="px-4">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="user-avatar" style={{ height: '32px', width: '32px' }}>
                                        {bonus.employee_name?.charAt(0)}
                                    </div>
                                    <span className="fw-600">{bonus.employee_name}</span>
                                </div>
                            </td>
                            <td>
                                <div className="d-flex align-items-center fw-700 text-success">
                                    <Coins size={16} className="me-2" />
                                    ${bonus.bonus_amount.toLocaleString()}
                                </div>
                            </td>
                            <td>
                                <div className="text-truncate d-flex align-items-center gap-2" style={{ maxWidth: '200px' }} title={bonus.bonus_reason}>
                                    <FileText size={14} className="text-muted" />
                                    {bonus.bonus_reason}
                                </div>
                            </td>
                            <td>
                                <div className="d-flex align-items-center small text-muted">
                                    <Calendar size={14} className="me-2 text-primary" />
                                    {bonus.date_given}
                                </div>
                            </td>
                            <td>
                                <div className="badge badge-success">
                                    <Gift size={12} className="me-1" />
                                    Distributed
                                </div>
                            </td>
                        </tr>
                    ))}
                    {bonuses.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center py-5 text-muted">
                                No bonuses distributed yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default BonusTable;
