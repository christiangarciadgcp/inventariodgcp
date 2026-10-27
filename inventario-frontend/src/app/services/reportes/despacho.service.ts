import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { environment } from '../../../environments/environment.development';
import { DespachoReporteDTO } from '../../models/presupuesto';
import { Usuario } from '../../models/usuario';
import { Utils } from '../../core/utils';

@Injectable({
  providedIn: 'root',
})
export class DespachoService {
  private fn = inject(Utils);
  private http = inject(HttpClient);
  private inicialesJefe: string = '';

  constructor() {
    this.cargarInicialesJefe();
  }

  private cargarInicialesJefe(): void {
    this.http.get<Usuario[]>(`${environment.apiUrl}/usuarios`).subscribe({
      next: (usuarios) => {
        const jefe = usuarios.find(
          u => u.estado !== false && u.rol?.nombrerol?.toLowerCase().trim() === 'jefe utdi'
        );
        this.inicialesJefe = (jefe?.iniciales || '').trim();
      }
    });
  }

  // =========================================================================
  // HOJA DE DESPACHO
  // =========================================================================
  generarPdfDespacho(data: DespachoReporteDTO): string {
    const doc = new jsPDF();

    //LOGO
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

    // Título
    doc.setFontSize(18);
    doc.setTextColor(21, 56, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Hoja de Despacho', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('Control de Salida de Materiales', 14, 28);
    doc.text(`Fecha Impresión: ${new Date().toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})}`, 14, 33);

    // Observaciones
    const textoObservaciones = data.observaciones || 'No hay Observaciones';
    const maxWidth = 130;
    const lineasObservaciones = doc.splitTextToSize(textoObservaciones, maxWidth);
    const altoDeLinea = 5;
    const alturaTotalObservaciones = (lineasObservaciones.length - 1) * altoDeLinea;

    const alturaDinamicaTarjeta = 34 + alturaTotalObservaciones;

    // CARD DE PROYECTO
    doc.setDrawColor(220);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(14, 38, 182, alturaDinamicaTarjeta, 3, 3, 'FD');

    // DATOS DE CABECERA
    doc.setFontSize(10);
    doc.setTextColor(80);

    doc.text('N° Solicitud:', 20, 44);
    doc.text('Solicitante:', 110, 44);
    doc.text('Despachado por:', 20, 50);
    doc.text('Fecha Despacho:', 110, 50);
    doc.text('Destino:', 20, 56);
    doc.text('Área:', 20, 62);
    doc.text('Observaciones:', 20, 68);

    // VALORES
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');

    doc.text(`${data.idPresupuesto}`, 55, 44);

    const nomSolicitante = this.fn.formatearNombre(data.solicitante).split(' ').slice(0, 2).join(' ');
    const nomDespachador = this.fn.formatearNombre(data.usuarioDespachado || 'Sistema');

    doc.text(nomSolicitante, 145, 44);
    doc.text(nomDespachador, 55, 50);

    const fecha = data.fechaAprobacion ? new Date(data.fechaAprobacion).toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : '---';
    doc.text(fecha, 145, 50);
    doc.text(`${data.ubicacionDestino}`, 55, 56);
    doc.text(`${data.nombreProyecto}`, 55, 62);
    doc.text(lineasObservaciones, 55, 68);

    const startYTabla = 38 + alturaDinamicaTarjeta + 5;

    const columnas = ['#', 'SKU', 'Material', 'u.m.', 'Req.', 'Desp.', 'Estado'];
    const bodyData: any[] = [];
    let indexGlobal = 1;

    // --- CONSTRUCCIÓN DE LA TABLA JERÁRQUICA ---
    data.items.forEach((itemPadre) => {
      let colorEstado: [number, number, number] = [100, 100, 100];
      if (itemPadre.estadoItem === 'COMPLETADO') colorEstado = [25, 135, 84];
      if (itemPadre.estadoItem === 'PENDIENTE') colorEstado = [220, 53, 69];
      if (itemPadre.estadoItem === 'PARCIAL') colorEstado = [253, 126, 20];

      bodyData.push([
        { content: indexGlobal++, styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 242, 245] } },
        { content: '', styles: { fillColor: [240, 242, 245] } },
        { content: itemPadre.nombreGenerico, styles: { halign: 'center', fontStyle: 'italic', fillColor: [240, 242, 245] } },
        { content: itemPadre.unidadMedida, styles: { halign: 'center', fillColor: [240, 242, 245] } },
        { content: itemPadre.cantidadSolicitada, styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 242, 245] } },
        { content: itemPadre.cantidadDespachada, styles: { halign: 'center', fontStyle: 'bold', textColor: [25, 135, 84], fillColor: [240, 242, 245] } },
        { content: itemPadre.estadoItem, styles: { halign: 'center', fontStyle: 'bold', textColor: colorEstado, fillColor: [240, 242, 245] } }
      ]);

      if (itemPadre.entregasFisicas && itemPadre.entregasFisicas.length > 0) {
        itemPadre.entregasFisicas.forEach(sub => {
          bodyData.push([
            '',
            { content: sub.skuFisico, styles: { textColor: [80, 80, 80], fontStyle: 'bold' } },
            { content: `${sub.nombreFisico}\n${sub.bodegaOrigen}`, styles: { textColor: [80, 80, 80], fontStyle: 'normal' } },
            '',
            '',
            { content: sub.cantidad, styles: { halign: 'center', textColor: [25, 135, 84], fontStyle: 'bold' } },
            ''
          ]);
        });
      }
    });

    autoTable(doc, {
      startY: startYTabla,
      head: [columnas],
      body: bodyData,
      theme: 'grid',
      margin: { bottom: 45 },
      headStyles: {
        fillColor: [21, 56, 99],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'left', cellWidth: 30 },
        2: { halign: 'left', cellWidth: 'auto' },
        3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'center', cellWidth: 12 },
        5: { halign: 'center', cellWidth: 12 },
        6: { halign: 'center', cellWidth: 25 }
      }
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    const finalY = pageHeight - 30;

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);

    doc.line(20, finalY, 80, finalY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Despachado por', 50, finalY + 5, { align: 'center' });

    doc.line(120, finalY, 180, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text('Recibido Conforme', 150, finalY + 5, { align: 'center' });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    const nombreArchivo = `Solicitud #${data.nombreProyecto}`;
    doc.setProperties({ title: nombreArchivo });

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }


}
