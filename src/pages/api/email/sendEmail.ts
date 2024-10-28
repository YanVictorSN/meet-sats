import nodemailer from 'nodemailer';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { email, subject, message, qrCode } = req.body;

        if (!email || !subject || !message || !qrCode) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #ffffff; color: #333333; text-align: center; padding: 20px;">
            <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" alt="Bitcoin Logo" style="width: 100px; margin-bottom: 20px;">
            <h1 style="font-size: 36px; color: #f7931a; margin-bottom: 20px;">${subject}</h1>
            <p style="font-size: 24px; font-weight: bold; color: #f7931a; margin: 10px 0;">MeetSats</p>
            <p style="font-size: 20px; margin: 10px 0; color: #4caf50;">${message}</p>
            <p style="font-size: 24px; font-weight: bold; color: #f7931a; margin: 10px 0;">Scan the attached QR code with a Lightning Address.</p>
        </body>
        </html>`;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: subject,
                html: htmlContent,
                attachments: [
                    {
                        filename: 'qrcode.png',
                        content: qrCode.split(",")[1],
                        encoding: 'base64',
                    },
                ],
            });

            console.log("QR Code enviado:", qrCode);
            return res.status(200).json({ message: 'E-mail enviado com sucesso!' });
        } catch (error) {
            console.error("Erro ao enviar o e-mail:", error);
            return res.status(500).json({ error: 'Erro ao enviar o e-mail.' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Método ${req.method} não permitido.`);
    }
}
