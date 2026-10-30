import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Asignacion, AsignacionDetalle } from '../../models/asignacion';
import { Utils } from '../../core/utils';
import {TipoAsignacionService} from '../tipo-asignacion.service';
import { TipoAsignacion } from '../../models/tipo-asignacion';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment.development';
import {Usuario} from '../../models/usuario';

@Injectable({
  providedIn: 'root',
})
export class AsignacionActaService {

  private utils = inject(Utils);
  private tipoAsignacionService = inject(TipoAsignacionService);
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  private inicialesJefe: string = '';

  constructor() {
    this.cargarDatosIniciales();
  }

  private cargarDatosIniciales(): void {

    this.http.get<Usuario[]>(this.apiUrl).subscribe({
      next: (usuarios) => {
        const jefe = usuarios.find(
          u => u.estado !== false && u.rol?.nombrerol?.toLowerCase().trim() === 'jefe utdi'
        );
        this.inicialesJefe = (jefe?.iniciales || '').trim();
      }
    });
  }

  generarActaPdf(asignacion: Asignacion, detalles: AsignacionDetalle[]): string {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const primaryColor: [number, number, number] = [0, 0, 0];
    const secondaryNavy: [number, number, number] = [21, 56, 99];
    const grayText: [number, number, number] = [100, 116, 139];
    const pageWidth = 215.9; // Ancho carta en mm
    const pageHeight = 279.4; // Alto carta en mm
    const LIMITE_INFERIOR_PAGINA = 246;

    // ==========================================
    // LOGO DGCP
    // ==========================================
    const logoWidth = 50;
    const logoHeight = 25;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = 12;

    try {
      doc.addImage('assets/images/dgcp-logo.jpg', 'JPEG', logoX, logoY, logoWidth, logoHeight);
    } catch (e) {
      console.warn('No se pudo cargar el logo en el reporte:', e);
    }

    // ==========================================
    // CUADRO N° DE ACTA (SUPERIOR DERECHA)
    // ==========================================
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

    // ==========================================
    // TÍTULO CENTRADO
    // ==========================================
    const yTitulo = logoY + logoHeight + 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('SOLICITUD DE MOVIMIENTO DE EQUIPO', pageWidth / 2, yTitulo, { align: 'center' });

    // ==========================================
    // FECHA DE ASIGNACIÓN
    // ==========================================
    const fechaObj = asignacion.fechaAsignacion ? new Date(asignacion.fechaAsignacion) : new Date();
    const fechaAsignacion = fechaObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const yFecha = yTitulo + 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`San Salvador, ${fechaAsignacion}`, 202, yFecha, { align: 'right' });

    // ==========================================
    // DATOS DEL ENCARGADO
    // ==========================================
    const yNombre = yFecha + 15;
    const nombreResponsable = 'Mauricio Gustavo Toledo López'

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(nombreResponsable, 14, yNombre);

    const yCargo = yNombre + 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Encargado de la Unidad de Registro y Control de Activo Fijo', 14, yCargo);

    const yPresente = yCargo + 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Presente', 14, yPresente);

    // ==========================================
    // TEXTO INTRODUCTORIO
    // ==========================================
    const yTextoDetalle = yPresente + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Atentamente, se solicita que para este día se realice Acta de Movimiento de Bienes del Equipo que a continuación se detalla:', 14, yTextoDetalle);

    const yTipoMov = yTextoDetalle + 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Tipo de Movimiento: ', 14, yTipoMov);

    const anchoEtiqueta = doc.getTextWidth('Tipo de Movimiento: ');
    const tipoMovimiento = (asignacion.tipoAsignacion?.nombre || 'N/A').toUpperCase();
    const xTipoMov = 14 + anchoEtiqueta;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(tipoMovimiento, xTipoMov, yTipoMov);


    const anchoTexto = doc.getTextWidth(tipoMovimiento);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.35); // Grosor del trazo
    doc.line(xTipoMov, yTipoMov + 1, xTipoMov + anchoTexto, yTipoMov + 1); // 1 mm debajo de la línea base


    // ==========================================
    // TABLA DE EQUIPOS CON DESTINO UNIFICADO
    // ==========================================
    // Se extrae la ubicación seleccionada
    const destinoTexto = asignacion.ubicacion?.nombreubicacion ? asignacion.ubicacion.nombreubicacion : 'N/A';

    const totalFilas = detalles.length;

    // Se construye la tabla con rowSpan en la primera fila para la columna DESTINO
    const filasTabla = detalles.map((d, index) => {
      const fila: any[] = [
        (index + 1).toString(),
        d.producto?.nombreproducto || 'N/A',
        d.producto?.modelo?.marca?.nombremarca || 'N/A',
        d.producto?.modelo?.nombremodelo || 'N/A',
        d.producto?.serieproducto || 'S/N',
        d.producto?.inventarioproducto || 'S/I'
      ];

      // En la fila inicial se asigna el rowSpan para cubrir todas las filas de la tabla
      if (index === 0) {
        fila.push({
          content: destinoTexto,
          rowSpan: totalFilas > 0 ? totalFilas : 1,
          styles: {
            valign: 'middle',
            halign: 'center',
            fontStyle: 'bold',
            textColor: primaryColor
          }
        });
      }

      return fila;
    });

    autoTable(doc, {
      startY: yTipoMov + 4,
      margin: { left: 14, right: 14, top: 20, bottom: 32 },
      theme: 'grid',
      head: [['N°', 'EQUIPO', 'MARCA', 'MODELO', 'SERIE', 'INVENTARIO', 'DESTINO']],
      body: filasTabla,
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: primaryColor,
        valign: 'middle',
        lineColor: primaryColor,
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: false,
        textColor: primaryColor,
        fontStyle: 'bold',
        halign: 'center',
        lineColor: primaryColor,
        lineWidth: 0.1
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 }, // NUMERO
        1: { halign: 'left', cellWidth: 40, fontStyle: 'bold' }, // NOMBRE DE EQUIPO
        2: { halign: 'center', cellWidth: 26 }, // MARCA
        3: { halign: 'center', cellWidth: 26 }, // MODELO
        4: { halign: 'center', cellWidth: 30, fontStyle: 'normal' }, // SERIE
        5: { halign: 'center', cellWidth: 30, fontStyle: 'normal' }, // INVENTARIO
        6: { halign: 'center', cellWidth: 30 } // DESTINO
      }
    });

// ==========================================
    // OBSERVACIONES (STRING DIRECTO)
    // ==========================================
    const obsTexto = asignacion.observaciones?.trim() || 'Sin observaciones registradas.';
    const lineasObs = doc.splitTextToSize(obsTexto, 188);
    const altoObservaciones = 6 + (lineasObs.length * 3.8);

    let yInicioObservaciones = (doc as any).lastAutoTable.finalY + 7;

    // Si las observaciones no caben antes del pie de página, pasarlas a la siguiente
    if (yInicioObservaciones + altoObservaciones > LIMITE_INFERIOR_PAGINA) {
      doc.addPage();
      yInicioObservaciones = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('OBSERVACIONES:', 14, yInicioObservaciones);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(lineasObs, 14, yInicioObservaciones + 4.5);

    const yFinObservaciones = yInicioObservaciones + 4.5 + (lineasObs.length * 3.8);


    // ==========================================
    // EVALUACIÓN Y SECCIÓN DE FIRMA CENTRADA
    // ==========================================
    const altoFirmaRequerido = 35;
    let yLineaFirma: number;

    if (yFinObservaciones + altoFirmaRequerido > LIMITE_INFERIOR_PAGINA) {
      doc.addPage();
      yLineaFirma = 55;
    } else {
      yLineaFirma = yFinObservaciones + 40;
    }

    const centroPagina = pageWidth / 2;
    const anchoLineaFirma = 75;


    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('José Oscar Rafael Díaz García', centroPagina, yLineaFirma + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Jefe Unidad de Tecnología y Desarrollo Informático', centroPagina, yLineaFirma + 8.5, { align: 'center' });

    // ==========================================
    // PIE DE PÁGINA
    // ==========================================
    const lineasDireccion = [
      'Unidad de Tecnología y Desarrollo Informático',
      'Colonia El Rosal 49 Av. Sur #752, Edificio PROMERCAN, San Salvador',
      'www.dgcp.gob.sv'
    ];

    const inicialesCreacion = (asignacion.usuarioCreacion?.iniciales || '').trim();

    const inicialesActa = [this.inicialesJefe, inicialesCreacion]
      .filter(ini => ini.length > 0)
      .join('/');

    const totalPaginas = doc.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);


      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      doc.line(90, 260, 125, 260);

      if (inicialesActa) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(inicialesActa, 14, 266.5);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text(lineasDireccion[0], centroPagina, 263, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      doc.text(lineasDireccion[1], centroPagina, 266.5, { align: 'center' });
      doc.text(lineasDireccion[2], centroPagina, 270, { align: 'center' });
    }

    return doc.output('bloburl').toString();
  }
}
