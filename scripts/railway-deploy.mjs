#!/usr/bin/env node

/**
 * Railway Deployment via API
 * Creates Railway project and configures environment variables
 */

import https from 'https';
import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('\n🚂 Railway Deployment\n');

// Railway API endpoint
const RAILWAY_API = 'https://backboard.railway.app/graphql/v2';

// Step 1: Initiate device login
const initiateDeviceLogin = () => {
  return new Promise((resolve, reject) => {
    const query = `
      mutation {
        deviceLogin {
          code
          url
        }
      }
    `;

    const postData = JSON.stringify({ query });

    const options = {
      hostname: 'backboard.railway.app',
      path: '/graphql/v2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.errors) {
            reject(new Error(result.errors[0].message));
          } else {
            resolve(result.data.deviceLogin);
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

// Step 2: Poll for authentication
const pollForAuth = (deviceCode) => {
  return new Promise((resolve, reject) => {
    const poll = () => {
      const query = `
        query {
          deviceLoginStatus(code: "${deviceCode}") {
            token
            status
          }
        }
      `;

      const postData = JSON.stringify({ query });

      const options = {
        hostname: 'backboard.railway.app',
        path: '/graphql/v2',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);

            if (result.errors) {
              reject(new Error(result.errors[0].message));
              return;
            }

            const status = result.data.deviceLoginStatus;

            if (status.status === 'PENDING') {
              setTimeout(poll, 3000); // Poll every 3 seconds
            } else if (status.status === 'VERIFIED' && status.token) {
              resolve(status.token);
            } else {
              reject(new Error('Authentication failed'));
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

// Step 3: Create Railway project
const createProject = (token, githubRepo) => {
  return new Promise((resolve, reject) => {
    const query = `
      mutation {
        projectCreate(input: {
          name: "TY Blog Automation"
          description: "Autonomous SEO content generation and publishing"
        }) {
          id
          name
        }
      }
    `;

    const postData = JSON.stringify({ query });

    const options = {
      hostname: 'backboard.railway.app',
      path: '/graphql/v2',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.errors) {
            reject(new Error(result.errors[0].message));
          } else {
            resolve(result.data.projectCreate);
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

// Step 4: Set environment variables
const setEnvironmentVariables = (token, projectId) => {
  return new Promise((resolve, reject) => {
    // Read .env file
    const envPath = resolve(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');

    // Parse environment variables
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !line.startsWith('#')) {
        const key = match[1].trim();
        const value = match[2].trim();

        // Critical variables only
        const criticalVars = [
          'CLAUDE_API_KEY',
          'OPENAI_API_KEY',
          'WEBFLOW_API_KEY',
          'FAL_KEY',
          'RESEND_API_KEY',
          'REPORT_EMAIL',
          'GA_PROPERTY_ID',
          'GSC_SITE_URL'
        ];

        if (criticalVars.includes(key)) {
          envVars[key] = value;
        }
      }
    });

    // Add Google Service Account JSON
    try {
      const googleAccountPath = resolve(process.cwd(), 'data/google-service-account.json');
      const googleAccount = readFileSync(googleAccountPath, 'utf-8');
      envVars.GOOGLE_SERVICE_ACCOUNT_JSON = googleAccount;
    } catch (e) {
      console.warn('⚠️  Warning: Could not read Google service account JSON');
    }

    console.log('\n📋 Environment variables to set:');
    Object.keys(envVars).forEach(key => {
      console.log(`   ✓ ${key}`);
    });

    console.log('\n⚠️  Manual step required:');
    console.log('   Go to Railway dashboard and add these variables manually');
    console.log('   (GraphQL API doesn\'t support env var mutations yet)\n');

    resolve(envVars);
  });
};

// Main execution
(async () => {
  try {
    // Step 1: Initiate device login
    console.log('Starting Railway authentication...\n');
    const deviceLogin = await initiateDeviceLogin();

    console.log('✅ Device login initiated!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 CLICK THIS LINK TO AUTHORIZE:\n');
    console.log(`   ${deviceLogin.url}\n`);
    console.log(`📋 CODE: ${deviceLogin.code}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⏳ Waiting for authorization...\n');

    // Step 2: Wait for authentication
    const token = await pollForAuth(deviceLogin.code);
    console.log('✅ Authentication successful!\n');

    // Step 3: Create project
    console.log('📦 Creating Railway project...\n');
    const project = await createProject(token);

    console.log('✅ Project created successfully!\n');
    console.log(`   Name: ${project.name}`);
    console.log(`   ID: ${project.id}\n`);

    // Step 4: Get environment variables
    const envVars = await setEnvironmentVariables(token, project.id);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ SUCCESS! Railway project created!\n');
    console.log('Next steps:\n');
    console.log('1. Go to: https://railway.app/dashboard');
    console.log('2. Open your "TY Blog Automation" project');
    console.log('3. Click "Deploy from GitHub repo"');
    console.log('4. Select your GitHub repository');
    console.log('5. Add environment variables (listed above)');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Fallback: Deploy manually at https://railway.app\n');
    process.exit(1);
  }
})();
