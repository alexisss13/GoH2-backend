import { Request, Response } from 'express';
import { Payment, MercadoPagoConfig } from 'mercadopago';
import { prisma } from '../lib/prisma';
import axios from 'axios'; // <--- Necesario para comunicarnos con Strapi

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
});

export const receiveWebhook = async (req: Request, res: Response) => {
  try {
    // Mercado Pago nos envía el ID del pago o del tópico en el query o body
    const { type, data } = req.body;
    const { id, topic } = req.query;

    // Solo nos interesan las notificaciones de tipo "payment"
    if (type === 'payment' || topic === 'payment') {
      const paymentId = data?.id || id;
      
      if (!paymentId) return res.sendStatus(200);

      // 1. Consultamos a Mercado Pago el estado REAL de ese pago
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      // 2. Obtenemos los datos clave
      const estadoPago = paymentData.status; // 'approved', 'rejected', 'pending'
      const referenciaExterna = paymentData.external_reference; // ESTE ES TU PEDIDO ID (nuevoPedido.id)

      if (!referenciaExterna) return res.sendStatus(200);

      console.log(`🔔 Webhook recibido: Pedido ${referenciaExterna} está ${estadoPago}`);

      // 3. Actualizamos la base de datos
      if (estadoPago === 'approved') {
        // Actualizamos el Pedido a PAGADO en Prisma
        await prisma.pedido.update({
          where: { id: referenciaExterna },
          data: { 
            estado: 'PAGADO',
            updatedAt: new Date()
          }
        });

        // Registramos el pago en la tabla Pago
        await prisma.pago.create({
          data: {
            pedidoId: referenciaExterna,
            monto: paymentData.transaction_amount || 0,
            metodoPago: paymentData.payment_method_id || 'unknown',
            referenciaExt: paymentId.toString(),
            estado: 'COMPLETADO',
            fechaPago: new Date()
          }
        });

        // --- 4. SINCRONIZACIÓN CON STRAPI (Nuevo Bloque) ---
        try {
          const strapiUrl = process.env.STRAPI_API_URL || "http://127.0.0.1:1337";
          const strapiToken = process.env.STRAPI_WRITE_TOKEN;

          if (strapiToken) {
             // A. Buscar el pedido en Strapi usando el ID de referencia externa
             // Usamos qs o parámetros manuales para filtrar
             const searchResponse = await axios.get(`${strapiUrl}/api/orders`, {
                params: {
                   filters: {
                      id_referencia_externa: {
                         $eq: referenciaExterna
                      }
                   }
                },
                headers: { Authorization: `Bearer ${strapiToken}` }
             });

             const strapiOrders = searchResponse.data.data;

             if (strapiOrders && strapiOrders.length > 0) {
                // Strapi v5 usa 'documentId', v4 usa 'id'. Intentamos obtener el correcto.
                const strapiId = strapiOrders[0].documentId || strapiOrders[0].id;

                // B. Actualizar el estado a PAGADO en Strapi
                await axios.put(`${strapiUrl}/api/orders/${strapiId}`, {
                   data: {
                      estado: 'PAGADO'
                   }
                }, {
                   headers: { 
                      Authorization: `Bearer ${strapiToken}`,
                      'Content-Type': 'application/json'
                   }
                });
                console.log(`✅ Estado actualizado en Strapi para el pedido ${referenciaExterna}`);
             } else {
                console.warn(`⚠️ No se encontró el pedido ${referenciaExterna} en Strapi para actualizar.`);
             }
          }
        } catch (strapiError: any) {
           console.error("❌ Error actualizando estado en Strapi:", strapiError.response?.data || strapiError.message);
           // No bloqueamos la respuesta a Mercado Pago si falla Strapi
        }
        // ----------------------------------------------------

      } else if (estadoPago === 'rejected' || estadoPago === 'cancelled') {
         // Si falló, actualizamos a CANCELADO o FALLIDO en Prisma
         await prisma.pedido.update({
          where: { id: referenciaExterna },
          data: { estado: 'CANCELADO' }
        });
      }
    }

    // SIEMPRE responder 200 OK a Mercado Pago, o te seguirán enviando la alerta
    res.sendStatus(200);

  } catch (error) {
    console.error('Error en webhook:', error);
    res.sendStatus(500);
  }
};