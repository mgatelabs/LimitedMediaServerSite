import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable, catchError, map, shareReplay, switchMap } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { CommonResponseInterface, Utility } from './utility';
import { NoticeService } from './notice.service';

export interface PluginValue {
  id: string;
  name: string;
}

export interface ActionPluginArg {
  name: string;
  id: string;
  type: string;
  default: string | undefined;
  description: string;
  values: PluginValue[];
  prefix_lang_id: string;
  clear_after?: string;
  arg1?: string;
  adv?: string;
}

export interface ActionPlugin {
  id: string;
  icon: string;
  name: string;
  args: ActionPluginArg[];
  category: string;
  standalone: boolean;
  prefix_lang_id: string;
}

export interface PluginRunResult extends CommonResponseInterface {
  task_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PluginService {

  private triggerRefreshLibrary: BehaviorSubject<ActionPlugin[]> = new BehaviorSubject<ActionPlugin[]>([]);

  constructor(private http: HttpClient, private authService: AuthService, private router: Router, private noticeService: NoticeService) {
    this.subscribeToRouterEvents();
  }

  private subscribeToRouterEvents() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (this.shouldFetchData(event.urlAfterRedirects)) {
          this.triggerRefreshLibrary.next([]);
        }
      }
    });
  }

  private shouldFetchData(url: string): boolean {
    // Define your login route URL here
    const loginRoute = '/a-login';
    // Check if the current route is not the login route
    return url !== loginRoute;
  }

  public getPlugins(): Observable<ActionPlugin[]> {
    return this.triggerRefreshLibrary.pipe(
      switchMap(() => {
        const headers = this.authService.getAuthHeader();
        return this.http.post<{ status: string, message: string, plugins: ActionPlugin[] }>('/api/plugin/list', {}, { headers })
          .pipe(
            map(response => Utility.handleCommonResponse<ActionPlugin[]>(response, "plugins")),
            catchError(this.handleError),
            shareReplay(1)
          );
      })
    );
  }

  // Generic filtering method
  public static filterPlugins(
    plugins: ActionPlugin[],
    category?: string,
    standalone?: boolean
  ): ActionPlugin[] {
    return plugins.filter(plugin => {
      let matchesCategory = true;
      let matchesStandalone = true;

      if (category) {
        matchesCategory = plugin.category === category;
      }

      if (standalone !== undefined) {
        matchesStandalone = plugin.standalone === standalone;
      }

      return matchesCategory && matchesStandalone;
    });
  }

  private handleError(error: any) {
    console.error('An error occurred', error);
    return [];
  }

  runActionPlugin(plugin: ActionPlugin, args: Map<string, string>): Observable<PluginRunResult> {
    const formData = new FormData();

    let argObj: any = {};
    args.forEach((value, key) => {
      argObj[key] = value;
    });

    formData.append('bundle', JSON.stringify({ "id": plugin.id, "args": argObj }));
    const headers = this.authService.getAuthHeader();

    return this.http.post<PluginRunResult>('/api/process/add/plugin', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseMap<PluginRunResult>(response, data => {
          return data as PluginRunResult;
        }, this.noticeService)),
      );
  }
}
