import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
// 1. Importar Mercado Pago
import { MercadoPagoConfig, Preference } from 'mercadopago';

// 2. Configurar cliente
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
});

export const createOrderController = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user?.id; 

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    const { shippingData, items, total, subtotal } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El pedido no tiene productos.' });
    }

    // 3. Guardar el pedido en TU base de datos (Prisma)
    // Usamos el campo firstName como nombreReceptor completo
    const nuevoPedido = await prisma.pedido.create({
      data: {
        usuarioId,
        nombreReceptor: shippingData.firstName, // <--- CAMBIO: Solo usamos firstName
        telefonoContact: shippingData.phone,
        direccion: shippingData.address,
        ciudad: shippingData.city,
        codigoPostal: shippingData.zip,
        notas: shippingData.notes,
        
        subtotal: parseFloat(subtotal),
        costoEnvio: total - subtotal, 
        total: parseFloat(total),
        estado: 'PENDIENTE',
        metodoPago: 'MERCADO_PAGO', // <--- Puedes agregar este campo a tu modelo si quieres

        detalles: {
          create: items.map((item: any) => ({
            productoIdStrapi: item.id.toString(),
            nombre: item.name,
            precioUnitario: item.price,
            cantidad: item.quantity,
            imagenUrl: item.image,
            varianteColor: item.variant?.name || null,
            subtotalLinea: item.price * item.quantity
          }))
        }
      }
    });

    // 4. Crear la Preferencia de Mercado Pago
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map((item: any) => ({
          id: item.id.toString(),
          title: item.name,
          quantity: item.quantity,
          unit_price: Number(item.price),
          currency_id: 'PEN', // Soles
          picture_url: item.image 
        })),
        payer: {
          name: shippingData.firstName,
          email: shippingData.email,
          phone: {
            number: shippingData.phone
          },
          address: {
            street_name: shippingData.address,
            zip_code: shippingData.zip
          }
        },
        // URLs a las que MP redirige al usuario después de pagar
        back_urls: {
          success: `${process.env.FRONTEND_URL}/checkout/success?orderId=${nuevoPedido.id}`,
          failure: `${process.env.FRONTEND_URL}/checkout/failure`,
          pending: `${process.env.FRONTEND_URL}/checkout/pending`,
        },
        auto_return: "approved",
        external_reference: nuevoPedido.id, // Vinculamos el pago con tu ID de pedido
        statement_descriptor: "GOH2 TIENDA",
      }
    });

    // 5. Responder con la URL de pago (init_point)
    res.status(201).json({
      message: 'Pedido creado. Redirigiendo a Mercado Pago...',
      pedidoId: nuevoPedido.id,
      init_point: result.init_point,         // URL para producción
      sandbox_init_point: result.sandbox_init_point // URL para pruebas (sandbox)
    });

  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: 'Error interno al procesar el pedido.' });
  }
};