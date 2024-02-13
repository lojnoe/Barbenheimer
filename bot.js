require('dotenv').config();
/**
 * Token de acceso del bot de Telegram.
 * @type {string}
 */

const token = process.env.TOKEN;

/**
 * Clave de la API de The Movie Database (TMDB).
 * @type {string}
 */

const TMDB_API_KEY = process.env.TMDB_API_KEY;
/**
 * Importa la librería node-telegram-bot-api para interactuar con el bot de Telegram.
 */
const TelegramBot = require('node-telegram-bot-api');

/**
 * Crea una instancia del bot de Telegram.
 * @type {TelegramBot}
 */
const bot = new TelegramBot(token, { polling: true });

/**
 * Array que almacenará las películas obtenidas de la API.
 * @type {Array<Object>}
 */
let movies = [];

/**
 * Inicia el bot y define las funciones para manejar comandos y eventos.
 */

function botStart() {
    import('node-fetch').then(module => {
        // Importa la librería node-fetch para realizar solicitudes HTTP

        /**
 * 
 * @function
 * @param {RegExp} /\/start/ - Expresión regular que coincide con el comando /start.
 * @param {Function} callback - Función de retorno de llamada que se ejecuta cuando se recibe el comando /start.
 * @param {Object} msg - Objeto que representa el mensaje recibido por el bot.
 * @returns {void}
 */
        // Enviar mensaje de bienvenida al usuario con las opciones de búsqueda de películas y series
        bot.onText(/\/start/, (msg) => {
            bot.sendMessage(msg.chat.id, `¡Hola! Soy un bot que te ayuda a encontrar películas o series. Por favor, elige si quieres buscar una serie o una película.`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Películas', callback_data: 'pelicula' },
                            { text: 'Series', callback_data: 'serie' },

                        ]
                    ]
                }
            });

        });


        /**
         * 
         * @function handleCategorySelection
         * @param {object} query - Objeto que representa la consulta callback_query recibida por el bot.
         * @description Esta función maneja el evento 'callback_query' para mostrar al usuario las opciones de categorías de películas o series y procesar su selección.
         */
        bot.on('callback_query', (query) => {
            const chatId = query.message.chat.id; // ID del chat
            const data = query.data; // Datos recibidos en la consulta

            // Si el usuario elige buscar películas
            if (data === 'pelicula') {
                // Enviar mensaje solicitando la categoría de películas
                bot.sendMessage(chatId, `¿Qué categoría prefieres para películas? (Escribe una categoría como acción, drama, comedia, terror, etc.)`, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Acción', callback_data: '12' },
                                { text: 'Drama', callback_data: '18' },
                                { text: 'Comedia', callback_data: '35' },
                                { text: 'Terror', callback_data: '27' }
                            ]
                        ]
                    }
                });
            }
            // Si el usuario elige buscar series
            else if (data === 'serie') {

                // Enviar mensaje solicitando la categoría de series
                bot.sendMessage(chatId, `¿Qué categoría prefieres para series? (Escribe una categoría como acción, drama, comedia, terror, etc.)`, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Acción & Aventura', callback_data: '10759' },
                                { text: 'Animación', callback_data: '16' },
                                { text: 'Crimen', callback_data: '80' },
                                { text: 'Sci-Fi & Fantasy', callback_data: '10765' }
                            ]
                        ]
                    }
                });
            }
        });
        /**
         * Maneja el evento 'callback_query' para obtener películas o series según el género seleccionado.
         * @function handleCallbackQuery
         * @param {object} query - Objeto que representa la consulta callback_query recibida por el bot.
         * @description Esta función maneja el evento 'callback_query' para obtener películas o series según el género seleccionado por el usuario y mostrarlas en el chat.
         */
        bot.on('callback_query', async (query) => {
            const chatId = query.message.chat.id; // ID del chat
            const messageId = query.message.message_id; // ID del mensaje
            const data = query.data; // Datos recibidos en la consulta

            // Si los datos son correspondientes a géneros de películas
            if (data === '12' || data === '18' || data === '35' || data === '27') {
                try {
                    let response = await obtenerDatosPorGenero('movie', data); // Obtener datos de películas por género
                    movies = response.results.map(movie => ({ // Mapear los resultados para obtener títulos y rutas de pósteres
                        title: movie.original_title, // Título de la película
                        posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null // Ruta del póster de la película
                    }));
                    mostrarPeliculas(chatId, messageId, movies); // Mostrar películas al usuario
                } catch (error) {
                    console.error('Error al obtener películas:', error); // Manejar errores
                    bot.sendMessage(chatId, 'Ocurrió un error al obtener películas.'); // Enviar mensaje de error al usuario
                }
            }
            // Si los datos son correspondientes a géneros de series
            else if (data === '10759' || data === '16' || data === '80' || data === '10765') {
                try {
                    let response = await obtenerDatosPorGenero('tv', data); // Obtener datos de series por género
                    movies = response.results.map(movie => ({ // Mapear los resultados para obtener títulos y rutas de pósteres
                        title: movie.original_name, // Título de la serie
                        posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null // Ruta del póster de la serie
                    }));
                    mostrarPeliculas(chatId, messageId, movies); // Mostrar series al usuario
                } catch (error) {
                    console.error('Error al obtener series:', error); // Manejar errores
                    bot.sendMessage(chatId, 'Ocurrió un error al obtener series.'); // Enviar mensaje de error al usuario
                }
            }
        });



        /**
  * 
  * @function mostrarPeliculas
  * @param {number} chatId - ID del chat donde se enviarán las películas.
  * @param {number} messageId - ID del mensaje donde se mostrarán las películas.
  * @param {Array<Object>} movies - Array de objetos que representan las películas a mostrar.
  * @description Esta función muestra películas al usuario y permite la navegación entre ellas mediante botones interactivos.
  */
        async function mostrarPeliculas(chatId, messageId, movies) {
            let currentIndex = 0; // Índice de la película actualmente mostrada
            const totalMovies = movies.length; // Total de películas en la lista
            let primerapelicula = true; // Bandera para controlar si es la primera película mostrada

            /**
             * Función interna para enviar una película al usuario.
             * @param {number} index - Índice de la película a enviar.
             */
            const enviarPelicula = async (index) => {
                if (index >= 0 && index < totalMovies) { // Verifica que el índice esté dentro del rango
                    const { title, posterPath } = movies[index]; // Obtiene título y ruta del póster de la película
                    const message = `*${title}*\n(${index + 1}/${totalMovies})`; // Mensaje con el título y número de película

                    // Verifica si hay una ruta de póster válida
                    if (posterPath) {
                        const imageUrl = encodeURI(posterPath); // Codifica la URL de la imagen
                        await bot.sendPhoto(chatId, imageUrl, { // Envia la imagen como archivo adjunto
                            caption: message, // Texto del mensaje
                            parse_mode: 'Markdown', // Formato de parseo del mensaje (Markdown)
                            reply_markup: { // Teclado de navegación
                                inline_keyboard: [
                                    [
                                        { text: '⬅️', callback_data: `prev_${index}` }, // Botón para ir a la película anterior
                                        { text: '➡️', callback_data: `next_${index}` }, // Botón para ir a la siguiente película
                                        { text: 'Salir', callback_data: `salir` } // Botón para salir de la lista de películas
                                    ]
                                ]
                            }
                        });
                    }
                }
            };

            // Si es la primera película que se muestra
            if (primerapelicula == true) {
                primerapelicula = false; // Cambia el valor de la bandera
                await enviarPelicula(currentIndex); // Envia la primera película al usuario
            }
        }

        /**
         *
         * @function enviarPelicula
         * @param {number} chatId - ID del chat donde se enviará la película.
         * @param {Array<Object>} movies - Array de objetos que representan las películas disponibles.
         * @param {number} currentIndex - Índice de la película a enviar.
         * @description Esta función envía una película al usuario junto con opciones de navegación, como ir a la película anterior, siguiente o salir de la lista de películas.
         */
        async function enviarPelicula(chatId, movies, currentIndex) {
            const totalMovies = movies.length; // Total de películas en la lista

            if (currentIndex >= 0 && currentIndex < totalMovies) { // Verifica que el índice esté dentro del rango
                const { title, posterPath } = movies[currentIndex]; // Obtiene título y ruta del póster de la película
                const message = `*${title}*\n(${currentIndex + 1}/${totalMovies})`; // Mensaje con el título y número de película

                // Verifica si hay una ruta de póster válida
                if (posterPath) {
                    const imageUrl = encodeURI(posterPath); // Codifica la URL de la imagen
                    await bot.sendPhoto(chatId, imageUrl, { // Envia la imagen como archivo adjunto
                        caption: message, // Texto del mensaje
                        parse_mode: 'Markdown', // Formato de parseo del mensaje (Markdown)
                        reply_markup: { // Teclado de navegación
                            inline_keyboard: [
                                [
                                    { text: '⬅️', callback_data: `prev_${currentIndex}` }, // Botón para ir a la película anterior
                                    { text: '➡️', callback_data: `next_${currentIndex}` }, // Botón para ir a la siguiente película
                                    { text: 'Salir', callback_data: `salir` } // Botón para salir de la lista de películas
                                ]
                            ]
                        }
                    });
                }
            }
        }

        /**
 * Maneja los eventos de callback para la navegación entre películas.
 * @function handleNavigationCallback
 * @param {object} query - Objeto que contiene los datos de la consulta.
 */
        bot.on('callback_query', async (query) => {
            const data = query.data; // Extrae los datos de la consulta
            const chatId = query.message.chat.id; // Obtiene el ID del chat

            // Maneja las acciones según los datos recibidos
            if (data === 'salir') {
                clearConversationHistory(); // Limpia el historial de conversación
                await bot.sendMessage(chatId, 'Saliendo del bot...'); // Envia un mensaje de despedida
                await bot.sendMessage(chatId, 'Introduce /start para comenzar de nuevo'); // Indica cómo comenzar de nuevo
            } else if (data.startsWith('prev_')) {
                const currentIndex = parseInt(data.split('_')[1]) - 1; // Obtiene el índice de la película anterior
                await enviarPelicula(chatId, movies, currentIndex); // Envia la película anterior al usuario
            } else if (data.startsWith('next_')) {
                const currentIndex = parseInt(data.split('_')[1]) + 1; // Obtiene el índice de la siguiente película
                await enviarPelicula(chatId, movies, currentIndex); // Envia la siguiente película al usuario
            }
        });

        let storedResponses = {};

        /**
     * @function obtenerDatosPorGenero
     * @description Almacena las respuestas de consultas por género para futuras consultas.
     * 
     * @param {string} tipo - El tipo de consulta (película o serie).
     * @param {string} genero - El ID del género de la consulta.
     * @returns {Promise<Object>} - Una promesa que se resuelve con los datos de la respuesta de la consulta.
     *                            Si la consulta no tiene éxito, la promesa se rechaza con un error.
     */
        async function obtenerDatosPorGenero(tipo, genero) {
            const storedResponseKey = `${tipo}_${genero}`; // Genera una clave única para almacenar la respuesta

            // Si hay una respuesta almacenada, la retorna directamente
            if (storedResponses[storedResponseKey]) {
                return storedResponses[storedResponseKey];
            }

            // Realiza la consulta a la API de TheMovieDB
            const response = await fetch(`https://api.themoviedb.org/3/discover/${tipo}?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_genres=${genero}`);
            const responseData = await response.json(); // Obtiene los datos de la respuesta

            // Almacena la respuesta para futuras consultas
            storedResponses[storedResponseKey] = responseData;

            return responseData; // Retorna la respuesta de la consulta
        }

        const fs = require('fs');

        /**
         * Ruta del archivo que contiene el historial de conversación.
         * @type {string}
         */
        const conversationHistoryFile = 'conversation_history.txt';

        /**
         * @function clearConversationHistory
         * @description Borra el historial de conversación almacenado en un archivo.
         */
        const clearConversationHistory = () => {
            fs.writeFileSync(conversationHistoryFile, ''); // Borra el contenido del archivo
            console.log('Historial de conversación borrado.'); // Imprime un mensaje de confirmación en la consola
        };

        // Llamada para borrar el historial de conversación al iniciar el script
        clearConversationHistory();

        /**
          * @function onHelpCommand
          * @description Maneja el comando /help para mostrar un mensaje de ayuda detallado al usuario.
          * 
          * @param {Object} msg - Objeto que representa el mensaje recibido por el bot.
          */
        bot.onText(/\/help/, (msg) => {
            const chatId = msg.chat.id; // Obtiene el ID del chat
            const helpMessage = `
            ℹ️ **Ayuda - Barbenheimer Bot**

            Este bot te ayuda a encontrar películas o series según tus preferencias buscando las peliculas del momento.

            **Comandos Disponibles:**
            /start - Inicia el bot y muestra las opciones disponibles.
            /help - Muestra este mensaje de ayuda.

            **Comando /start:**
            El comando /start inicia el bot y muestra las opciones disponibles para buscar películas o series. Puedes seleccionar entre buscar películas o series y luego elegir una categoría como acción, drama, comedia, terror, etc.

            ¡Disfruta explorando y encontrando nuevas películas y series con Barbenheimer Bot!
            `;
            bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' }); // Envía el mensaje de ayuda al chat
        });

    }).catch((error) => {

        console.log("No se ha podido conectar");
    });
}


botStart();

