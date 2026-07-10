const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');

const brands = [
  { label: "JOOLA", domain: "joolausa.com" },
  { label: "Selkirk", domain: "selkirk.com" },
  { label: "Six Zero", domain: "sixzeropickleball.com" },
  { label: "CRBN", domain: "crbnpickleball.com" },
  { label: "Wilson", domain: "wilson.com" },
  { label: "Gearbox", domain: "gearboxsports.com" },
  { label: "Vatic Pro", domain: "vaticpro.com" },
  { label: "Pelago", domain: "pelagosports.com" },
  { label: "Palakol Performance", domain: "palakolphilippines.com" },
  { label: "Bread & Butter", domain: "bnbpickleball.com" },
  { label: "Honolulu Pickleball Co.", domain: "honolulupickleballcompany.com" },
  { label: "Holbrook", domain: "holbrookpickleball.com" },
  { label: "11SIX24", domain: "11six24.com" },
  { label: "Franklin", domain: "franklinsports.com" },
  { label: "Head", domain: "head.com" },
  { label: "Black Knight", domain: "blackknight.ca" },
  { label: "Questor", domain: "olympicvillageunited.com" },
  { label: "Tecnifibre", domain: "tecnifibre.com" },
  { label: "Mizuno", domain: "mizunousa.com" },
  { label: "Volair", domain: "volair.com" }
];

const outDir = path.join(__dirname, '../FRONTEND/public/brand-logos');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function findLogo(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            },
            timeout: 8000,
            httpsAgent
        });
        const $ = cheerio.load(response.data);
        let logoUrl = null;

        // Try to find SVG or PNG in header
        $('header img, .header img, [class*="header"] img, [id*="header"] img, [class*="logo"] img, img[alt*="logo" i], img[src*="logo" i]').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            if (src && (src.includes('.svg') || src.includes('.png') || src.includes('logo'))) {
                logoUrl = src;
                return false; // break
            }
        });

        if (logoUrl) {
            if (logoUrl.startsWith('//')) {
                logoUrl = 'https:' + logoUrl;
            } else if (logoUrl.startsWith('/')) {
                const urlObj = new URL(url);
                logoUrl = urlObj.origin + logoUrl;
            } else if (!logoUrl.startsWith('http')) {
                const urlObj = new URL(url);
                logoUrl = urlObj.origin + '/' + logoUrl;
            }
            return logoUrl;
        }
    } catch (err) {
        console.error(`Failed to fetch ${url}: ${err.message}`);
    }
    return null;
}

async function downloadLogo(url, filename) {
    try {
        const ext = url.includes('.svg') ? '.svg' : '.png';
        const finalPath = path.join(outDir, filename + ext);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            httpsAgent
        });
        
        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(finalPath);
            response.data.pipe(writer);
            writer.on('finish', () => resolve(`/brand-logos/${filename}${ext}`));
            writer.on('error', reject);
        });
    } catch (err) {
        console.error(`Failed to download ${url}: ${err.message}`);
        return null;
    }
}

async function run() {
    const results = [];
    for (const brand of brands) {
        console.log(`Checking ${brand.label}...`);
        const domainUrl = `https://${brand.domain}`;
        let logoUrl = await findLogo(domainUrl);
        if (!logoUrl) {
            logoUrl = `https://logo.clearbit.com/${brand.domain}`;
        }
        console.log(`Found logo for ${brand.label}: ${logoUrl}`);
        
        let localPath = null;
        if (logoUrl) {
            localPath = await downloadLogo(logoUrl, brand.label.toLowerCase().replace(/[\s&]+/g, '-').replace(/[^a-z0-9-]/g, ''));
        }
        
        results.push({
            label: brand.label,
            logoUrl: localPath || `https://logo.clearbit.com/${brand.domain}?size=100`
        });
    }

    fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(results, null, 2));
    console.log('Done! Results written to results.json');
}

run();
