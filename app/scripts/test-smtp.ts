
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const host = process.env.EMAIL_SERVER_HOST;
const port = parseInt(process.env.EMAIL_SERVER_PORT || '587');
const user = process.env.EMAIL_SERVER_USER;
const pass = process.env.EMAIL_SERVER_PASSWORD;
const from = process.env.EMAIL_FROM || 'noreply@escalafin.com';

async function testSMTP() {
  console.log('--- DIAGNÓSTICO SMTP ---');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`user: ${user}`);
  console.log('------------------------');

  if (!host || !user || !pass) {
    console.error('❌ Faltan variables de entorno en el archivo .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    auth: { user, pass },
    secure: port === 465,
    connectionTimeout: 10000, // 10s timeout
  });

  try {
    console.log('⏳ Probando conexión con el servidor...');
    await transporter.verify();
    console.log('✅ Conexión con SMTP exitosa.');

    console.log('⏳ Enviando correo de prueba a edwinzs@icloud.com...');
    const info = await transporter.sendMail({
      from: `EscalaFin Test <${from}>`,
      to: 'edwinzs@icloud.com', // Enviamos el test a la dirección externa proporcionada
      subject: 'Prueba de Conexión SMTP - EscalaFin',
      text: 'Este es un correo automático para validar la configuración de tu servidor SMTP en EscalaFin.',
      html: '<h1>✅ SMTP Funcionando</h1><p>Si recibes este correo, la configuración de <strong>EscalaFin</strong> es correcta.</p>'
    });

    console.log(`✅ Correo enviado correctamente: ${info.messageId}`);
  } catch (error: any) {
    console.error('❌ ERROR AL CONECTAR O ENVIAR:');
    if (error.code === 'ETIMEDOUT') {
      console.error('ERROR: Tiempo de espera agotado (Timeout). Esto suele indicar que el puerto está bloqueado en el Firewall del hosting.');
    } else if (error.code === 'EAUTH') {
      console.error('ERROR: Autenticación fallida. Verifica usuario y contraseña.');
    } else {
      console.error(error);
    }
  }
}

testSMTP();
