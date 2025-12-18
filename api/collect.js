import { createClient } from '@supabase/supabase-js'

// Environment variables from Vercel Settings
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
    // 1. Handle CORS - Allows any client website to talk to your API
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
            // Parse the data sent by the tracker
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            
            // Get the visitor's IP address from Vercel headers
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            // 2. Forensic Logic / Risk Scoring
            // We default to a low score, then increase it if red flags are found
            let riskScore = 5; 
            if (body.is_bot) riskScore = 95;
            
            // Check if the viewport is '0x0' (common bot indicator)
            if (body.vp === '0x0') riskScore = 100;

            // 3. Insert into Supabase with unique Client ID provisioning
            const { data, error } = await supabase
                .from('traffic_logs')
                .insert([
                    {
                        client_id: body.client_id || 'unassigned', // Stores the unique client ID
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

            return res.status(200).json({ 
                status: 'success', 
                received_for: body.client_id 
            });

        } catch (err) {
            console.error('Data Error:', err.message);
            return res.status(400).json({ status: 'error', message: err.message });
        }
    }

    res.status(405).json({ message: 'Method not allowed' });
}
