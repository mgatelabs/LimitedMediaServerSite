import { Component, ContentChild, OnDestroy, AfterContentInit, Input } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CdkPortal, PortalModule } from '@angular/cdk/portal';
import { MatIcon } from "@angular/material/icon";
import { MatToolbar } from "@angular/material/toolbar";
import {MatSidenavModule} from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-hamburger-menu',
  standalone: true,
  imports: [MatIcon, MatToolbar, MatSidenavModule, CommonModule, PortalModule],
  templateUrl: './hamburger-menu.component.html',
  styleUrl: './hamburger-menu.component.css'
})
export class HamburgerMenuComponent implements AfterContentInit, OnDestroy {
  @ContentChild(CdkPortal) contentPortal?: CdkPortal;
  isSmall = false;

  @Input() color!: string;

  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(private bo: BreakpointObserver) {
    this.bo.observe(['(max-width: 800px)']).pipe(takeUntil(this.destroy$)).subscribe(r => this.isSmall = r.matches);
  }

  ngAfterContentInit() {
    if (!this.contentPortal) {
      console.warn('app-hamburger-menu: put your items inside <ng-template cdk-portal>…</ng-template>');
    }
  }

}
