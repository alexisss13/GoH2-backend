// src/controllers/order.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createOrderController = async (req: Request, res: Response) => {
  try {
    // El usuarioId viene del token (middleware protectRoute)
    // Asegúrate de que tu types de express soporte req.user, o usa (req as any).user
    const usuarioId = (req as any).user?.id; 

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    const { shippingData, items, total, subtotal } = req.body;

    // Validación básica
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El pedido no tiene productos.' });
    }

    // Crear el pedido en base de datos
    const nuevoPedido = await prisma.pedido.create({
      data: {
        usuarioId,
        // Mapeamos los datos del formulario
        nombreReceptor: `${shippingData.firstName} ${shippingData.lastName}`,
        telefonoContact: shippingData.phone,
        direccion: shippingData.address,
        ciudad: shippingData.city,
        codigoPostal: shippingData.zip,
        notas: shippingData.notes,
        
        subtotal: parseFloat(subtotal),
        costoEnvio: total - subtotal, // Calculamos la diferencia como envío
        total: parseFloat(total),
        estado: 'PENDIENTE',

        // Creamos los detalles (productos)
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
      },
      include: {
        detalles: true // Devolvemos los detalles creados para confirmar
      }
    });

    // Aquí es donde devolverías los datos necesarios para Izipay
    res.status(201).json({
      message: 'Pedido creado exitosamente',
      pedidoId: nuevoPedido.id,
      total: nuevoPedido.total,
      moneda: nuevoPedido.moneda
    });

  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: 'Error interno al procesar el pedido.' });
  }
};