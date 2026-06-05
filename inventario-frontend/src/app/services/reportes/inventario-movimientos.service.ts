import { inject, Injectable } from '@angular/core';
import { Utils } from '../../core/utils';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root',
})
export class InventarioMovimientosService {

  private fn = inject(Utils);

  generarPdfHistorialMovimientos(movimientos: any[], fechaInicio: string, fechaFin: string, tipoFiltro: string): string {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const opcionesFecha: Intl.DateTimeFormatOptions = {
      day: '2-digit',    // Fuerza 2 dígitos para el día (ej. 05)
      month: '2-digit',  // Fuerza 2 dígitos para el mes (ej. 06)
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true       // Formato am/pm de manera elegante
    };

    // LOGO Y CABECERA
    const logoUrl = 'assets/images/dgcp-logo.jpg';
    const img = new Image();
    img.src = logoUrl;
    doc.addImage(img, 'GIF', pageWidth - 54, 10, 40, 20);

    doc.setFontSize(16);
    doc.setTextColor(21, 56, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Historial de Movimientos', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período de consulta: Del ${fechaInicio} al ${fechaFin}`, 14, 26);
    doc.text(`Filtro de Movimiento: ${tipoFiltro.toUpperCase()}`, 14, 32);
    doc.text(`Fecha de Impresión: ${new Date().toLocaleString('es-ES', opcionesFecha)}`, 14, 38);

    // PREPARAR DATOS
    const columnas = ['Fecha y Hora', 'Tipo', 'Producto', 'Bodega', 'Cant.', 'Usuario', 'Motivo'];
    const data = movimientos.map(m => [
      new Date(m.fecha).toLocaleString('es-ES', opcionesFecha),
      m.tipo,
      m.producto?.nombreproducto || 'N/A',
      m.bodega?.nombrebodega || 'N/A',
      `${m.cantidad} ${m.producto?.unidadMedida?.abreviaturaunidadmedida?.toLowerCase() || ''}`,
      this.fn.formatearNombre(m.usuario?.nombreusuario) || 'N/A',
      m.motivo || 'N/A'
    ]);

    // DIBUJAR TABLA
    autoTable(doc, {
      startY: 45,
      head: [columnas],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [21, 56, 99], textColor: 255, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center'},
        1: { cellWidth: 'auto', halign: 'center' },
        4: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 'auto' }
      }
    });

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }
}
