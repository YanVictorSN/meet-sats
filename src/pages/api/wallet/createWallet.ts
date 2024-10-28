import type { NextApiRequest, NextApiResponse } from 'next';

async function createLNbitsWallet(name: string) {
  const LNBITS_URL = process.env.LNBITS_URL!;
  const LNBITS_ADMIN_KEY = process.env.LNBITS_ADMIN_KEY!;

  try {
    const response = await fetch(`${LNBITS_URL}/api/v1/wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': LNBITS_ADMIN_KEY,
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      wallet: {
        id: data.id,
        name: data.name,
        adminKey: data.adminkey,
        invoiceKey: data.inkey,
        balance: 0,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Um erro desconhecido ocorreu.';
    console.error('Erro ao criar wallet:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'O nome é obrigatório e deve ser uma string.' });
    }

    const result = await createLNbitsWallet(name);
    res.status(result.success ? 200 : 500).json(result);
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} não permitido.`);
  }
}
