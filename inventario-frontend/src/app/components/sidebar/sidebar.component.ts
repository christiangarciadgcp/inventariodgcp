import { Component, inject,HostBinding, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../services/auth.service';
import { roles } from '../../core/roles'

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit{

  private authService = inject(AuthService);
  public layoutService = inject(LayoutService);
  public readonly rolesPermitidos = roles;
  opcionesCatalogo = signal(false);

  rolActual = signal<string>('');

  ngOnInit() {
    this.rolActual.set(this.authService.getRolUsuario());
  }

  permiso(rolesPermitidos: string[]): boolean {
    return rolesPermitidos.includes(this.rolActual());
  }

  acoplarCatalogo() {
    if (this.layoutService.sidebarCollapsed()) {
      this.layoutService.toggleSidebar();
    }
    this.opcionesCatalogo.update(value => !value);
  }

  @HostBinding('style.width')
  get width() {
    return this.layoutService.sidebarCollapsed() ? '75px' : '260px';
  }

  @HostBinding('style.transition') transition = 'width 0.3s ease-in-out';

}
