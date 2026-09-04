import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const run = async () => {
  const base = 'http://localhost:5000';
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  }).then((r) => r.json());
  const token = login.data?.token;
  if (!token) {
    console.log('LOGIN FAILED:', JSON.stringify(login).slice(0, 200));
    process.exit(1);
  }
  console.log('login ok');

  const form = new FormData();
  form.append(
    'file',
    new Blob([Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex')], { type: 'image/png' }),
    'test.png'
  );
  form.append('metadata', JSON.stringify({ category: 'about', altText: 'test' }));
  const up = await fetch(`${base}/api/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  console.log('upload status:', up.status);
  console.log('upload body:', (await up.text()).slice(0, 400));
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


