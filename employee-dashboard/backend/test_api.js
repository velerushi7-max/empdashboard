async function test() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'manager', password: 'manager123' })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));
        
        console.log('Login successful');
        const token = loginData.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        const teamRes = await fetch('http://localhost:5000/api/manager/team', { headers });
        const teamData = await teamRes.json();
        console.log('Team fetch:', teamRes.ok ? 'Success' : 'Failed', teamData.length, 'members');
        console.log(JSON.stringify(teamData, null, 2));

        const attRes = await fetch('http://localhost:5000/api/manager/attendance', { headers });
        const attData = await attRes.json();
        console.log('Attendance fetch:', attRes.ok ? 'Success' : 'Failed', attData.message || '');
    } catch (e) {
        console.log('Test failed:', e.message);
    }
}
test();
