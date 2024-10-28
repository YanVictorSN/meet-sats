import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email }: { email: string } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required and must be a string.' });
    }

    try {
      const { data, error } = await supabase
        .from('userwallets')
        .select('*')
        .eq('email', email);

      if (error) {
        throw error;
      }

      return res.status(200).json({ exists: data.length > 0, user: data[0] || null });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(400).json({ error: errorMessage });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

