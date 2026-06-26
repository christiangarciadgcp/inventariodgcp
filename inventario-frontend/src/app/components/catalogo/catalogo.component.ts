import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.css',
})
export class CatalogoComponent {

    // Lista de Catálogos
    catalogos = [
      { titulo: 'Bodegas', icono: 'bi-building', ruta: '/catalogos/bodegas', color: 'dark', desc: 'Ubicaciones físicas' },
      { titulo: 'Materiales y Equipo', icono: 'bi-box', ruta: '/catalogos/productos', color: 'dark', desc: 'Inventario General' },
      { titulo: 'Categorías', icono: 'bi-tags', ruta: '/catalogos/categorias', color: 'dark', desc: 'Gestionar tipos de productos' },
      { titulo: 'Proveedores', icono: 'bi-truck', ruta: '/catalogos/proveedores', color: 'dark', desc: 'Lista de Proveedores' },
      { titulo: 'Unidades de Medida', icono: 'bi-rulers', ruta: '/catalogos/unidades', color: 'dark', desc: 'Metros, Unidades, Cajas' },
      { titulo: 'Marcas', icono: 'bi-substack', ruta: '/catalogos/marcas', color: 'dark', desc: 'Marcas de equipos' },
      { titulo: 'Modelos', icono: 'bi-ui-checks-grid', ruta: '/catalogos/modelos', color: 'dark', desc: 'Modelos de equipos' },
      { titulo: 'Ubicaciones', icono: 'bi bi-geo-alt', ruta: '/catalogos/ubicaciones', color: 'dark', desc: 'Ubicaciones' }
    ];

}
