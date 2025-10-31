// src/controllers/bebida.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Lista todas las bebidas disponibles
 * GET /api/bebidas
 */
export const listBebidasController = async (req: Request, res: Response) => {
  try {
    const bebidas = await prisma.bebida.findMany({
      orderBy: {
        nombre: 'asc', // Orden alfabético
      },
    });
    res.status(200).json(bebidas);
  } catch (error) {
    console.error('Error al listar bebidas:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Crea una nueva bebida (Ruta protegida)
 * POST /api/bebidas
 */
export const createBebidaController = async (req: Request, res: Response) => {
  try {
    const { nombre, factorHidratacion } = req.body;

    // Verificar si ya existe una bebida con ese nombre
    const existingBebida = await prisma.bebida.findUnique({
      where: { nombre },
    });

    if (existingBebida) {
      return res.status(409).json({ error: 'Ya existe una bebida con ese nombre.' });
    }

    const nuevaBebida = await prisma.bebida.create({
      data: {
        nombre,
        factorHidratacion,
      },
    });

    res.status(201).json(nuevaBebida);
  } catch (error) {
    console.error('Error al crear bebida:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};