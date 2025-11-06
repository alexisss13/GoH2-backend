import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError, ZodIssue } from 'zod';

export const validateRequest =
  (schema: ZodTypeAny, source: 'body' | 'query' | 'params' = 'body') =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[source] || {};
      
      // Validar los datos
      const parsed = await schema.parseAsync(dataToValidate);
      
      // Solo reasignar body (query y params son read-only)
      if (source === 'body') {
        req.body = parsed;
      }
      // Para query y params, Zod ya validó que son correctos,
      // pero no podemos reasignarlos porque son read-only en Express
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.issues.map((err: ZodIssue) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          error: 'Datos de entrada inválidos.',
          details: validationErrors,
        });
      }

      console.error('Error inesperado en validación:', error);
      return res.status(500).json({ error: 'Error interno en validación.' });
    }
  };