import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

import { InventarioService } from '../../services/inventario.service';
import { AuthService } from '../../services/auth.service';
import { Utils } from '../../core/utils';
import { Mensaje } from '../../core/mensaje';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule], //NgxEchartsDirective
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit{

  private inventarioService = inject(InventarioService);
  private authService = inject(AuthService);
  private fn = inject(Utils);
  private mensaje = inject(Mensaje);
  public fnom = inject(Utils);


  nombreUsuario : string = '';

  datos = signal({
    pendientes : 0,
    aprobadas : 0,
    recepcionadas : 0,
    totalBodegas : 0,
    presupuestoPendientes : 0,
    presupuestoAprobados : 0,
    presupuestoDespachados : 0,
    actividadReciente: []
  });

  displayedColumns: string[] = ['icono', 'detalle', 'bodega', 'cantidad', 'fecha'];

  chartEstadoOptions: EChartsOption = {};

  ngOnInit() : void {
    const usuario = this.authService.getUsuarioActual();
    this.nombreUsuario = this.fn.formatearNombre(usuario);
    this.cargarDashboard();
  }

  cargarDashboard() {
    this.inventarioService.getDashboard().subscribe({
      next : (data) => {
        this.datos.set(data);
        this.generarGraficoEstadoSolicitudesCompra(data);
      },
      error: (err) => {
        const msg = err.error?.mensaje || err.error?.message || 'Error con el servidor';
        this.mensaje.open('Error al cargar la información', 'warning');
        this.mensaje.open(msg, 'error');
      }
    });
  }

  generarGraficoEstadoSolicitudesCompra(data: any){
    this.chartEstadoOptions = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        top: '5%',
        left: 'center'
      },
      series: [
        {
          name: 'Estado de Solicitudes',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '70%'],
          //roseType: 'area', //
          startAngle: 180,
          endAngle: 360,
/*           itemStyle: {
            borderRadius: 8 // Bordes redondeados en los pétalos
          }, */
          data: [
            { value: data.pendientes, name: 'Pendientes', itemStyle: { color: '#ffc107' } },
            { value: data.aprobadas, name: 'Aprobadas', itemStyle: { color: '#198754' } },
            { value: data.recepcionadas, name: 'Recepcionadas', itemStyle: { color: '#0d6efd' } }
          ]
        }
      ]
    };
  }

  getIconoMovimiento(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'ENTRADA': return 'trending_up';
      case 'SALIDA': return 'trending_down';
      case 'DESPACHO': return 'local_shipping';
      default: return 'swap_horiz';
    }
  }

  getColorMovimiento(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'ENTRADA': return 'text-success bg-success-subtle';
      case 'SALIDA': return 'text-danger bg-danger-subtle';
      case 'DESPACHO': return 'text-primary bg-primary-subtle';
      default: return 'text-secondary bg-light';
    }
  }


}
