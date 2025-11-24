import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configuración de Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
});

export const createOrderController = async (req: Request, res: Response) => {
  try {
    // Validación de usuario
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }
    const usuarioId = user.id;

    const { shippingData, items, total, subtotal, landingUrl } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El pedido no tiene productos.' });
    }

    // 1. Guardar pedido en base de datos
    const nuevoPedido = await prisma.pedido.create({
      data: {
        usuarioId,
        nombreReceptor: shippingData.firstName,
        telefonoContact: shippingData.phone,
        direccion: shippingData.address,
        ciudad: shippingData.city,
        codigoPostal: shippingData.zip,
        notas: shippingData.notes,
        
        subtotal: parseFloat(subtotal),
        costoEnvio: parseFloat(total) - parseFloat(subtotal),
        total: parseFloat(total),
        estado: 'PENDIENTE',
        metodoPago: 'MERCADO_PAGO',

        detalles: {
          create: items.map((item: any) => ({
            productoIdStrapi: String(item.id),
            nombre: item.name,
            precioUnitario: Number(item.price),
            cantidad: Number(item.quantity),
            imagenUrl: item.image || "",
            varianteColor: item.variant?.name || null,
            subtotalLinea: Number(item.price) * Number(item.quantity)
          }))
        }
      }
    });

    // 2. Definir URL base de retorno (CORREGIDO)
    // Prioridad 1: La URL que nos envía el Frontend (landingUrl)
    // Prioridad 2: La variable de entorno específica para la Landing
    // Fallback: localhost para desarrollo
    const baseUrl = landingUrl || process.env.FRONTEND_LANDING_URL || 'http://localhost:3000';
    
    const backUrls = {
      success: `${baseUrl}/checkout/success?orderId=${nuevoPedido.id}`,
      failure: `${baseUrl}/checkout/failure`,
      pending: `${baseUrl}/checkout/pending`,
    };

    // 3. Crear Preferencia Mercado Pago
    const preference = new Preference(client);

    const mpResult = await preference.create({
      body: {
        items: items.map((item: any) => ({
          id: String(item.id),
          title: item.name,
          quantity: Number(item.quantity),
          unit_price: Number(item.price),
          currency_id: 'PEN',
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
        back_urls: backUrls, // <--- Aquí usamos las URLs corregidas
        auto_return: "approved",
        external_reference: nuevoPedido.id,
        statement_descriptor: "H2GO TIENDA",
      }
    });

    res.status(201).json({
      message: 'Preferencia creada',
      pedidoId: nuevoPedido.id,
      init_point: mpResult.init_point, 
      sandbox_init_point: mpResult.sandbox_init_point 
    });

  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: 'Error interno al procesar el pedido.' });
  }
};