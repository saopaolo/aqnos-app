// api/collect.js
export default async function handler(req, res) {
    // 1. Handle CORS (Allow your client's website to send data to your API)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // In production, replace * with the client's domain
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        try {
            const data = JSON.parse(req.body);
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            
            // 2. Simple Heuristic Scoring Engine
            let score = 0;
            let flags = [];

            if (data.is_headless) {
                score += 50;
                flags.push('Headless Browser Detected');
            }
            if (!data.ua || data.ua.includes('Bot') || data.ua.includes('Crawl')) {
                score += 40;
                flags.push('Bot User-Agent');
            }
            if (data.vp === '0x0') {
                score += 30;
                flags.push('Invisible Viewport');
            }

            const auditLog = {
                ...data,
                ip: ip,
                risk_score: score,
                flags: flags,
                received_at: new Date().toISOString()
            };

            // 3. Output for PoC
            // In a full build, you would send this to Supabase or Upstash here.
            console.log('--- NEW FORENSIC CAPTURE ---');
            console.table(auditLog);

            return res.status(200).json({ status: 'success', risk: score });
        } catch (err) {
            return res.status(400).json({ status: 'error', message: err.message });
        }
    }

    res.status(405).json({ message: 'Method not allowed' });
}
