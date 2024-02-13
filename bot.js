
const token = '6744615244:AAG2tSYke8D72a6qRNyV6JXck5S2yaPleNM';
const TMDB_API_KEY = '093638b0b0fe7a94b2f8639adbd43903';
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(token, { polling: true });
let movies = [];
function botStart() {
    import('node-fetch').then(module => {

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


        // Modificar el evento callback_query para manejar los botones

        bot.on('callback_query', (query) => {
            const chatId = query.message.chat.id;
            const data = query.data;

            if (data === 'pelicula') {
                bot.sendMessage(chatId, `¿Qué categoría prefieres peliculas? (Escribe una categoría como acción, drama, comedia, terror, etc.)`, {
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
            } else if (data === 'serie') {
                console.log("Entra aqui")
                bot.sendMessage(chatId, `¿Qué categoría prefieres en series? (Escribe una categoría como acción, drama, comedia, terror, etc.)`, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Acción & Adventura"', callback_data: '10759' },
                                { text: 'Animacion', callback_data: '16' },
                                { text: 'Crimen', callback_data: '80' },
                                { text: 'Sci-Fi & Fantasy"', callback_data: '10765' }
                            ]
                        ]
                    }
                });
            }
            
        });

        bot.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            const messageId = query.message.message_id;
            const data = query.data;

            if (data === '12' || data === '18' || data === '35' || data === '27') {
                try {
                    let response = []
                    
                    response = await obtenerDatosPorGenero('movie', data);
                    movies = [];
                    
                    movies = response.results.map(movie => ({
                        title: movie.original_title,
                        posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
                    }));
                    mostrarPeliculas(chatId, messageId, movies);
                } catch (error) {
                    console.error('Error al obtener películas:', error);
                    bot.sendMessage(chatId, 'Ocurrió un error al obtener películas.');
                }
            } else if (data === '10759' || data === '16' || data === '80' || data === '10765') {
                try {
                    let response = []
                    response = await obtenerDatosPorGenero('tv', data);
                    movies = [];
                    movies = response.results.map(movie => ({
                        title: movie.original_name,
                        posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
                    }));
                    mostrarPeliculas(chatId, messageId, movies);
                } catch (error) {
                    console.error('Error al obtener películas:', error);
                    bot.sendMessage(chatId, 'Ocurrió un error al obtener películas.');
                }
            }
        });
        async function mostrarPeliculas(chatId, messageId, movies) {
            let currentIndex = 0;
            const totalMovies = movies.length;
            let primerapelicula = true;

            // Función para enviar una película al usuario
            const enviarPelicula = async (index) => {
                if (index >= 0 && index < totalMovies) {
                    const { title, posterPath } = movies[index];
                    const message = `*${title}*\n(${index + 1}/${totalMovies})`;
                    // Envía la imagen como archivo adjunto y las flechas de navegación
                    if (posterPath) {
                        const imageUrl = encodeURI(posterPath);
                        await bot.sendPhoto(chatId, imageUrl, {
                            caption: message,
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '⬅️', callback_data: `prev_${index}` },
                                        { text: '➡️', callback_data: `next_${index}` },
                                        
                                        { text: 'Salir', callback_data: `salir` }
                                    ]
                                ]
                            }
                        });
                    }
                }
            };

            if (primerapelicula == true) {
                // Inicialmente, enviar la primera película
                primerapelicula = false;
                await enviarPelicula(currentIndex);

            }


        }
        async function enviarPelicula(chatId, movies, currentIndex) {
            const totalMovies = movies.length;

            if (currentIndex >= 0 && currentIndex < totalMovies) {
                const { title, posterPath } = movies[currentIndex];
                const message = `*${title}*\n(${currentIndex + 1}/${totalMovies})`;

                // Envía la imagen como archivo adjunto y las flechas de navegación
                if (posterPath) {
                    const imageUrl = encodeURI(posterPath);
                    await bot.sendPhoto(chatId, imageUrl, {
                        caption: message,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '⬅️', callback_data: `prev_${currentIndex}` },
                                    { text: '➡️', callback_data: `next_${currentIndex}` },
                                    
                                    { text: 'Salir', callback_data: `salir` }
                                ]
                            ]
                        }
                    });
                }
            }
        }

        // Manejar los eventos de callback para la navegación entre películas
        bot.on('callback_query', async (query) => {
            const data = query.data;
            const chatId = query.message.chat.id;

            if (data === 'salir') {
                clearConversationHistory();
                await bot.sendMessage(chatId, 'Saliendo del bot...');
                await bot.sendMessage(chatId, 'Introduce /start para comenzar de nuevo');
            } else if (data.startsWith('prev_')) {
                currentIndex = parseInt(data.split('_')[1]) - 1;
                await enviarPelicula(chatId, movies, currentIndex);
            } else if (data.startsWith('next_')) {
                currentIndex = parseInt(data.split('_')[1]) + 1;
                await enviarPelicula(chatId, movies, currentIndex);
            }
        });

        let storedResponses = {};

        async function obtenerDatosPorGenero(tipo, genero) {
            const storedResponseKey = `${tipo}_${genero}`;
            
            // Si hay una respuesta almacenada, la retornamos directamente
            if (storedResponses[storedResponseKey]) {
                return storedResponses[storedResponseKey];
            }
        
            // Realizamos la consulta y almacenamos la respuesta
            const response = await fetch(`https://api.themoviedb.org/3/discover/${tipo}?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_genres=${genero}`);
            const responseData = await response.json();
            
            // Almacenamos la respuesta para futuras consultas
            storedResponses[storedResponseKey] = responseData;
        
            return responseData;
        }
       

        const fs = require('fs');

        // Ruta del archivo que contiene el historial de conversación
        const conversationHistoryFile = 'conversation_history.txt';

        // Función para borrar el historial de conversación
        const clearConversationHistory = () => {
            fs.writeFileSync(conversationHistoryFile, '');
            console.log('Historial de conversación borrado.');
        };


        // Llamada para borrar el historial de conversación al iniciar el script
        clearConversationHistory();

        bot.onText(/\/help/, (msg) => {
            const chatId = msg.chat.id;
            const helpMessage = `
        ℹ️ **Ayuda - Barbenheimer Bot**
        
        Este bot te ayuda a encontrar películas o series según tus preferencias buscando las peliculas del.
        
        **Comandos Disponibles:**
        /start - Inicia el bot y muestra las opciones disponibles.
        /help - Muestra este mensaje de ayuda.
        
        **Comando /start:**
        El comando /start inicia el bot y muestra las opciones disponibles para buscar películas o series. Puedes seleccionar entre buscar películas o series y luego elegir una categoría como acción, drama, comedia, terror, etc.
        
        ¡Disfruta explorando y encontrando nuevas películas y series con Barbenheimer Bot!
        `;
            bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
        });
    }).catch((error) => {

        console.log("No se ha podido conectar");
    });
}


botStart();


//https://api.themoviedb.org/3/movie/157336?api_key=093638b0b0fe7a94b2f8639adbd43903
        // https://api.themoviedb.org/3/discover/movie?api_key=093638b0b0fe7a94b2f8639adbd43903&sort_by=popularity.desc&with_genres=12

        // https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}
         // https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=true&language=en-US&page=1&sort_by=popularity.desc&with_genres=action?api_key=093638b0b0fe7a94b2f8639adbd43903