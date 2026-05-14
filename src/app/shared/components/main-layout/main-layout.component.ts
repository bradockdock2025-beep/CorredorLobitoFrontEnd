import { Component } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  template: `
    <app-topbar (toggleSidebar)="toggle()"></app-topbar>

    <mat-sidenav-container class="layout-container" autosize>
      <mat-sidenav
        class="main-sidenav"
        mode="side"
        [opened]="sidenavOpen"
      >
        <app-sidebar></app-sidebar>
      </mat-sidenav>

      <mat-sidenav-content class="content-area">
        <router-outlet></router-outlet>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class MainLayoutComponent {
  sidenavOpen = true;

  toggle(): void {
    this.sidenavOpen = !this.sidenavOpen;
  }
}
