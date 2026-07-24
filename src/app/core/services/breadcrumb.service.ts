import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

import { Breadcrumb } from '../models/breadcrumb.model';
import { LayoutService } from '../layout/layout.service';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly layout = inject(LayoutService);

  /**
   * Call once at app bootstrap to auto-generate breadcrumbs
   * from route data: `{ breadcrumb: 'Label' }`
   */
  init(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const crumbs = this.buildBreadcrumbs(this.activatedRoute.root);
        this.layout.setBreadcrumbs(crumbs);

        // Also set page title from last route's data
        const last = crumbs[crumbs.length - 1];
        if (last) {
          this.layout.setPageTitle(last.label);
        }
      });
  }

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url = '',
    crumbs: Breadcrumb[] = [{ label: 'Home', url: '/' }]
  ): Breadcrumb[] {
    const children = route.children;

    for (const child of children) {
      const routeURL = child.snapshot.url.map(s => s.path).join('/');
      if (routeURL) url = `${url}/${routeURL}`;

      const data = child.snapshot.data;
      if (data['breadcrumb']) {
        crumbs.push({ label: data['breadcrumb'], url });
      }

      return this.buildBreadcrumbs(child, url, crumbs);
    }

    return crumbs;
  }
}
