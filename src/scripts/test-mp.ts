import { MercadoPagoConfig, Preference } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

const main = async () => {
  console.log('🔍 Verificando configuración de Mercado Pago...');

  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('❌ ERROR: MP_ACCESS_TOKEN no está definido en el archivo .env');
    process.exit(1);
  }

  console.log('✅ MP_ACCESS_TOKEN encontrado.');

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    console.log('⏳ Intentando crear una preferencia de prueba...');

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'test-item',
            title: 'Item de Prueba',
            quantity: 1,
            unit_price: 10,
            currency_id: 'PEN',
          },
        ],
        back_urls: {
          success: 'http://localhost:3000/success',
          failure: 'http://localhost:3000/failure',
          pending: 'http://localhost:3000/pending',
        },
      },
    });

    console.log('✅ ¡Conexión exitosa!');
    console.log('🆔 ID de Preferencia:', result.id);
    console.log('🔗 Init Point:', result.init_point);
    console.log('🔗 Sandbox Init Point:', result.sandbox_init_point);

  } catch (error: any) {
    console.error('❌ Error al conectar con Mercado Pago:');
    if (error.cause) {
        console.error('Causa:', error.cause);
    } else {
        console.error(error);
    }
  }
};

main();
