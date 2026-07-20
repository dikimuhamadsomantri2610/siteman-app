const axios = require('axios');

async function run() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('Login successful, token obtained.');

        console.log('Fetching dashboard stats...');
        const statsRes = await axios.get('http://localhost:5000/api/dashboard/stats', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log('Response status:', statsRes.status);
        console.log('Response keys:', Object.keys(statsRes.data));
        console.log('Meta object:', statsRes.data.meta);
    } catch (err) {
        console.error('Error occurred:', err.response ? err.response.data : err.message);
    }
}

run();
