import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Asignacion, AsignacionDetalle } from '../../models/asignacion';

@Injectable({
  providedIn: 'root',
})
export class AsignacionActaService {

  generarActaPdf(asignacion: Asignacion, detalles: AsignacionDetalle[]): string {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const primaryColor: [number, number, number] = [3, 30, 63];
    const secondaryNavy: [number, number, number] = [21, 56, 99];
    const grayText: [number, number, number] = [100, 116, 139];

    // ==========================================
    // 1. ENCABEZADO INSTITUCIONAL
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('UNIDAD DE TECNOLOGÍA Y DESARROLLO INFORMÁTICO', 14, 18);


    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
    doc.text('ACTA DE ASIGNACIÓN Y ENTREGA DE EQUIPOS', 14, 29);

    // Cuadro con N° de Acta (Superior Derecha)
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(150, 12, 52, 6, 'F');

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTA N°', 176, 16.5, { align: 'center' });

    doc.setFillColor(248, 250, 252);
    doc.rect(150, 18, 52, 9, 'FD');
    doc.setFontSize(11);
    doc.setTextColor(185, 28, 28);
    doc.text(asignacion.numeroActa || 'SIN NÚMERO', 176, 24, { align: 'center' });

    // Línea divisoria superior
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.8);
    doc.line(14, 33, 202, 33);

    // ==========================================
    // 2. METADATOS DE LA ASIGNACIÓN (TABLA)
    // ==========================================
    const fechaAsignacion = new Date(asignacion.fechaAsignacion).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    autoTable(doc, {
      startY: 37,
      margin: { left: 14, right: 14 },
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 2, textColor: [30, 41, 59] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 42, fillColor: [241, 245, 249] },
        1: { cellWidth: 55 },
        2: { fontStyle: 'bold', cellWidth: 38, fillColor: [241, 245, 249] },
        3: { cellWidth: 53 }
      },
      body: [
        ['TIPO DE ASIGNACIÓN:', asignacion.tipoAsignacion?.nombre || 'N/A', 'FECHA:', fechaAsignacion],
        ['RESPONSABLE / DESTINO:', asignacion.responsableDestino, 'ESTADO SOLICITUD:', asignacion.estado],
        ['OBSERVACIONES:', { content: asignacion.observaciones || 'Ninguna observación registrada.', colSpan: 3 }]
      ]
    });

    const finalYInfo = (doc as any).lastAutoTable.finalY + 5;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bolditalic');
    doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
    doc.text('Detalle de equipos y materiales asignados:', 14, finalYInfo);

    // ==========================================
    // 3. TABLA DE EQUIPOS / DETALLE
    // ==========================================
    const filasTabla = detalles.map((d, index) => [
      (index + 1).toString(),
      d.producto?.nombreproducto || 'N/A',
      d.producto?.modelo?.marca?.nombremarca || 'N/A',
      d.producto?.modelo?.nombremodelo || 'N/A',
      d.producto?.serieproducto || 'S/N',
      d.producto?.inventarioproducto || 'S/I',
      // d.bodegaOrigen?.nombrebodega || 'N/A',
      d.estado
    ]);

    autoTable(doc, {
      startY: finalYInfo + 3,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      head: [['N°', 'EQUIPO', 'MARCA', 'MODELO', 'SERIE', 'INVENTARIO', 'ESTADO']],
      body: filasTabla,
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [33, 37, 41],
        valign: 'middle'
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 50, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 30 },
        4: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
        5: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
        //6: { cellWidth: 22 },
        6: { halign: 'center', cellWidth: 22, fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 6) {
          if (data.cell.raw === 'ASIGNADO') {
            data.cell.styles.textColor = [15, 81, 50]; // Verde
          } else if (data.cell.raw === 'DEVUELTO') {
            data.cell.styles.textColor = [132, 32, 41]; // Rojo
          }
        }
      }
    });

    const finalYTabla = (doc as any).lastAutoTable.finalY + 8;

    // ==========================================
    // 4. CLÁUSULA DE RESPONSABILIDAD
    // ==========================================
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    const clausula = 'El destinatario asume la custodia, conservación y uso institucional exclusivo de los bienes relacionados en esta acta. Cualquier falla, traslado físico o requerimiento de devolución deberá tramitarse formalmente ante la Unidad de Tecnología (UTDI).';
    doc.text(clausula, 14, finalYTabla, { maxWidth: 188, align: 'justify' });

    // ==========================================
    // 5. BLOQUE DE FIRMAS
    // ==========================================
    const yFirmas = finalYTabla + 28;

    // Firma 1: Técnico / Solicitante
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.line(16, yFirmas, 68, yFirmas);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(asignacion.usuarioCreacion?.nombreusuario || 'ENTREGADO POR', 42, yFirmas + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text('Técnico / Encargado UTDI', 42, yFirmas + 8, { align: 'center' });

    // Firma 2: Receptor / Responsable
    doc.line(78, yFirmas, 138, yFirmas);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(asignacion.responsableDestino, 108, yFirmas + 4, { align: 'center', maxWidth: 58 });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text('Recibido Conforme (Responsable)', 108, yFirmas + 8, { align: 'center' });

    // Firma 3: Jefe UTDI / Aprobación
    doc.line(148, yFirmas, 200, yFirmas);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(asignacion.usuarioAprobacion?.nombreusuario || 'AUTORIZADO', 174, yFirmas + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text('Jefe / Coordinador UTDI', 174, yFirmas + 8, { align: 'center' });

    return doc.output('bloburl').toString();
  }
}
