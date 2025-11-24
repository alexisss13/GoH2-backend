import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
});

export const createOrderController = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }
    const usuarioId = user.id;

    const { shippingData, items, total, subtotal, landingUrl } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El pedido no tiene productos.' });
    }

    // --- 1. DEFINICIÓN ROBUSTA DE LA URL BASE ---
    // Si landingUrl viene del frontend, úsala.
    // Si no, usa la variable de entorno.
    // Si todo falla, usa una URL dummy para que no explote (solo en emergencia).
    let baseUrl = landingUrl;
    
    if (!baseUrl) {
        baseUrl = process.env.FRONTEND_LANDING_URL;
    }
    
    // Fallback de emergencia si todo es undefined (evita el error de MP)
    if (!baseUrl) {
        console.warn("⚠️ ADVERTENCIA: No se detectó URL de retorno. Usando fallback.");
        baseUrl = "https://goh2-landing.vercel.app"; // Pon aquí tu URL real de producción por si acaso
    }
    
    // Limpiamos slash final si existe para evitar errores de doble //
    baseUrl = baseUrl.replace(/\/$/, "");

    console.log("✅ Generando pago con Base URL:", baseUrl);

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
        // URLs construidas seguramente
        back_urls: {
          success: `${baseUrl}/checkout/success?orderId=${nuevoPedido.id}`,
          failure: `${baseUrl}/checkout/failure`,
          pending: `${baseUrl}/checkout/pending`,
        },
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

  } catch (error: any) {
    console.error('❌ Error CRÍTICO al crear pedido:', error);
    // Muestra el error real de Mercado Pago si existe
    if (error.cause) console.error('Causa MP:', JSON.stringify(error.cause, null, 2));
    
    res.status(500).json({ error: 'Error interno del servidor al procesar el pago.' });
  }
};