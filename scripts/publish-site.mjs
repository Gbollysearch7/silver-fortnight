#!/usr/bin/env node
/**
 * Publish Webflow Site to Live Domain
 * Publishes TradersYard Blog v2 to blog.tradersyard.com
 */

import { CMS_API_KEY } from '../lib/config.mjs';

const SITE_ID = '68fa557c6e6c4fcedde84957'; // TradersYard Blog v2
const DOMAIN_ID = '692da81cc61534ecfa9d0296'; // blog.tradersyard.com

const headers = {
  'Authorization': `Bearer ${CMS_API_KEY}`,
  'Content-Type': 'application/json',
  'accept': 'application/json',
};

console.log('🚀 Publishing Webflow site to live domain...');
console.log(`   Site: TradersYard Blog v2`);
console.log(`   Domain: blog.tradersyard.com\n`);

const publishUrl = `https://api.webflow.com/v2/sites/${SITE_ID}/publish`;

try {
  const res = await fetch(publishUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customDomains: [DOMAIN_ID] // Domain ID required for v2 API
    })
  });

  if (res.ok || res.status === 202) {
    const data = await res.json();
    console.log('✅ Site published successfully!');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n🌐 Live at: https://blog.tradersyard.com');
  } else {
    const text = await res.text();
    console.log(`❌ Publish failed: ${res.status}`);
    console.log(text);
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
