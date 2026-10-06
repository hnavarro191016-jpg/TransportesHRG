import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_SHEETS_API_URL = process.env.GOOGLE_SHEETS_API_URL;

/**
 * Busca los datos de un operador en Google Sheets usando su Telegram ID.
 * @param {string|number} telegramId - El ID de Telegram del usuario.
 * @returns {Promise<Object|null>} Los datos del operador (incluyendo unidad) o null si no se encuentra.
 */
export async function getDriverDataByTelegramId(telegramId) {
    if (!GOOGLE_SHEETS_API_URL) {
        throw new Error('GOOGLE_SHEETS_API_URL no está definida en .env');
    }

    // Construimos la URL con los parámetros que nos proporcionaron
    const url = `${GOOGLE_SHEETS_API_URL}?source=REGISTRO_BOT&field=TELEGRAM&key=${telegramId}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const json = await response.json();
        
        // El API devuelve { ok: true, found: true/false, data: {...} }
        if (json.ok && json.found && json.data) {
            return json.data;
        }
        
        // Si no lo encuentra
        return null;
    } catch (error) {
        console.error('Error al consultar la API de Google Sheets:', error);
        throw error;
    }
}
