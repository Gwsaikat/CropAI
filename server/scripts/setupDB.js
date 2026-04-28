require('dotenv').config();
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing env vars. Make sure .env is loaded.');
    process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

const SQL = [
    "CREATE TABLE IF NOT EXISTS public.users (id uuid PRIMARY KEY, name text NOT NULL, region text DEFAULT 'Unknown', state text DEFAULT '', farm_size numeric DEFAULT 0, crops text[] DEFAULT '{}', federated_rounds_participated int DEFAULT 0, role text DEFAULT 'farmer', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());",
    "CREATE TABLE IF NOT EXISTS public.predictions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES public.users(id) ON DELETE CASCADE, disease text NOT NULL, crop text NOT NULL, confidence numeric NOT NULL, top_predictions jsonb DEFAULT '[]', image_hash text, location jsonb DEFAULT '{}', severity text DEFAULT 'medium', model_version text DEFAULT '1.0', inference_time_ms int, shared_for_federated boolean DEFAULT false, created_at timestamptz DEFAULT now());",
    "CREATE TABLE IF NOT EXISTS public.expert_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), farmer_id uuid REFERENCES public.users(id) ON DELETE CASCADE, name text NOT NULL, email text NOT NULL, disease text, message text, prediction_id uuid, status text DEFAULT 'pending', ai_diagnosis text, created_at timestamptz DEFAULT now());",
    "CREATE TABLE IF NOT EXISTS public.federated_rounds (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), round_number int NOT NULL, participants uuid[] DEFAULT '{}', participant_count int DEFAULT 0, weight_deltas jsonb DEFAULT '[]', global_model_accuracy numeric, model_version text, status text DEFAULT 'open', aggregation_method text DEFAULT 'FedAvg', created_at timestamptz DEFAULT now());",
    "ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.expert_requests ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.federated_rounds ENABLE ROW LEVEL SECURITY;",
    "DO $do$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='Service role full access users') THEN CREATE POLICY \"Service role full access users\" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true); END IF; IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='predictions' AND policyname='Service role full access predictions') THEN CREATE POLICY \"Service role full access predictions\" ON public.predictions FOR ALL TO service_role USING (true) WITH CHECK (true); END IF; IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='expert_requests' AND policyname='Service role full access expert_requests') THEN CREATE POLICY \"Service role full access expert_requests\" ON public.expert_requests FOR ALL TO service_role USING (true) WITH CHECK (true); END IF; IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='federated_rounds' AND policyname='Service role full access federated_rounds') THEN CREATE POLICY \"Service role full access federated_rounds\" ON public.federated_rounds FOR ALL TO service_role USING (true) WITH CHECK (true); END IF; END $do$;"
].join('\n');

function runSQL(sql) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query: sql });
        const options = {
            hostname: 'api.supabase.com',
            path: '/v1/projects/' + projectRef + '/database/query',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + SERVICE_KEY,
                'Content-Length': Buffer.byteLength(body),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

(async () => {
    console.log('Setting up Supabase database for project:', projectRef);
    try {
        const result = await runSQL(SQL);
        console.log('HTTP Status:', result.status);
        console.log('Response:', result.body.substring(0, 800));
        if (result.status >= 400) process.exit(1);
        console.log('Done!');
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
