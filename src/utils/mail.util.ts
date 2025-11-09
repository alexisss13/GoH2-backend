// src/utils/mail.util.ts
import sgMail from '@sendgrid/mail';
import 'dotenv/config';

// 1. Interfaz (¡Esta la reutilizamos! Está perfecta)
interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// 2. Configura la API Key de SendGrid (una sola vez)
const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  console.error('ERROR: SENDGRID_API_KEY no está definida en .env');
  // En un caso real, podrías querer que la app falle al iniciar
} else {
  sgMail.setApiKey(apiKey);
  console.log('📬 SendGrid Mail service inicializado.');
}

/**
 * Envía un email usando la API de SendGrid.
 */
export const sendEmail = async (options: MailOptions) => {
  const senderEmail = process.env.VERIFIED_SENDER_EMAIL;
  
  if (!apiKey || !senderEmail) {
    console.error(
      'Error: Faltan variables de entorno de SendGrid. Email no enviado.',
    );
    // En desarrollo, esto es un aviso. En producción, podría ser un error crítico.
    // Simulamos un "modo de prueba" si no hay clave.
    console.log('--- MODO SIMULACIÓN (no enviado) ---');
    console.log(`TO: ${options.to}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`HTML: ${options.html}`);
    console.log('-------------------------------------');
    return;
  }

  // 3. Construye el mensaje para SendGrid
  const msg = {
    to: options.to,
    from: {
      email: senderEmail, // El email verificado que pusimos en .env
      name: 'GoH2 App', // El nombre que verá el usuario
    },
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  // 4. Envía el email
  try {
    await sgMail.send(msg);
    console.log(`📧 Mensaje enviado exitosamente a: ${options.to}`);
  } catch (error: any) {
    console.error('Error al enviar email con SendGrid:', error);
    if (error.response) {
      // SendGrid a menudo da detalles útiles en error.response.body
      console.error('Detalles del error (SendGrid):', error.response.body);
    }
  }
};