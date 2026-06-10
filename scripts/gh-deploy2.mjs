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
        'Authorization': 'token ' + token,
        'User-Agent': 'node',
        'Accept': 'application/vnd.github+json',
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
  // Verify token
  console.log('Verifying token...');
  let res = await apiCall('GET', '/user');
  if (res.status !== 200) {
    console.log('Token invalid:', res.status, JSON.stringify(res.data).substring(0, 200));
    return;
  }
  console.log('Authenticated as:', res.data.login);

  // Check if repo exists
  console.log('\nChecking repo...');
  res = await apiCall('GET', `/repos/${owner}/${repo}`);
  
  if (res.status === 404) {
    console.log('Creating repo...');
    res = await apiCall('POST', '/user/repos', {
      name: repo,
      description: 'RSOB Quality Performance Dashboard - NA & EU',
      private: false,
      has_issues: false,
      has_wiki: false,
      auto_init: false,
    });
    if (res.status !== 201) {
      console.log('Failed to create repo:', res.status, JSON.stringify(res.data).substring(0, 300));
      return;
    }
    console.log('Repo created:', res.data.html_url);
  } else if (res.status === 200) {
    console.log('Repo exists:', res.data.html_url);
  } else {
    console.log('Error:', res.status, JSON.stringify(res.data).substring(0, 200));
    return;
  }

  // Upload index.html
  console.log('\nUploading index.html...');
  const fileContent = readFileSync('dist/index.html');
  const base64Content = fileContent.toString('base64');
  console.log(`File size: ${(fileContent.length / 1024).toFixed(0)} KB`);

  // Check if file exists (get SHA for update)
  let sha = null;
  res = await apiCall('GET', `/repos/${owner}/${repo}/contents/index.html`);
  if (res.status === 200) {
    sha = res.data.sha;
    console.log('Updating existing file...');
  } else {
    console.log('Creating new file...');
  }

  const uploadBody = {
    message: 'Update dashboard - weeks 1-16, 18 data',
    content: base64Content,
  };
  if (sha) uploadBody.sha = sha;

  res = await apiCall('PUT', `/repos/${owner}/${repo}/contents/index.html`, uploadBody);
  if (res.status === 200 || res.status === 201) {
    console.log('✅ File uploaded successfully!');
  } else {
    console.log('Upload failed:', res.status, JSON.stringify(res.data).substring(0, 300));
    return;
  }

  // Enable GitHub Pages
  console.log('\nEnabling GitHub Pages...');
  res = await apiCall('GET', `/repos/${owner}/${repo}/pages`);
  if (res.status === 200) {
    console.log('Pages already enabled.');
  } else {
    res = await apiCall('POST', `/repos/${owner}/${repo}/pages`, {
      build_type: 'legacy',
      source: { branch: 'main', path: '/' }
    });
    if (res.status === 201) {
      console.log('Pages enabled!');
    } else {
      console.log('Pages setup:', res.status, '- You may need to enable it manually in repo Settings > Pages');
    }
  }

  console.log('\n============================================');
  console.log('  ✅ DEPLOYMENT COMPLETE!');
  console.log('  Dashboard URL: https://RSOB-RQM.github.io/Quality-Report/');
  console.log('  (May take 1-2 minutes to go live)');
  console.log('============================================');
}

main().catch(e => console.error('Error:', e.message));


