const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8080;
const htmlPath = path.join(__dirname, 'dashboard.html');
const html = fs.readFileSync(htmlPath);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
  exec(`start http://localhost:${PORT}`);
});
