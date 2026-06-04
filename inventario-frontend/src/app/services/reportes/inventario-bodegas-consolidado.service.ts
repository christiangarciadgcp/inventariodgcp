import { inject, Injectable } from '@angular/core';
import { Utils } from '../../core/utils';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class InventarioBodegasConsolidadoService {

  private fn = inject(Utils);

  // =========================================================
  // REPORTE DE INVENTARIO CONSOLIDADO (TODAS LAS BODEGAS)
  // =========================================================
  generarPdfInventarioConsolidado(inventario: any[]): string {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // LOGO
    const logoUrl = 'assets/images/dgcp-logo.jpg';
    const img = new Image();
    img.src = logoUrl;
    doc.addImage(img, 'GIF', pageWidth - 54, 10, 40, 20);

    // CABECERA
    doc.setFontSize(18);
    doc.setTextColor(21, 56, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte Consolidado de Inventario', 14, 25);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Impresión: ${new Date().toLocaleString()}`, 14, 31);
    doc.text('Solo productos con existencias reales a nivel global.', 14, 36);

    // PREPARAR DATOS DE LA TABLA (Añadiendo la columna de Bodega)
    const columnas = ['#', 'Bodega', 'SKU', 'Producto', 'Categoría', 'Stock'];

    const data = inventario.map((item, index) => [
      index + 1,
      item.bodega?.nombrebodega || 'N/A',
      item.producto?.skuproducto,
      item.producto?.nombreproducto,
      item.producto?.categoria?.nombrecategoria || 'N/A',
      `${item.cantidad_actual} ${item.producto?.unidadMedida?.abreviaturaunidadmedida?.toLowerCase() || ''}`
    ]);

    // DIBUJAR TABLA CON AUTOTABLE
    autoTable(doc, {
      startY: 42,
      head: [columnas],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [21, 56, 99], textColor: 255, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'wrap', halign: 'left' },
        5: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }
      }
    });

    // PAGINACIÓN TRASERA
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

}
