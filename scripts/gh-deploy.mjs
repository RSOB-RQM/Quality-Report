import https from 'https';
import { readFileSync } from 'fs';

const token = 'YOUR_GITHUB_PAT_HERE';
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
  // Step 1: Check if repo exists
  console.log('Checking if repo exists...');
  let res = await apiCall('GET', `/repos/${owner}/${repo}`);
  
  if (res.status === 404) {
    // Create the repo
    console.log('Creating repo...');
    res = await apiCall('POST', '/user/repos', {
      name: repo,
      description: 'RSOB Quality Performance Dashboard - NA & EU',
      private: false, // Must be public for GitHub Pages (free tier)
      has_issues: false,
      has_wiki: false,
      auto_init: false,
    });
    if (res.status !== 201) {
      console.log('Failed to create repo:', res.status, JSON.stringify(res.data).substring(0, 200));
      return;
    }
    console.log('Repo created:', res.data.html_url);
  } else if (res.status === 200) {
    console.log('Repo already exists:', res.data.html_url);
  } else {
    console.log('Error checking repo:', res.status, JSON.stringify(res.data).substring(0, 200));
    return;
  }
  
  // Step 2: Upload index.html
  console.log('\nUploading index.html...');
  const fileContent = readFileSync('dist/index.html');
  const base64Content = fileContent.toString('base64');
  console.log(`File size: ${(fileContent.length / 1024).toFixed(0)} KB`);
  
  // Check if file already exists (to get SHA for update)
  let sha = null;
  res = await apiCall('GET', `/repos/${owner}/${repo}/contents/index.html`);
  if (res.status === 200) {
    sha = res.data.sha;
    console.log('Existing file found, will update (sha:', sha.substring(0, 8) + '...)');
  } else {
    console.log('New file, will create.');
  }
  
  const uploadBody = {
    message: 'Update dashboard - weeks 1-16, 18',
    content: base64Content,
  };
  if (sha) uploadBody.sha = sha;
  
  res = await apiCall('PUT', `/repos/${owner}/${repo}/contents/index.html`, uploadBody);
  if (res.status === 200 || res.status === 201) {
    console.log('\n✅ SUCCESS! Dashboard uploaded!');
    console.log(`URL: https://${owner}.github.io/${repo}/`);
  } else {
    console.log('Upload failed:', res.status, JSON.stringify(res.data).substring(0, 300));
  }
  
  // Step 3: Enable GitHub Pages
  console.log('\nEnabling GitHub Pages...');
  res = await apiCall('POST', `/repos/${owner}/${repo}/pages`, {
    build_type: 'legacy',
    source: { branch: 'main', path: '/' }
  });
  if (res.status === 201 || res.status === 409) {
    console.log('GitHub Pages enabled!');
  } else if (res.status === 422) {
    console.log('Pages already configured or needs manual setup.');
  } else {
    console.log('Pages setup response:', res.status, JSON.stringify(res.data).substring(0, 200));
  }
  
  console.log('\n============================================');
  console.log('Dashboard URL: https://RSOB-RQM.github.io/Quality-Report/');
  console.log('============================================');
}

main().catch(e => console.error('Error:', e.message));

