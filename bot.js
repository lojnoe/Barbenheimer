
const token = '6744615244:AAG2tSYke8D72a6qRNyV6JXck5S2yaPleNM';
const TMDB_API_KEY = '093638b0b0fe7a94b2f8639adbd43903';
const TelegramBot = require('node-telegram-bot-api');
const { Telegraf } = require('telegraf');
const bot = new TelegramBot(token, { polling: true });

import('node-fetch').then(module => {
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, `¡Hola! Soy un bot que te ayuda a encontrar películas o series. Por favor, elige si quieres buscar una serie o una película.`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Películas', callback_data: 'pelicula' },
                        { text: 'Series', callback_data: 'serie' }
                    ]
                ]
            }
        });
    });

    bot.on('callback_query', (query) => {
        const chatId = query.message.chat.id;
        const data = query.data;

        if (data === 'pelicula' || data === 'serie') {
            bot.sendMessage(chatId, `¿Qué categoría prefieres? (Escribe una categoría como acción, drama, comedia, terror, etc.)`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Acción', callback_data: '12' },
                            { text: 'Drama', callback_data: '18' },
                            { text: 'Comedia', callback_data: 'comedia' },
                            { text: 'Terror', callback_data: 'terror' }
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

        if (data === '12' || data === '18' || data === 'comedia' || data === 'terror') {
            try {
                const response = await obtenerPeliculasPorGenero(data);
                const movies = response.results.map(movie => ({
                    title: movie.original_title,
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

        const sendMovie = async (index) => {
            if (index >= 0 && index < totalMovies) {
                const { title, posterPath } = movies[index];
                const message = `*${title}*\n(${index + 1}/${totalMovies})`;

                // Enviar el mensaje con el título actualizado
                await bot.editMessageText(message, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                });

                // Enviar la imagen como archivo adjunto y las flechas de navegación
                if (posterPath) {
                    const imageUrl = encodeURI(posterPath);
                    await bot.sendPhoto(chatId, imageUrl, {
                        caption: message,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '⬅️', callback_data: `prev_${index}` },
                                    { text: '➡️', callback_data: `next_${index}` }
                                ]
                            ]
                        }
                    });
                }
            }
        };

        sendMovie(currentIndex);

        bot.on('callback_query', async (query) => {
            const data = query.data;
            if (data.startsWith('prev_')) {
                currentIndex = parseInt(data.split('_')[1]) - 1;
                await sendMovie(currentIndex);
            } else if (data.startsWith('next_')) {
                currentIndex = parseInt(data.split('_')[1]) + 1;
                await sendMovie(currentIndex);
            }
        });
    }

    function obtenerPeliculasPorGenero(genero) {
        //https://api.themoviedb.org/3/movie/157336?api_key=093638b0b0fe7a94b2f8639adbd43903
        // https://api.themoviedb.org/3/discover/movie?api_key=093638b0b0fe7a94b2f8639adbd43903&sort_by=popularity.desc&with_genres=12

        // https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}
        return fetch(`
        https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_genres=${genero}
        `)
            .then(response => response.json());
    }
    // https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=true&language=en-US&page=1&sort_by=popularity.desc&with_genres=action?api_key=093638b0b0fe7a94b2f8639adbd43903

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


    bot.onText(/\/clear/, (msg) => {
        const chatId = msg.chat.id;

        bot.deleteMessage(chatId, msg.message_id)
            .then(() => {
                bot.sendMessage(chatId, 'El historial de chat ha sido borrado.');
            })
            .catch((error) => {
                console.error('Error al borrar el historial de chat:', error);
                bot.sendMessage(chatId, 'Ocurrió un error al borrar el historial de chat.');
            });
    });

}).catch((error) => {

    console.log("No se ha podido conectar");
});

