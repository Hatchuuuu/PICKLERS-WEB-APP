const axios = require('axios');
const fs = require('fs');
const path = require('path');

const logos = [
    { name: 'wilson', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Wilson_Sporting_Goods_logo.svg' },
    { name: 'franklin', url: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Franklin_Sports_logo.svg' },
    { name: 'head', url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Head_Logo.svg' },
    { name: 'gearbox', url: 'https://gearboxsports.com/cdn/shop/t/172/assets/logo.png' },
    { name: 'honolulu', url: 'https://honolulupickleballcompany.com/cdn/shop/files/HPC_Logo_Primary_Dark_Navy_fc8b7a61-1d54-4eb9-83bc-22765899c70a.png' }
];

const outDir = path.join(__dirname, '../FRONTEND/public/brand-logos');

async function download(name, url) {
    try {
        const ext = url.includes('.svg') ? '.svg' : '.png';
        const finalPath = path.join(outDir, `${name}${ext}`);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
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
    for (const logo of logos) {
        await download(logo.name, logo.url);
        console.log(`Downloaded ${logo.name}`);
    }
}

run();
