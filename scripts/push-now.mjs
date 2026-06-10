import https from 'https';
import { readFileSync } from 'fs';

const token = 'YOUR_GITHUB_TOKEN_HERE';
const owner = 'RSOB-RQM';
const repo = 'Quality-Report';

function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'User-Agent': 'node',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }
    };
    if (body) opts.headers['Content-Type'] = 'application/json';
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('Pushing updated dashboard with Week-19 & Week-20 data...');
  const fileContent = readFileSync('dist/index.html');
  const base64Content = fileContent.toString('base64');
  console.log(`File size: ${(fileContent.length / 1024).toFixed(0)} KB`);

  // Get existing file SHA
  let sha = null;
  let res = await apiCall('GET', `/repos/${owner}/${repo}/contents/index.html`);
  if (res.status === 200) {
    sha = res.data.sha;
    console.log('Existing file found, SHA:', sha.substring(0, 8));
  } else {
    console.log('No existing file, will create new.');
  }

  const body = {
    message: 'Update dashboard: Add Week-19 & Week-20 audit data + Escalations tab',
    content: base64Content
  };
  if (sha) body.sha = sha;

  res = await apiCall('PUT', `/repos/${owner}/${repo}/contents/index.html`, body);
  if (res.status === 200 || res.status === 201) {
    console.log('✅ Deployed! https://RSOB-RQM.github.io/Quality-Report/');
    console.log('(May take 1-2 minutes for GitHub Pages to update)');
  } else {
    console.log('Failed:', res.status);
    console.log(JSON.stringify(res.data).substring(0, 500));
  }
}
main().catch(e => console.error(e.message));


