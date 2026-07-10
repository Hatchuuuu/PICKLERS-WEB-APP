const axios = require('axios');
const fs = require('fs');
const path = require('path');

const domains = {
    wilson: 'wilson.com',
    franklin: 'franklinsports.com',
    head: 'head.com',
    gearbox: 'gearboxsports.com',
    honolulu: 'honolulupickleballcompany.com'
};

const outDir = path.join(__dirname, '../FRONTEND/public/brand-logos');

async function download(name, domain) {
    try {
        const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
        const finalPath = path.join(outDir, `${name}.png`);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000
        });
        
        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(finalPath);
            response.data.pipe(writer);
            writer.on('finish', () => resolve(true));
            writer.on('error', reject);
        });
    } catch (e) {
        console.error(`Failed ${name}:`, e.message);
    }
}

async function run() {
    for (const [name, domain] of Object.entries(domains)) {
        await download(name, domain);
        console.log(`Downloaded ${name} from Google Favicons`);
    }
}

run();
