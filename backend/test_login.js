async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin@123'
      })
    });
    const data = await res.json();
    console.log('Login result:', data);
  } catch (err) {
    console.log('Login failed:', err.message);
  }
}
test();
