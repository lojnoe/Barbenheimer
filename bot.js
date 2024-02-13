
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
                            { text: 'Ver películas vistas', callback_data: 'vistas' }
                        ]
                    ]
                }
            });

        });


        // Modificar el evento callback_query para manejar los botones

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
                                { text: 'Comedia', callback_data: '35' },
                                { text: 'Terror', callback_data: '27' }
                            ]
                        ]
                    }
                });
            }
            if (data == 'vistas') {
                mostrarPeliculasVistas(chatId);
            }
        });

        bot.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            const messageId = query.message.message_id;
            const data = query.data;

            if (data === '12' || data === '18' || data === '35' || data === '27') {
                try {
                    let response = []
                    response = await obtenerPeliculasPorGenero(data);

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
                                        { text: 'Marcar como vista', callback_data: `mark_viewed_${index}` },
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
                                    { text: 'Marcar como vista', callback_data: `mark_viewed_${currentIndex}` },
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
            } else if (data.startsWith('mark_viewed_')) {
                console.log(parseInt(data.split('_')[1]));
                const index = parseInt(data.split('_')[1]);
                console.log(index);
                if (index >= 0 && index < movies.length) {
                    const { title } = movies[index];
                    await guardarPeliculaVista(chatId, title); // Enviar el ID del chat y el título de la película
                    console.log('Título de la película marcada como vista:', title); // Mostrar el título de la película en la consola
                } else {
                    console.error('Índice de película fuera de rango:', index);
                }
            }
        });

        //https://api.themoviedb.org/3/movie/157336?api_key=093638b0b0fe7a94b2f8639adbd43903
        // https://api.themoviedb.org/3/discover/movie?api_key=093638b0b0fe7a94b2f8639adbd43903&sort_by=popularity.desc&with_genres=12

        // https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}




        let storedResponse;

        async function obtenerPeliculasPorGenero(genero) {
            // Si hay una respuesta almacenada, borramos su valor
            if (storedResponse) {
                storedResponse = undefined;
            }

            // Realizamos la consulta y almacenamos la respuesta
            const response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_genres=${genero}`);
            storedResponse = await response.json();

            return storedResponse;
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
        async function mostrarPeliculasVistas(chatId) {
            try {
                // Lee el contenido del archivo de películas vistas
                const peliculasVistas = fs.readFileSync('peliculas_vistas.txt', 'utf8');

                // Si hay películas vistas, envía el contenido al usuario
                if (peliculasVistas) {
                    await bot.sendMessage(chatId, 'Películas vistas:\n' + peliculasVistas);
                } else {
                    await bot.sendMessage(chatId, 'No hay películas vistas.');
                }
            } catch (error) {
                console.error('Error al leer el archivo de películas vistas:', error);
                await bot.sendMessage(chatId, 'Ocurrió un error al obtener las películas vistas.');
            }
        }

        async function guardarPeliculaVista(userId, movie) {
            const peliculaVista = `Chat ID: ${chatId}, Película: ${movieTitle}\n`;

            // Abrir el archivo en modo de anexar (append) para agregar la película vista
            fs.appendFile('peliculas_vistas.txt', peliculaVista, (err) => {
                if (err) {
                    console.error('Error al guardar la película vista:', err);
                } else {
                    console.log('Película vista guardada correctamente.');
                }
            });

        }

    }).catch((error) => {

        console.log("No se ha podido conectar");
    });
}


botStart();