// src/utils/hydration.utils.ts
import { Usuario } from '@prisma/client';

/**
 * Calcula el objetivo de hidratación diario basado en el perfil del usuario.
 *
 * ¡IMPORTANTE!: Esta fórmula es una estimación de negocio y puede ser
 * ajustada según la evidencia científica que el equipo decida seguir.
 *
 * Fórmula actual (estimada):
 * Base = 30-35ml por kg de peso. Usaremos 30ml.
 * Modificador = Se suma un bono basado en el nivel de actividad.
 */

// Definimos los bonos de actividad en ml
const BONO_ACTIVIDAD = {
  Sedentario: 0,
  Ligero: 250,
  Moderado: 500, // Basado en el ejemplo de la app
  Activo: 750,
  MuyActivo: 1000,
};

// Tipo para asegurar que las claves coincidan
type NivelActividadKey = keyof typeof BONO_ACTIVIDAD;

export const calcularObjetivoHidratacion = (
  perfil: Pick<Usuario, 'pesoKg' | 'nivelActividad'>,
): number => {
  // 1. Requerimientos mínimos
  // Si no tenemos peso, no podemos calcular. Devolvemos un default.
  if (!perfil.pesoKg || perfil.pesoKg <= 0) {
    return 2000; // Default de 2000ml si no hay datos
  }

  // 2. Cálculo Base (Peso)
  const basePorPeso = perfil.pesoKg * 30; // 30ml por kg de peso

  // 3. Cálculo de Actividad
  const nivelKey = perfil.nivelActividad as NivelActividadKey;
  const bonoActividad = BONO_ACTIVIDAD[nivelKey] || 0;

  // 4. Total
  // El diseño muestra "1264 ml". Nuestra fórmula debe poder generar valores así.
  const objetivoTotal = basePorPeso + bonoActividad;

  // Redondeamos para evitar decimales
  return Math.round(objetivoTotal);
};