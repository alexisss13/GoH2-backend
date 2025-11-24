import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import axios from 'axios'; // <--- Necesario para hablar con Strapi

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || ''
});

// Función auxiliar para limpiar el número de teléfono
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '');
}

export const createOrderController = async (req: Request, res: Response) => {
  try {
    // 1. Validaciones iniciales
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }
    const usuarioId = user.id;

    const { shippingData, items, total, subtotal, landingUrl } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El pedido no tiene productos.' });
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      console.error('❌ MP_ACCESS_TOKEN no está configurado');
      return res.status(500).json({ error: 'Error de configuración de pago.' });
    }

    // 2. Configurar URLs
    let baseUrl = landingUrl || process.env.FRONTEND_LANDING_URL || 'http://localhost:3000';
    baseUrl = baseUrl.replace(/\/$/, ""); 
    
    const backendUrl = process.env.BACKEND_URL || "https://goh2-backend.onrender.com";

    console.log("💳 Iniciando proceso de pedido para:", shippingData.email);

    // 3. Guardar en Base de Datos (Prisma - Postgres)
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

    // ---------------------------------------------------------
    // 4. SINCRONIZACIÓN CON STRAPI (Nuevo Bloque)
    // ---------------------------------------------------------
    try {
        const strapiUrl = process.env.STRAPI_API_URL || "http://127.0.0.1:1337";
        const strapiToken = process.env.STRAPI_WRITE_TOKEN;

        // Mapeamos los datos a los campos que creaste en el Content-Type "Order"
        const payloadStrapi = {
            data: {
                nombre_cliente: shippingData.firstName,
                email_cliente: shippingData.email,
                telefono: shippingData.phone,
                direccion_envio: `${shippingData.address}, ${shippingData.city} ${shippingData.zip || ''}`,
                total: parseFloat(total),
                estado: 'PENDIENTE',
                metodo_pago: 'MERCADO_PAGO',
                id_referencia_externa: nuevoPedido.id, // Guardamos el ID de Postgres para buscarlo luego
                
                // Guardamos el detalle de productos como JSON
                items_json: items 
            }
        };

        // Enviamos a Strapi (Fire and Forget - No usamos await para no bloquear el pago si Strapi falla)
        if (strapiToken) {
            axios.post(`${strapiUrl}/api/orders`, payloadStrapi, { 
                headers: {
                    Authorization: `Bearer ${strapiToken}`,
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                console.log("✅ Pedido duplicado en Strapi ID:", response.data.data.id);
            }).catch(err => {
                console.error("❌ Error enviando a Strapi:", err.response?.data || err.message);
            });
        } else {
            console.warn("⚠️ STRAPI_WRITE_TOKEN no configurado, saltando sincronización.");
        }

    } catch (syncError) {
        console.error("Error en bloque Strapi (No bloqueante):", syncError);
    }
    // ---------------------------------------------------------


    // 5. Crear Preferencia de Mercado Pago
    const preference = new Preference(client);
    const cleanedPhone = cleanPhoneNumber(shippingData.phone);

    const preferenceData = {
      body: {
        items: items.map((item: any) => {
            // Lógica para validar URL de imagen
            const pictureUrl = (item.image && (item.image.startsWith('http') || item.image.startsWith('https'))) 
                ? item.image 
                : undefined;

            return {
                id: String(item.id),
                title: item.name,
                quantity: Number(item.quantity),
                unit_price: Number(item.price),
                currency_id: 'PEN',
                picture_url: pictureUrl
            };
        }),
        payer: {
          name: shippingData.firstName,
          email: shippingData.email,
          phone: {
            area_code: "",
            number: cleanedPhone
          },
          address: {
            street_name: shippingData.address,
            zip_code: shippingData.zip || ""
          }
        },
        back_urls: {
          success: `${baseUrl}/checkout/success?orderId=${nuevoPedido.id}`,
          failure: `${baseUrl}/checkout/failure?orderId=${nuevoPedido.id}`,
          pending: `${baseUrl}/checkout/pending?orderId=${nuevoPedido.id}`,
        },
        notification_url: `${backendUrl}/api/webhooks`,
        
        // auto_return comentado para localhost, descomentar en producción si tienes HTTPS
        // auto_return: "approved", 
        
        external_reference: nuevoPedido.id,
        statement_descriptor: "H2GO TIENDA",
        expires: true,
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    };

    console.log("📦 Creando preferencia MP...");
    const mpResult = await preference.create(preferenceData);
    console.log("✅ Preferencia creada con éxito.");

    // 6. Responder al Frontend
    res.status(201).json({
      message: 'Preferencia creada',
      pedidoId: nuevoPedido.id,
      init_point: mpResult.init_point,
      sandbox_init_point: mpResult.sandbox_init_point
    });

  } catch (error: any) {
    console.error('❌ Error CRÍTICO al crear pedido:', error);
    if (error.cause) console.error('Causa MP:', JSON.stringify(error.cause, null, 2));
    
    res.status(500).json({
      error: 'Error interno del servidor al procesar el pago.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};