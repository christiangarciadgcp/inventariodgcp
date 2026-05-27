import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/auth/login/login.component';

import { CatalogoComponent } from './components/catalogo/catalogo.component';
import { CategoriaComponent } from './components/categoria/categoria-list/categoria.component';
import { ProveedorListComponent } from './components/proveedor/proveedor-list/proveedor-list.component';
import { BodegaListComponent } from './components/bodega/bodega-list/bodega-list.component';
import { UnidadesMedidasListComponent } from './components/unidades-medidas/unidades-medidas-list/unidades-medidas-list.component';
import { ProductoListComponent } from './components/producto/producto-list/producto-list.component';
import { UsuarioListComponent } from './components/usuario/usuario-list/usuario-list.component';
import { SolicitudFormComponent } from './components/solicitud-compra/solicitud-form/solicitud-form.component';
import { SolicitudListComponent } from './components/solicitud-compra/solicitud-list/solicitud-list.component';
import { InventarioListComponent } from './components/inventario/inventario-list/inventario-list.component';
import { InventarioDetalleComponent } from './components/inventario/inventario-detalle/inventario-detalle.component';
import { MainLayoutComponent } from './components/layout/main-layout/main-layout.component';
import { UnderConstructionComponent } from './components/under-construction/under-construction.component';
import { PresupuestoFormComponent } from './components/presupuesto/presupuesto-form/presupuesto-form.component';
import { PresupuestoRevisionComponent } from './components/presupuesto/presupuesto-revision/presupuesto-revision.component';
import { PresupuestoListComponent } from './components/presupuesto/presupuesto-list/presupuesto-list.component';
import { InventarioMovimientoComponent } from './components/inventario/inventario-movimiento/inventario-movimiento.component';
import { InventarioMovimientoStockComponent } from './components/inventario/inventario-movimiento-stock/inventario-movimiento-stock.component';
import { InventarioDescargoComponent } from './components/inventario/inventario-descargo/inventario-descargo.component';
import { MarcaListComponent } from './components/catalogos/marca/marca-list/marca-list.component';
import { ModeloListComponent } from './components/catalogos/modelo/modelo-list/modelo-list.component';
import { permisosGuard } from './guards/permisos-guard';
import { authGuard } from './guards/auth-guard';
import {ProductoDiccionarioComponent} from './components/producto/producto-diccionario/producto-diccionario.component';


const ADMIN = 'administrador';
const INVENTARIO = 'inventario utdi';
const JEFE = 'jefe utdi';
const TECNICO = 'tecnico utdi';


export const routes: Routes = [

    /****************************************************************
            Rutas Login no se necesita authGuardian
    *****************************************************************/
    {
        path: 'login',
        component: LoginComponent
    },

    /****************************************************************
            Rutas Protegidas (Debe haber iniciado Sesion )
    *****************************************************************/
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard], // SEGURIDAD A TODO EL BLOQUE
        children: [

            /**********************************
                        DashBoard
            ***********************************/
            {
                path: 'dashboard',
                component: DashboardComponent,
                data: { breadcrumb: 'Dashboard' }
            },

            /**********************************
                        Presupuesto
            ***********************************/
            {
                path: 'presupuesto',
                data: { breadcrumb: 'Presupuestos' }, // Para el breadcrumb padre
                children: [
                    {
                        path: '',
                        component: PresupuestoListComponent
                    },
                    {
                        path: 'nuevo_presupuesto',
                        component: PresupuestoFormComponent,
                        data: { breadcrumb: 'Nuevo Presupuesto' }
                    },
                    {
                        path: 'editar_presupuesto/:id',
                        component: PresupuestoFormComponent,
                        data: { breadcrumb: 'Editar Presupuesto' }
                    },
                    {
                        path: 'revision/:id',
                        component: PresupuestoRevisionComponent,
                        data: { breadcrumb: 'Revisión de Stock' }
                    }
                ]
            },

            /**********************************
                        Proyectos
            ***********************************/
            {
                path: 'proyecto',
                component: UnderConstructionComponent,
                data: { breadcrumb: 'Proyectos' }
            },

            /**********************************
                  Diccionario de Productos
             ***********************************/

          {
              path: 'diccionario-materiales',
              component: ProductoDiccionarioComponent,
              data: { breadcrumb: 'Diccionario de Materiales y equipos' }

          },

            /*********************************
                Solicitudes de Compra
            **********************************/
            {
                path: 'solicitud_compra',
                canActivate: [permisosGuard],
                data: {
                    breadcrumb: 'Solicitudes de Compra',
                    roles: [ADMIN, INVENTARIO, JEFE]
                },
                children: [
                    {
                        path: '',
                        component: SolicitudListComponent
                    },
                    {
                        path: 'nueva_solicitud_compra',
                        component: SolicitudFormComponent,
                        data: { breadcrumb: 'Nueva Solicitud de Compra' }
                    },
                    {
                        path: 'editar_solicitud_compra/:id',
                        component: SolicitudFormComponent,
                        data: { breadcrumb: 'Editar Solicitud de Compra' }
                    },
                ]
            },

            /*********************************
                        Inventario
            **********************************/
            {
                path: 'inventario',
                canActivate: [permisosGuard],
                data: {
                    breadcrumb: 'Inventarios',
                    roles: [ADMIN, INVENTARIO, JEFE]
                },
                children: [
                    {
                        path: '',
                        component: InventarioListComponent, // Las Cards de Bodegas
                    },
                    {
                        path: 'bodega/:id',
                        component: InventarioDetalleComponent, // La Tabla de productos
                        data: { breadcrumb: 'Existencias' }
                    },
                ]
            },

            /******************************************
                Movimiento de Inventario como lista
            *******************************************/
            {
                path: 'movimientos',
                canActivate: [permisosGuard],
                component: InventarioMovimientoStockComponent,
                data: {
                    breadcrumb: 'Movimientos de Inventario',
                    roles: [ADMIN, INVENTARIO]
                 }
            },

            /*******************************************
                Movimiento de Inventario induvidual
            ********************************************/
            {
                path: 'movimientos2',
                canActivate: [permisosGuard],
                component: InventarioMovimientoComponent,
                data: {
                    breadcrumb: 'Movimientos de Inventario',
                    roles: [ADMIN, INVENTARIO]
                }
            },

            /*********************************
                        Descargo
            **********************************/
            {
                path: 'descargo',
                canActivate: [permisosGuard],
                component: InventarioDescargoComponent,
                data: {
                    breadcrumb: 'Descargo de Materiales',
                    roles: [ADMIN, INVENTARIO]
                }
            },

            /*********************************
                        Catalogos
            **********************************/
            {
                path: 'catalogos',
                canActivate: [permisosGuard],
                data: {
                    breadcrumb: 'Catálogos',
                    roles: [ADMIN, INVENTARIO]
                 },
                children: [
                    {
                        path: '',
                        component: CatalogoComponent
                    },
                    {
                        path: 'categorias',
                        component: CategoriaComponent,
                        data: { breadcrumb: 'Categorías' }
                    },
                    {
                        path: 'proveedores',
                        component: ProveedorListComponent,
                        data: { breadcrumb: 'Proveedores' }
                    },
                    {
                        path: 'bodegas',
                        component: BodegaListComponent,
                        data: { breadcrumb: 'Bodegas' }
                    },
                    {
                        path: 'unidades',
                        component: UnidadesMedidasListComponent,
                        data: { breadcrumb: 'Unidades de Medida' }
                    },
                    {
                        path: 'productos',
                        component: ProductoListComponent,
                        data: { breadcrumb: 'Productos' }
                    },
                    {
                      path: 'marcas',
                      component: MarcaListComponent,
                      data: { breadcrumb: 'Marcas' }
                    },
                    {
                      path: 'modelos',
                      component: ModeloListComponent,
                      data: { breadcrumb: 'Modelos' }
                    },
                ]
            },

            /*********************************
                    Usuarios
            ***********************************/
            {
                path: 'usuarios',
                canActivate: [permisosGuard],
                component: UsuarioListComponent,
                data: {
                    breadcrumb: 'Usuarios',
                    roles: [ADMIN]
                }
            },

            /*********************************
                        Url Inicial
            ***********************************/
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },

        /***************************************************************
                    Rutas que no existen, redirigen a login
        *****************************************************************/
    { path: '**', redirectTo: 'login' }
];
