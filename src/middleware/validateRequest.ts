// src/middleware/validateRequest.ts
import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodRawShape } from 'zod';

// Middleware genérico para validar requests
export const validateRequest =
  (schema: ZodObject<ZodRawShape>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      if (error.errors) {
        const validationErrors = error.errors.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          error: 'Datos de entrada inválidos.',
          details: validationErrors,
        });
      }
      return res.status(500).json({ error: 'Error interno en validación.' });
    }
  };

/*
import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

export const validateRequest =
  (schema: ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      const validationErrors = error.errors?.map((err: any) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      res.status(400).json({
        error: 'Datos de entrada inválidos.',
        details: validationErrors,
      });
    }
  };

  */