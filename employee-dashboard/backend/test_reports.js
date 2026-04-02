const activityController = require('./controllers/activityController');

// Mock req/res
const req = { user: { id: 3, role: 'Employee' } };
const res = {
    json: (data) => console.log('Response JSON:', JSON.stringify(data, null, 2)),
    status: (code) => {
        console.log('Response Status:', code);
        return { json: (data) => console.log('Response Error JSON:', JSON.stringify(data, null, 2)) };
    }
};

console.log('--- Testing getPersonalReports ---');
activityController.getPersonalReports(req, res);

setTimeout(() => {
    process.exit(0);
}, 2000);
