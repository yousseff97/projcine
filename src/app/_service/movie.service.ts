import {ShowtimeDate} from './../interface/showtime-date';
import {Observable, of} from 'rxjs';
import {map, catchError, switchMap, concatMap} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {Movie} from './../interface/movie';
import {Showtime} from './../interface/showtime';
import {HttpClient} from '@angular/common/http';
import {Config} from '../../Config';
import {MovieModel} from '../_models/movieModel';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private moviesUrl = 'api/movies';
  private showtimesUrl = 'api/showtimes';

  movie: Movie;
  movieModel: MovieModel;
  newCasting: string[];


  constructor(private http: HttpClient) {
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);

      return of(result as T);
    };
  }

  // Get all movies
  getMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(Config.apiUrl + '/' + this.moviesUrl);
  }

  // Get now playing moving
  getNowPlayingMovies(filterDate: string = 'all'): Observable<Movie[]> {
    let today = null;
    let next6days = null;

    if (filterDate === 'all') {
      today = new Date();
      next6days = new Date();
      today.setHours(0, 0, 0, 0);
      next6days.setHours(0, 0, 0, 0);
      next6days.setDate(next6days.getDate() + 6);
    } else {
      today = new Date(filterDate);
    }

    return this.http.get<Showtime[]>(this.showtimesUrl)
      .pipe(
        map(showtimes => showtimes.filter(showtime =>
          showtime.showtimes.filter(showtimesDate => {
            const showtimeDate = new Date(showtimesDate.date);

            return filterDate === 'all' ? showtimeDate >= today && showtimeDate <= next6days : showtimeDate.getDate() === today.getDate();
          }).length > 0
        )),
        concatMap(showtimes => this.http.get<Movie[]>(this.moviesUrl)
          .pipe(
            map(movies => movies.filter(movie => showtimes.filter(showtime => movie.id === showtime.movieId).length > 0))
          )),
        catchError(this.handleError('getNowPlayingMovies', []))
      );
  }

  // Get movie showtimes
  getMovieShowtimes(movie: Movie, filterDate: string): Observable<Showtime[]> {

    //
    // const date = showAllTimes || filterDate === 'all' ? new Date() : new Date(filterDate);
    // const next6days = new Date();
    // date.setHours(0, 0, 0, 0);
    // next6days.setHours(0, 0, 0, 0);
    // next6days.setDate(next6days.getDate() + 6);
    let url = Config.apiUrl + '/' + this.moviesUrl + '/' + movie.id + '/shows';
    console.log(url);
    return this.http.get<Showtime[]>(url);
    // .pipe(
    //   map(showtimes => showtimes.filter(showtime => {
    //     let flag = 0;
    //
    //     showtime.showtimes = showtime.showtimes.filter(showtimesDate => {
    //       const showtimeDate = new Date(showtimesDate.date);
    //       return showAllTimes || filterDate === 'all' && !flag++ ? showtimeDate >= date && showtimeDate <= next6days : showtimeDate.getTime() === date.getTime();
    //     });
    //
    //     return showtime.movieId === movie.id;
    //   })),
    //   map(showtimes => showtimes.length ? showtimes[0].showtimes : []),
    //   catchError(this.handleError('getNowPlayingMovies', []))
    // );
  }

  // get single movie
  getMovie(id: number): Observable<Movie> {
    const url = `${Config.apiUrl + '/' + this.moviesUrl}/${id}`;
    return this.http.get<Movie>(url);
  }

  // search movies
  searchMovies(term: string): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${Config.apiUrl + '/' + this.moviesUrl}/?filter[where][title][like]=${term}`);
  }

  addMovie(movieModel: MovieModel): Observable<MovieModel> {
    return this.http.post<MovieModel>(Config.apiUrl + '/' + this.moviesUrl, movieModel);

  }


  createMovie(
              title: string,
              poster: string,
              backdrop: string,
              trailer: string,
              overview: string,
              director: string,
              casting: string,
              release_date: string,
              runtime: number): Observable<MovieModel> {
    console.log(casting);
    this.newCasting = casting.split('/');
    console.log(this.newCasting);
    this.movieModel = new MovieModel();

    this.movieModel = new MovieModel( title, poster, trailer, backdrop, overview, director, this.newCasting, release_date, runtime);

    return (this.addMovie(this.movieModel));
  }
}
