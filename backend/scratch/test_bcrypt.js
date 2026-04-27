const bcrypt = require('bcryptjs');

async function test() {
  const password = 'Admin@123';
  const rounds = 12;
  
  console.log('Hashing password...');
  const hash = await bcrypt.hash(password, rounds);
  console.log('Hash:', hash);
  
  console.log('Comparing password...');
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Match:', isMatch);
  
  const isWrongMatch = await bcrypt.compare('wrongpassword', hash);
  console.log('Wrong Match:', isWrongMatch);
}

test();
