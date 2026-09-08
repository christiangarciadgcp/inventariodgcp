import {Component, inject, HostBinding, signal, OnInit, HostListener} from '@angular/core';
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
export class SidebarComponent implements OnInit {

  private authService = inject(AuthService);
  public layoutService = inject(LayoutService);
  public readonly rolesPermitidos = roles;
  opcionesCatalogo = signal(false);
  rolActual = signal<string>('');
  isHovered = signal(false);

  ngOnInit() {
    this.rolActual.set(this.authService.getRolUsuario());
  }

  permiso(rolesPermitidos: string[]): boolean {
    return rolesPermitidos.includes(this.rolActual());
  }

  // acoplarCatalogo() {
  //   if (this.layoutService.sidebarCollapsed()) {
  //     this.layoutService.toggleSidebar();
  //   }
  //   this.opcionesCatalogo.update(value => !value);
  // }

  acoplarCatalogo() {
    // Simplemente abrimos o cerramos el submenú interno,
    // SIN modificar el estado de anclaje del sidebar completo.
    this.opcionesCatalogo.update(value => !value);
  }


  get isExpanded(): boolean {
    const state = this.layoutService.sidebarState();
    if (state === 'EXPANDED') return true;      // Siempre abierto
    if (state === 'COLLAPSED') return false;    // Siempre cerrado
    return this.isHovered();                    // Si es HOVER, depende del mouse
  }

  @HostListener('mouseenter') onMouseEnter() {
    if (this.layoutService.sidebarState() === 'HOVER') {
      this.isHovered.set(true);
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.layoutService.sidebarState() === 'HOVER') {
      this.isHovered.set(false);
    }
  }

  @HostBinding('style.width')
  get width() {
    return this.isExpanded ? '260px' : '75px';
  }

  @HostBinding('style.transition') transition = 'width 0.3s ease-in-out';

}
