import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


async function addWalletToSupabase(walletData: {
    name: string,
    email: string, 
    address: string,
    adminKey: string,
    invoiceKey: string,
  }) {
    const { data, error } = await supabase
      .from('userwallets') 
      .insert([
        {
        name: walletData.name,
        email: walletData.email, 
        address: walletData.address,
        adminKey: walletData.adminKey,
        invoiceKey: walletData.invoiceKey,
        }
      ]);
  
    if (error) {
      console.error('Erro ao inserir dados no Supabase:', error);
      return { success: false, error: error.message };
    } else {
      return { success: true, data };
    }
  }
  
  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
      const { adminKey, address, invoiceKey, name, email } = req.body;
      console.log(adminKey, address, invoiceKey, name, email)
  
      const result = await addWalletToSupabase({ adminKey, address, invoiceKey, name, email });
      if (result.success) {
        res.status(200).json(result.data);
      } else {
        res.status(500).json({ error: result.error });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }