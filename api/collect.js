import { createClient } from '@supabase/supabase-js'

// These environment variables will be added in your Vercel Dashboard later
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
    // 1. Handle CORS (Cross-Origin Resource Sharing)
    // This allows client websites to send data to your Vercel API
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        try {
            // Parse the data sent by your tracking script
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            
            // Get the visitor's IP address (Vercel provides this in the headers)
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            // Simple Logic: If the script detected a bot, give it a high risk score
            const riskScore = body.is_bot ? 95 : 5;

            // 2. Insert the data into Supabase
            const { data, error } = await supabase
                .from('traffic_logs')
                .insert([
                    {
                        domain: body.domain,
                        path: body.path,
                        ua: body.ua,
                        vp: body.vp,
                        is_bot: body.is_bot,
                        ip: ip,
                        risk_score: riskScore
                    }
                ]);

            if (error) throw error;

            return res.status(200).json({ status: 'success', message: 'Forensic data logged' });
        } catch (err) {
            console.error('Supabase Error:', err.message);
            return res.status(400).json({ status: 'error', message: err.message });
        }
    }

    res.status(405).json({ message: 'Method not allowed' });
}
