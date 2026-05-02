import { http, HttpResponse } from 'msw';

export const handlers = [
    // TMDB API handlers
    http.get('https://api.themoviedb.org/3/movie/:id', ({ params }) => {
        const { id } = params;

        if (id === '999') {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json({
            id: Number(id),
            title: 'Fight Club',
            overview: 'A ticking-time-bomb insomniac...',
            release_date: '1999-10-15',
        });
    }),

    http.get('https://api.themoviedb.org/3/discover/movie', () => {
        return HttpResponse.json({
            page: 1,
            results: [],
            total_pages: 1,
            total_results: 0,
        });
    }),

    http.get('https://api.themoviedb.org/3/genre/movie/list', () => {
        return HttpResponse.json({
            genres: [
                { id: 28, name: 'Action' },
                { id: 12, name: 'Adventure' },
            ],
        });
    }),
];
