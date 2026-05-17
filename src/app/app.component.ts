import { Component, OnInit } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {
  constructor(private theme: ThemeService) {}
  ngOnInit(): void { this.theme.init(); }
}
