#!/usr/bin/env node

/**
 * GitHub Device Flow Authentication & Repo Creation
 * Initiates OAuth device flow for GitHub authentication
 */

import https from 'https';
import { spawn } from 'child_process';

const CLIENT_ID = '178c6fc778ccc68e1d6f'; // GitHub OAuth App for CLI tools

console.log('\n🔐 GitHub Authentication\n');
console.log('Starting device flow authentication...\n');

// Step 1: Request device code
const requestDeviceCode = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      client_id: CLIENT_ID,
      scope: 'repo,workflow'
    });

    const options = {
      hostname: 'github.com',
      path: '/login/device/code',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

// Step 2: Poll for access token
const pollForToken = (deviceCode, interval) => {
  return new Promise((resolve, reject) => {
    const poll = () => {
      const postData = JSON.stringify({
        client_id: CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      });

      const options = {
        hostname: 'github.com',
        path: '/login/oauth/access_token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': postData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);

            if (result.error === 'authorization_pending') {
              // Keep polling
              setTimeout(poll, interval * 1000);
            } else if (result.error) {
              reject(new Error(result.error_description || result.error));
            } else if (result.access_token) {
              resolve(result.access_token);
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    };

    poll();
  });
};

// Step 3: Create repository
const createRepo = (token, repoName) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: repoName,
      description: 'TradersYard Blog Automation - Autonomous SEO content generation and publishing',
      private: false,
      auto_init: false
    });

    const options = {
      hostname: 'api.github.com',
      path: '/user/repos',
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TradersYard-Blog-Automation',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 201) {
            resolve(result);
          } else {
            reject(new Error(result.message || 'Failed to create repository'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

// Step 4: Push to remote
const pushToRemote = (remoteUrl) => {
  return new Promise((resolve, reject) => {
    console.log('\n📤 Pushing code to GitHub...\n');

    const commands = [
      `git remote add origin ${remoteUrl}`,
      `git branch -M main`,
      `git push -u origin main`
    ];

    const execCommand = (index) => {
      if (index >= commands.length) {
        resolve();
        return;
      }

      const [cmd, ...args] = commands[index].split(' ');
      const proc = spawn(cmd, args, {
        cwd: process.cwd(),
        stdio: 'inherit'
      });

      proc.on('close', (code) => {
        if (code === 0) {
          execCommand(index + 1);
        } else {
          reject(new Error(`Command failed: ${commands[index]}`));
        }
      });

      proc.on('error', reject);
    };

    execCommand(0);
  });
};

// Main execution
(async () => {
  try {
    // Step 1: Get device code
    const deviceFlow = await requestDeviceCode();

    console.log('✅ Device code received!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 CLICK THIS LINK TO AUTHORIZE:\n');
    console.log(`   ${deviceFlow.verification_uri}\n`);
    console.log(`📋 ENTER THIS CODE:\n`);
    console.log(`   ${deviceFlow.user_code}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⏳ Waiting for authorization (timeout in 15 minutes)...\n');

    // Step 2: Wait for token
    const token = await pollForToken(deviceFlow.device_code, deviceFlow.interval);
    console.log('✅ Authentication successful!\n');

    // Step 3: Create repository
    console.log('📦 Creating GitHub repository...\n');
    const repo = await createRepo(token, 'ty-blog-automation');

    console.log('✅ Repository created successfully!\n');
    console.log(`   Name: ${repo.name}`);
    console.log(`   URL: ${repo.html_url}`);
    console.log(`   Clone URL: ${repo.clone_url}\n`);

    // Step 4: Push code
    await pushToRemote(repo.clone_url);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ SUCCESS! Code pushed to GitHub!\n');
    console.log(`   Repository: ${repo.html_url}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Next step: Deploy on Railway');
    console.log('Run: node scripts/railway-deploy.mjs\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
