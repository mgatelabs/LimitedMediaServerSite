import { Component, ContentChild, AfterContentInit, Input } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CdkPortal, PortalModule } from '@angular/cdk/portal';
import { MatIcon } from "@angular/material/icon";
import { MatToolbar } from "@angular/material/toolbar";
import {MatSidenavModule} from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hamburger-menu',
  standalone: true,
  imports: [MatIcon, MatToolbar, MatSidenavModule, CommonModule, PortalModule],
  templateUrl: './hamburger-menu.component.html',
  styleUrl: './hamburger-menu.component.css'
})
export class HamburgerMenuComponent implements AfterContentInit {
  @ContentChild(CdkPortal) contentPortal?: CdkPortal;
  isSmall = false;

  @Input() color!: string;

  constructor(private bo: BreakpointObserver) {
    this.bo.observe(['(max-width: 800px)']).subscribe(r => this.isSmall = r.matches);
  }

  ngAfterContentInit() {
    if (!this.contentPortal) {
      console.warn('app-hamburger-menu: put your items inside <ng-template cdk-portal>…</ng-template>');
    }
  }

}
