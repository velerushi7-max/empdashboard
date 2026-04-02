const managerController = require('./controllers/managerController');

// Mock req/res
const req = { user: { id: 2, role: 'Manager' }, body: {} };
const res = {
    json: (data) => console.log('Response JSON:', JSON.stringify(data, null, 2)),
    status: (code) => {
        console.log('Response Status:', code);
        return { json: (data) => console.log('Response Error JSON:', JSON.stringify(data, null, 2)) };
    }
};

console.log('--- Testing getTeam ---');
managerController.getTeam(req, res);

setTimeout(() => {
    console.log('\n--- Testing getTeamLeaves ---');
    managerController.getTeamLeaves(req, res);
}, 500);

setTimeout(() => {
    console.log('\n--- Testing getTeamProductivity ---');
    managerController.getTeamProductivity(req, res);
}, 1000);

setTimeout(() => {
    process.exit(0);
}, 2000);
