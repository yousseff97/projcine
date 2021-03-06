﻿import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {map} from 'rxjs/operators';

import {User} from '../_models/user';
import {Config} from '../../Config';

@Injectable({providedIn: 'root'})
export class AuthenticationService {
  private usersUrl = 'api/users';

  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;
  public isAdmin: BehaviorSubject<boolean>;

  constructor(private http: HttpClient) {
    this.isAdmin = new BehaviorSubject(false);
    const user: User = JSON.parse(localStorage.getItem('currentUser'));
    this.currentUserSubject = new BehaviorSubject<User>(user);
    this.currentUser = this.currentUserSubject.asObservable();

  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string) {
    return this.http.post<any>(Config.apiUrl + '/' + this.usersUrl + `/login
`, {username: username, password: password})
      .pipe(map(user => {
        // login successful if there's a jwt token in the response
        if (user) {
          // store user details and jwt token in local storage to keep user logged in between page refreshes
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.checkIfCurrentUserIsAdmin();
          this.currentUserSubject.next(user);
        }
        return user;
      }));
  }

  checkIfCurrentUserIsAdmin() {
    const user: User = JSON.parse(localStorage.getItem('currentUser'));
    this.http.get(`${Config.apiUrl}/api/RoleMappings?filter[where][principalId]=${user.userId}`).subscribe((succ: any[]) => {
      if (succ.length > 0) {
        succ.forEach((roleMapping => {
          let roleId = roleMapping.roleId;
          this.http.get(`${Config.apiUrl}/api/Roles/${roleId}`).subscribe((role : any)=>{
            if (role.name == "admin"){
              this.isAdmin.next(true);
            }
          })
        })) 
        
      }
    });
  }


  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isAdmin.next(false);
  }

  register(user: any) {
    return this.http.post<any>(Config.apiUrl + '/' + this.usersUrl, user);
  }
}
