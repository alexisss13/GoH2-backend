// src/utils/hydration.utils.ts
import { Usuario } from '@prisma/client';
import { prisma } from '../lib/prisma';

const calcularEdad = (fechaNacimiento: Date): number => {
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mes = hoy.getMonth() - fechaNacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }
  return edad;
};

// Factores de actividad para el Gasto Energético Diario Total (TDEE)
// (Estos multiplican la Tasa Metabólica Basal)
const FACTOR_ACTIVIDAD = {
  Sedentario: 1.2,
  Ligero: 1.375,
  Moderado: 1.55,
  Activo: 1.725,
  MuyActivo: 1.9,
};

// Fórmula anterior (simple) para fallback
const BONO_ACTIVIDAD_SIMPLE = {
  Sedentario: 0,
  Ligero: 250,
  Moderado: 500,
  Activo: 750,
  MuyActivo: 1000,
};

type NivelActividadKey = keyof typeof FACTOR_ACTIVIDAD;

/**
 * Calcula el objetivo de hidratación diario.
 *
 * Estrategia Principal (Mifflin-St Jeor + TDEE -> 1ml/kcal):
 * Requiere: pesoKg, alturaCm, fechaNacimiento, genero.
 *
 * Estrategia de Fallback (Simple):
 * Si faltan datos para la fórmula principal, usa la estimación simple (peso * 30 + bono).
 */


export const calcularObjetivoHidratacion = (
  perfil: Usuario,
): number => {
  const { pesoKg, alturaCm, fechaNacimiento, genero, nivelActividad } = perfil;
// --- Estrategia Principal: Mifflin-St Jeor ---
  
  // 1. Validar que tengamos todos los datos necesarios
  const tieneDatosCompletos = 
    pesoKg && pesoKg > 0 &&
    alturaCm && alturaCm > 0 &&
    fechaNacimiento &&
    genero && (genero === 'Masculino' || genero === 'Femenino'); // Asumimos estos dos géneros para la fórmula

  if (tieneDatosCompletos) {
    try {
      // 2. Calcular Edad
      const edad = calcularEdad(fechaNacimiento);

      // 3. Calcular Tasa Metabólica Basal (TMB) - Mifflin-St Jeor
      let tmb: number;
      
      // Hombres: $BMR = (10 \times \text{peso en kg}) + (6.25 \times \text{altura en cm}) - (5 \times \text{edad en años}) + 5$
      if (genero === 'Masculino') {
        tmb = (10 * pesoKg) + (6.25 * alturaCm) - (5 * edad) + 5;
      } 
      // Mujeres: $BMR = (10 \times \text{peso en kg}) + (6.25 \times \text{altura en cm}) - (5 \times \text{edad en años}) - 161$
      else { 
        // Asumimos Femenino si no es Masculino (ya que validamos arriba)
        tmb = (10 * pesoKg) + (6.25 * alturaCm) - (5 * edad) - 161;
      }

      // 4. Calcular Gasto Energético Diario Total (TDEE)
      const nivelKey = nivelActividad as NivelActividadKey;
      const factorActividad = FACTOR_ACTIVIDAD[nivelKey] || 1.2; // Default a Sedentario
      const tdee = tmb * factorActividad;

      // 5. Retornar TDEE (kcal) como ml de hidratación (1:1)
      return Math.round(tdee);

    } catch (error) {
      console.error("Error calculando TMB, usando fallback:", error);
      // Si algo falla, pasamos al fallback
    }
  }

  // --- Estrategia de Fallback: Cálculo Simple ---
  if (!tieneDatosCompletos) {
    console.warn(`Usuario ${perfil.id} no tiene perfil completo (o género 'Otro'), usando cálculo simple.`);
  }


  if (pesoKg && pesoKg > 0) {
    const basePorPeso = pesoKg * 30; // 30ml por kg de peso
    const nivelKey = nivelActividad as NivelActividadKey;
    const bonoActividad = BONO_ACTIVIDAD_SIMPLE[nivelKey] || 0;
    return Math.round(basePorPeso + bonoActividad);
  }

  // --- Default Final ---
  // Si no tenemos ni siquiera el peso
  return 2000; // Default de 2000ml
};

/**
 * --- ¡NUEVA FUNCIÓN REUTILIZABLE! ---
 * Obtiene o crea el objetivo diario para un usuario.
 * Usado por /api/objetivo/hoy y /api/resumen/hoy
 */
export const getOrCreateDailyObjective = async (usuarioId: string) => {
  // 1. Obtener el perfil del usuario (necesario para el cálculo)
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
  });

  if (!usuario) {
    // Esto no debería pasar si el usuario está autenticado, pero es un buen control
    throw new Error('Usuario no encontrado para cálculo de objetivo.');
  }

  // 2. Definir el día de hoy (en UTC)
  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);

  // 3. Buscar un objetivo existente para hoy
  let objetivo = await prisma.objetivoHidratacion.findFirst({
    where: {
      usuarioId,
      fecha: hoy,
    },
  });

  // 4. Si no existe, lo creamos
  if (!objetivo) {
    const cantidadMl = calcularObjetivoHidratacion(usuario);
    
    objetivo = await prisma.objetivoHidratacion.create({
      data: {
        usuarioId,
        fecha: hoy,
        cantidadMl,
      },
    });
  }
  
  return objetivo;
};