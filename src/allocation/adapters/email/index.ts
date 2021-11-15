import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { CONFIG } from '../../config';

const transporter = nodemailer.createTransport({
  host: CONFIG.EMAIL.HOST,
  port: CONFIG.EMAIL.PORT,
  secure: false
});

export const send = async (email: Mail.Options): Promise<void> => {
  await transporter.sendMail(email);
};
