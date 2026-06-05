import { inject, Injectable } from '@angular/core';
import { Utils } from '../../core/utils';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class InventarioBodegaService {

  private fn = inject(Utils);

  // =========================================================
  // REPORTE DE INVENTARIO POR BODEGA
  // =========================================================
  generarPdfInventarioBodega(nombreBodega: string, inventario: any[]): string {2
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
    doc.text('Reporte de Existencias', 14, 25);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Impresión: ${new Date().toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})}`, 14, 31);

    // CARD DE LA BODEGA
    doc.setDrawColor(220);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(14, 38, 182, 15, 3, 3, 'FD');

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Bodega: ${nombreBodega}`, 20, 47);

    // PREPARAR DATOS DE LA TABLA
/*     const columnas = ['#', 'SKU', 'Producto', 'Categoría', 'Stock', 'Costo Unit.', 'Valor Total']; */

    const columnas = ['#', 'SKU', 'Producto', 'Categoría', 'Stock'];

    const data = inventario.map((item, index) => [
      index + 1,
      item.producto.skuproducto,
      item.producto.nombreproducto,
      item.producto.categoria?.nombrecategoria || 'N/A',
      `${item.cantidad_actual} ${item.producto.unidadMedida?.abreviaturaunidadmedida?.toLowerCase() || ''}`
/*       `$${item.producto.preciocostoproducto.toFixed(2)}`,
      `$${(item.cantidad_actual * item.producto.preciocostoproducto).toFixed(2)}` */
    ]);

    // CALCULAR TOTAL GLOBAL
    const totalGlobal = inventario.reduce((acc, curr) =>
      acc + (curr.cantidad_actual * curr.producto.preciocostoproducto), 0
    );

    // DIBUJAR TABLA
    autoTable(doc, {
      startY: 60,
      head: [columnas],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [21, 56, 99], textColor: 255, fontStyle: 'bold',halign: 'center' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        4: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }
      }
    });

    // MOSTRAR TOTAL AL FINAL DE LA TABLA
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(0);
    // Alineado a la derecha
/*     doc.text(`VALOR TOTAL INVENTARIO: $${totalGlobal.toFixed(2)}`, 196, finalY, { align: 'right' }); */

    // PAGINACIÓN
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
