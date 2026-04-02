const leaveController = require('./controllers/leaveController');
const managerController = require('./controllers/managerController');

// Mock req/res
const empReq = { user: { id: 3, role: 'Employee' }, body: { 
    leave_type: 'Annual', 
    start_date: '2026-03-26', 
    end_date: '2026-03-27', 
    reason: 'Test holiday' 
} };

const mgrReq = { user: { id: 2, role: 'Manager' }, body: {} };

const res = {
    json: (data) => console.log('Response JSON:', JSON.stringify(data, null, 2)),
    status: (code) => {
        console.log('Response Status:', code);
        return { json: (data) => console.log('Response Error JSON:', JSON.stringify(data, null, 2)) };
    }
};

console.log('--- Step 1: Employee Applies for Leave ---');
leaveController.applyLeave(empReq, res);

setTimeout(() => {
    console.log('\n--- Step 2: Manager Fetches Team Leaves ---');
    managerController.getTeamLeaves(mgrReq, res);
}, 1000);

setTimeout(() => {
    console.log('\n--- Step 3: Manager Approves Leave (ID 1) ---');
    mgrReq.body = { leaveId: 1, status: 'Approved' };
    managerController.handleLeaveAction(mgrReq, res);
}, 2000);

setTimeout(() => {
    console.log('\n--- Step 4: Employee Verifies Status ---');
    leaveController.getPersonalLeaves(empReq, res);
}, 3000);

setTimeout(() => {
    process.exit(0);
}, 4000);
