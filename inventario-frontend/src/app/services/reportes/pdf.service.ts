import { inject, Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { SolicitudCompra, SolicitudCompraDetalle } from '../../models/solicitud-compra';
import { Utils } from '../../core/utils';

@Injectable({
  providedIn: 'root',
})
export class PdfService {

  constructor() {}

  private fn = inject(Utils);

  generarPdfSolicitud(solicitud: SolicitudCompra, detalles:SolicitudCompraDetalle[]): string{
    const doc = new jsPDF();

    // POSICIÓN PARA EL LOGO
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const logoWidth = 40;
    const logoHeight = 20;
    const xPos = pageWidth - logoWidth - margin;
    const yPos = 10;
    const logoUrl = 'assets/images/dgcp-logo.jpg';

    const img = new Image();
    img.src = logoUrl;

    doc.addImage(img, 'GIF', xPos, yPos, logoWidth, logoHeight);


    // CABECERA DE LA SOLICITUD
    doc.setFontSize(18);
    doc.setTextColor(21, 56, 99);
    doc.setFont('helvetica', 'bold');
    //doc.text('INVENTARIO UTDI', 14, 20);
    doc.text('Reporte de Solicitud de Compra', 14, 25);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Impresión: ${new Date().toLocaleString()}`, 14, 31);

    // CARD DATOS DE LA SOLICITUD
    doc.setDrawColor(220);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(14, 38, 182, 35, 3, 3, 'FD');

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    //doc.text(`Solicitud de Compra ${solicitud.idSolicitudCompra} - ${solicitud.nombresolicitud}`, 20, 48);
    doc.text(`Solicitud de Compra: ${solicitud.nombresolicitud}`, 20, 48);

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Solicitante:`, 20, 56);
    doc.text(`Destino:`, 100, 56);
    doc.text(`Estado:`, 20, 64);
    doc.text(`Fecha Creación:`, 100, 64);

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(this.fn.formatearNombre(solicitud.idusuariosolicitante.nombreusuario), 45, 56);
    doc.text(solicitud.idbodegadestino.nombrebodega, 120, 56);
    doc.text(this.fn.formatearEstado(solicitud.estado), 45, 64);
    doc.text(new Date(solicitud.fechacreacionsolicitud!).toLocaleString(), 130, 64);

    //AGREGAR LOS PRODUCTOS AL DETALLE
    const columnas = ['#', 'SKU', 'Producto', 'Req.', 'Rec.', 'Rest.', 'Estado'];
    const data = detalles.map((item,index) => [
      index + 1,
      item.producto.skuproducto,
      item.producto.nombreproducto,
      item.cantidad_solicitada,
      item.cantidad_recibida,
/*    `$${item.producto.preciocostoproducto.toFixed(2)}`,*/
      (item.cantidad_solicitada - item.cantidad_recibida),
      ((item.cantidad_solicitada - item.cantidad_recibida) <= 0 ? "ENTREGADO" : "PENDIENTE")
    ]);

    //CALCULAR EL TOTAL DEL DETALLE DE PRODUCTOS
    const total = detalles.reduce((acc,curr) => acc + (curr.cantidad_solicitada * curr.producto.preciocostoproducto),0);

    //DIBUJAR LA TABLA
    autoTable(doc, {
      startY: 80,
      head: [columnas],
      body: data,
      theme: 'striped',
      headStyles: { fillColor: [21, 56, 99], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center', fontStyle: 'bold' },
        6: { halign: 'center', fontStyle: 'bold' }
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 6 && data.cell.raw !== undefined) {
          if (data.cell.raw === 'ENTREGADO') {
            data.cell.styles.textColor = [25, 135, 84]; // Verde
          } else if (data.cell.raw === 'PENDIENTE') {
            data.cell.styles.textColor = [220, 53, 69]; // Rojo
          }
        }
      },
      didDrawPage: (data) => {
        // Footer
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

/*    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL ESTIMADO: $${total.toFixed(2)}`, 140, finalY, { align: 'left' });*/

    // FIRMAS
    doc.setDrawColor(0);
    doc.line(20, finalY + 40, 80, finalY + 40);
    doc.line(120, finalY + 40, 180, finalY + 40);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Firma Solicitante', 35, finalY + 45);
    doc.text('Firma Autorización', 135, finalY + 45);

    const nombreArchivo = `Solicitud #${solicitud.idSolicitudCompra} - ${solicitud.nombresolicitud}`;
    doc.setProperties({
      title: nombreArchivo
    });

    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);


    //window.open(doc.output('bloburl'), '_blank');
    //GUARDAR EL ARCHIVO CON SU NOMBRE
    //doc.save(nombreArchivo);

  }

}
