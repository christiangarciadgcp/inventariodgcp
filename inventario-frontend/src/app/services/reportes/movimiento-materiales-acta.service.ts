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
export class MovimientoMaterialesActaService {

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

  /**
   * Asegura que la unidad de medida se muestre siempre como símbolo
   */
  private obtenerSimboloUnidad(unidad?: string): string {
    if (!unidad) return 'u';
    const limpio = unidad.trim().toLowerCase();
    const mapaSimbolos: Record<string, string> = {
      'unidad': 'u',
      'unidades': 'u',
      'unid': 'u',
      'metro': 'm',
      'metros': 'm',
      'caja': 'cja',
      'cajas': 'cja',
      'rollo': 'rll',
      'rollos': 'rll',
      'galon': 'gal',
      'galón': 'gal',
      'litro': 'l',
      'litros': 'l',
      'paquete': 'paq',
      'kit': 'kit',
      'par': 'par',
      'bote': 'bote'
    };
    return mapaSimbolos[limpio] || limpio;
  }

  // =========================================================================
  // ACTA DE MOVIMIENTO DE MATERIALES
  // =========================================================================
  generarActaMovimientoMaterialesPdf(datos: DespachoReporteDTO): string {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const primaryColor: [number, number, number] = [3, 30, 63];
    const grayText: [number, number, number] = [100, 116, 139];
    const blackColor: [number, number, number] = [0, 0, 0];
    const pageWidth = 215.9;
    const centroPagina = pageWidth / 2;
    const LIMITE_INFERIOR_PAGINA = 246;

    // LOGO INSTITUCIONAL
    const logoWidth = 50;
    const logoHeight = 25;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = 12;

    try {
      doc.addImage('assets/images/dgcp-logo.jpg', 'JPEG', logoX, logoY, logoWidth, logoHeight);
    } catch (e) {
      console.warn('No se pudo cargar el logo institucional:', e);
    }

    // CUADRO N° OFICIO
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(150, 12, 52, 6, 'F');

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('INFO N°', 176, 16.5, { align: 'center' });

    doc.setFillColor(248, 250, 252);
    doc.rect(150, 18, 52, 9, 'FD');
    doc.setFontSize(11);
    doc.setTextColor(185, 28, 28);
    doc.text(datos.numeroActa || 'SIN NÚMERO', 176, 24, { align: 'center' });

    // TÍTULO CENTRADO ACTA DE MOVIMIENTO DE MATERIALES
    const yTitulo = logoY + logoHeight + 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('ACTA DE MOVIMIENTO DE MATERIALES', centroPagina, yTitulo, { align: 'center' });

    //FECHA DE SALIDA (ÚLTIMO DESPACHO), LUGAR DE ORIGEN Y LUGAR DE DESTINO
    const fechaReferencia = datos.fechaSalida || (datos as any).fechaUltimoDespacho || datos.fechaAprobacion;
    const fechaObj = fechaReferencia ? new Date(fechaReferencia) : new Date();
    const fechaSalidaTexto = fechaObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const yInfo = yTitulo + 9;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.text('FECHA DE SALIDA:', 14, yInfo);
    doc.setFont('helvetica', 'normal');
    doc.text(fechaSalidaTexto, 50, yInfo);

    doc.setFont('helvetica', 'bold');
    doc.text('LUGAR DE ORIGEN:', 14, yInfo + 6);
    doc.setFont('helvetica', 'normal');
    doc.text('UNIDAD DE TECNOLOGÍA Y DESARROLLO INFORMÁTICO', 50, yInfo + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('LUGAR DE DESTINO:', 14, yInfo + 12);

    doc.setFont('helvetica', 'normal');
    const textoDestino = datos.nombreUbicacionDestino || datos.ubicacionDestino || 'N/A';
    const anchoMaximoDestino = 152;
    const lineasDestino = doc.splitTextToSize(textoDestino, anchoMaximoDestino);
    doc.text(lineasDestino, 50, yInfo + 12);

    // Altura calculada según la cantidad de líneas del destino
    const altoLineasDestino = (lineasDestino.length - 1) * 4.5;
    const yInicioTabla = yInfo + 12 + altoLineasDestino + 6;

    const listaMateriales: any[] = [];
    const listaEquipos: any[] = [];

    (datos.items || []).forEach((itemPadre) => {
      const simbolo = this.obtenerSimboloUnidad((itemPadre as any).abreviaturaUnidadMedida || itemPadre.unidadMedida);

      (itemPadre.entregasFisicas || []).forEach((sub) => {
        const esMaterial = sub.esMaterial !== false;
        const simboloSub = (sub as any).abreviaturaUnidadMedida
          ? this.obtenerSimboloUnidad((sub as any).abreviaturaUnidadMedida)
          : simbolo;

        const fila = {
          cantidadTexto: `${sub.cantidad} ${simboloSub}`,
          nombre: sub.nombreFisico || itemPadre.nombreGenerico,
          modelo: esMaterial ? '****' : ((sub.modelo && sub.modelo !== 'SIN ESPECIFICAR') ? sub.modelo : 'N/A'),
          serie: esMaterial ? '****' : (sub.serie || 'S/N'),
          inventario: esMaterial ? '****' : (sub.inventario || 'S/I'),
          esMaterial
        };

        if (esMaterial) {
          listaMateriales.push(fila);
        } else {
          listaEquipos.push(fila);
        }
      });
    });

    const todosLosItems = [...listaMateriales, ...listaEquipos];

    const bodyTabla = todosLosItems.map(item => [
      item.cantidadTexto,
      item.nombre,
      item.modelo,
      item.serie,
      item.inventario
    ]);

    autoTable(doc, {
      startY: yInicioTabla,
      margin: { left: 14, right: 14, top: 20, bottom: 32 },
      theme: 'grid',
      head: [['CANTIDAD', 'DESCRIPCION', 'MODELO', 'SERIE', ' # DE INVENTARIO']],
      body: bodyTabla,
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: blackColor,
        valign: 'middle',
        lineColor: blackColor,
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: false,
        textColor: blackColor,
        fontStyle: 'bold',
        halign: 'center',
        lineColor: blackColor,
        lineWidth: 0.1
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20, fontStyle: 'normal' },
        1: { halign: 'left', cellWidth: 76, fontStyle: 'normal' },
        2: { halign: 'center', cellWidth: 32 },
        3: { halign: 'center', cellWidth: 30, fontStyle: 'normal' },
        4: { halign: 'center', cellWidth: 30, fontStyle: 'normal' }
      }
    });

    // =========================================================================
    // APARTADO DE ACLARACIÓN
    // =========================================================================
    const textoAclaracion = 'ACLARACIÓN: El cuido, resguardo, custodia y adecuado manejo de los bienes y materiales detallados en la presente acta quedan bajo la estricta responsabilidad del personal y de la dependencia receptora, debiendo ser utilizados exclusivamente para las actividades y fines oficiales asignados, debiendo notificar de forma inmediata a la Unidad de Tecnología y Desarrollo Informático sobre cualquier anomalía, daño, traslado o extravío de los mismos.';

    const lineasAclaracion = doc.splitTextToSize(textoAclaracion, 188);
    const altoAclaracion = lineasAclaracion.length * 3.4;

    let yInicioAclaracion = (doc as any).lastAutoTable.finalY + 6;

    if (yInicioAclaracion + altoAclaracion > LIMITE_INFERIOR_PAGINA) {
      doc.addPage();
      yInicioAclaracion = 20;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.text(lineasAclaracion, 14, yInicioAclaracion, { align: 'justify', maxWidth: 188 });

    const yFinAclaracion = yInicioAclaracion + altoAclaracion;


    // =========================================================================
    // OBSERVACIONES
    // =========================================================================
    const obsTexto = datos.observaciones?.trim() || 'Sin observaciones registradas.';
    const xTextoObs = 45;
    const anchoDisponibleObs = 202 - xTextoObs; // 158 mm disponibles hasta el margen derecho
    const lineasObs = doc.splitTextToSize(obsTexto, anchoDisponibleObs);
    const altoObservaciones = Math.max(1, lineasObs.length) * 4;

    let yInicioObservaciones = yFinAclaracion + 6;

    if (yInicioObservaciones + altoObservaciones > LIMITE_INFERIOR_PAGINA) {
      doc.addPage();
      yInicioObservaciones = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.text('OBSERVACIONES:', 14, yInicioObservaciones);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(lineasObs, xTextoObs, yInicioObservaciones);

    const yFinObservaciones = yInicioObservaciones + altoObservaciones;

    // SECCIÓN DE DOS FIRMAS PARALELAS (ENTREGA Y RECIBE)
    const altoFirmaRequerido = 38;
    let yLineaFirma: number;

    if (yFinObservaciones + altoFirmaRequerido > LIMITE_INFERIOR_PAGINA) {
      doc.addPage();
      yLineaFirma = 55;
    } else {
      yLineaFirma = yFinObservaciones + 28;
    }

    const anchoLineaFirma = 72;
    const xCentroEntrega = 60;
    const xCentroRecibe = 156;
    const xInicioFirmaRecibe = xCentroRecibe - (anchoLineaFirma / 2);

    doc.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.setLineWidth(0.35);

    doc.line(
      xCentroEntrega - (anchoLineaFirma / 2),
      yLineaFirma,
      xCentroEntrega + (anchoLineaFirma / 2),
      yLineaFirma
    );

    const nombreEntrega = 'José Oscar Rafael Díaz García';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.text('F. RESPONSABLE QUE ENTREGA', xCentroEntrega, yLineaFirma + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.text(nombreEntrega, xCentroEntrega, yLineaFirma + 8.5, { align: 'center' });


    // --- Firma Derecha: Responsable que Recibe ---
    doc.line(
      xInicioFirmaRecibe,
      yLineaFirma,
      xCentroRecibe + (anchoLineaFirma / 2),
      yLineaFirma
    );

    const nombreRecibe = 'NOMBRE:';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.text('F. RESPONSABLE QUE RECIBE', xCentroRecibe, yLineaFirma + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.text('NOMBRE:', xInicioFirmaRecibe, yLineaFirma + 8.5, { align: 'left' });


    // 8. PIE DE PÁGINA (INICIALES JEFE/USUARIO DEBAJO DE LA LÍNEA + DIRECCIÓN)
    const inicialesCreacion = (datos.inicialesUsuarioActa || '').trim();
    const inicialesActa = [this.inicialesJefe, inicialesCreacion]
      .filter(ini => ini.length > 0)
      .join('/');

    const lineasDireccion = [
      'Unidad de Tecnología y Desarrollo Informático',
      'Colonia El Rosal 49 Av. Sur #752, Edificio PROMERCAN, San Salvador',
      'www.dgcp.gob.sv'
    ];

    const totalPaginas = doc.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      doc.line(90, 260, 125, 260);

      if (inicialesActa) {
        doc.setFont('helvetica', 'bold');
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
      doc.text(lineasDireccion[1], centroPagina, 266.5, { align: 'center' });
      doc.text(lineasDireccion[2], centroPagina, 270, { align: 'center' });
    }

    return doc.output('bloburl').toString();
  }
}
