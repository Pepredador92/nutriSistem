// Funciones de utilidad para cálculos

/**
 * Calcula las calorías totales a partir de los gramos de macronutrientes.
 * Carbohidratos: 4 kcal/g
 * Proteínas: 4 kcal/g
 * Lípidos: 9 kcal/g
 * @param {number} carbohidratosGramos Gramos de carbohidratos.
 * @param {number} proteinasGramos Gramos de proteínas.
 * @param {number} lipidosGramos Gramos de lípidos.
 * @returns {number} Total de calorías.
 */
function calcularCalorias(carbohidratosGramos, proteinasGramos, lipidosGramos) {
    const kcalCarbs = (carbohidratosGramos || 0) * 4;
    const kcalProteinas = (proteinasGramos || 0) * 4;
    const kcalLipidos = (lipidosGramos || 0) * 9;
    return kcalCarbs + kcalProteinas + kcalLipidos;
}

/**
 * Calcula la distribución porcentual de macronutrientes basada en sus calorías.
 * @param {number} carbohidratosGramos Gramos de carbohidratos.
 * @param {number} proteinasGramos Gramos de proteínas.
 * @param {number} lipidosGramos Gramos de lípidos.
 * @returns {object} Objeto con los porcentajes de carbohidratos, proteinas y lipidos.
 *                   Ej: { carbohidratos: 50, proteinas: 20, lipidos: 30 }
 */
function calcularDistribucionMacros(carbohidratosGramos, proteinasGramos, lipidosGramos) {
    const kcalCarbs = (carbohidratosGramos || 0) * 4;
    const kcalProteinas = (proteinasGramos || 0) * 4; // Corregido: Era kcalCarbs de nuevo
    const kcalLipidos = (lipidosGramos || 0) * 9;
    const totalKcal = kcalCarbs + kcalProteinas + kcalLipidos;

    if (totalKcal === 0) {
        return { carbohidratos: 0, proteinas: 0, lipidos: 0 };
    }

    const porcCarbs = (kcalCarbs / totalKcal) * 100;
    const porcProteinas = (kcalProteinas / totalKcal) * 100;
    const porcLipidos = (kcalLipidos / totalKcal) * 100;

    return {
        carbohidratos: porcCarbs,
        proteinas: porcProteinas,
        lipidos: porcLipidos
    };
}

// Podrían añadirse más funciones de utilidad aquí, como:
// - Cálculo del IMC
// - Estimación de Gasto Energético Basal (GEB) con fórmulas como Harris-Benedict o Mifflin-St Jeor
// - Ajuste de calorías según nivel de actividad física
// - etc.

// Ejemplo de cómo podrían usarse (esto es solo para demostración, no se ejecuta directamente aquí):
/*
const carbs = 150; // gramos
const protein = 70;  // gramos
const fat = 50;    // gramos

const totalKcal = calcularCalorias(carbs, protein, fat);
console.log(\`Total Calorías: \${totalKcal} kcal\`);

const distribucion = calcularDistribucionMacros(carbs, protein, fat);
console.log('Distribución de Macronutrientes:');
console.log(\`  Carbohidratos: \${distribucion.carbohidratos.toFixed(1)}%\`);
console.log(\`  Proteínas: \${distribucion.proteinas.toFixed(1)}%\`);
console.log(\`  Lípidos: \${distribucion.lipidos.toFixed(1)}%\`);
*/
