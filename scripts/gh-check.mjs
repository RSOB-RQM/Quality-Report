import https from 'https';
const token = 'YOUR_GITHUB_PAT_HERE';
const opts = {
  hostname: 'api.github.com',
  path: '/user',
  headers: {
    'Authorization': 'Bearer ' + token,
    'User-Agent': 'node',
    'Accept': 'application/vnd.github+json'
  }
};
https.get(opts, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const u = JSON.parse(d);
      console.log('Username:', u.login);
      console.log('Name:', u.name);
    } catch(e) {
      console.log('Response:', d.substring(0, 200));
    }
  });
}).on('error', e => console.log('Error:', e.message));

