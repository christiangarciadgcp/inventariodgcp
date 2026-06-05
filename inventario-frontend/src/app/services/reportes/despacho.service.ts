import { inject, Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { DespachoReporteDTO } from '../../models/presupuesto';
import { Utils } from '../../core/utils';

@Injectable({
  providedIn: 'root',
})
export class DespachoService {
  private fn = inject(Utils);

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

// ========================================================
    // Calcular el tamaño de las observaciones
    // ========================================================
    const textoObservaciones = data.observaciones || 'No hay Observaciones';
    const maxWidth = 130; // Ancho máximo para el texto
    const lineasObservaciones = doc.splitTextToSize(textoObservaciones, maxWidth);

    // Altura aproximada por cada línea de texto
    const altoDeLinea = 5;
    // Altura total que ocupará el bloque de texto
    const alturaTotalObservaciones = (lineasObservaciones.length - 1) * altoDeLinea;

    // ========================================================
    // Dibujar la tarjeta con altura DINÁMICA
    // ========================================================
    // La tarjeta base mide unos 34 de alto. Le sumamos el exceso de las observaciones.
    const alturaDinamicaTarjeta = 34 + alturaTotalObservaciones;

    // CARD DE PROYECTO
    doc.setDrawColor(220);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(14, 38, 182, alturaDinamicaTarjeta, 3, 3, 'FD');

    // ========================================================
    // Imprimir todos los textos encima de la tarjeta
    // ========================================================

    // DATOS DE CABECERA
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text('Destino:', 20, 44);
    doc.text('Area:', 20, 50);
    doc.text('N° Solicitud:', 20, 56);
    doc.text('Solicitante:', 110, 56);
    doc.text('Despachado por:', 20, 62);
    doc.text('Fecha Presupuesto:', 110, 62);
    doc.text('Observaciones:', 20, 68);

    // VALORES
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');

    doc.text(`${data.ubicacionDestino}`, 55, 44);
    doc.text(`${data.nombreProyecto}`, 55, 50);
    doc.text(`${data.idPresupuesto}`, 55, 56);

    const nomSolicitante = this.fn.formatearNombre(data.solicitante).split(' ').slice(0, 2).join(' ');
    const nomDespachador = this.fn.formatearNombre(data.usuarioDespachado || 'Sistema');

    doc.text(nomSolicitante, 145, 56);
    doc.text(nomDespachador, 55, 62);

    const fecha = data.fechaAprobacion ? new Date(data.fechaAprobacion).toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : '---';
    doc.text(fecha, 145, 62);
    doc.text(lineasObservaciones, 55, 68);

    // La tabla empezará justo debajo de donde termina nuestra tarjeta dinámica + un margen de 5
    const startYTabla = 38 + alturaDinamicaTarjeta + 5;

// Agrupar por bodega
const groupbyBodegas = data.items.reduce((acc, item) => {
  const nombreBodega = item.bodegaOrigen || 'N/A';
  if (!acc[nombreBodega]){
    acc[nombreBodega] = [];
  }
  acc[nombreBodega].push(item);
  return acc;
}, {} as { [key: string]: typeof data.items });

// --- NUEVO: Ordenar para que "PENDIENTES DE ENTREGAR" salga siempre de primero ---
const bodegasOrdenadas = Object.keys(groupbyBodegas).sort((a, b) => {
    if (a === 'PENDIENTES DE ENTREGAR') return -1;
    if (b === 'PENDIENTES DE ENTREGAR') return 1;
    return a.localeCompare(b); // Ordena el resto alfabéticamente
});

const columnas = ['#', 'SKU', 'Producto', 'U.M.', 'Req.', 'Desp.', 'Estado'];
const bodyData: any[] = [];
let indexGlobal = 1;

// Iteramos sobre el arreglo ordenado
for (const bodega of bodegasOrdenadas) {
  const itemsDeBodega = groupbyBodegas[bodega];

  // Colores por defecto para las cabeceras de Bodega
  let fillColor: [number, number, number] = [236, 240, 241];
  let textColor: [number, number, number] = [44, 62, 80];

  // Destacar la sección de pendientes con un color rojizo suave
/*   if (bodega === 'PENDIENTES DE ENTREGAR') {
      fillColor = [253, 237, 237];
      textColor = [220, 53, 69];
  } */

  bodyData.push([
      {
          content: ` ${bodega.toUpperCase()}`,
          colSpan: 7,
          styles: {
              fillColor: fillColor,
              textColor: textColor,
              fontStyle: 'bold',
              halign: 'center',
              cellPadding: 1.5
          }
      }
  ]);

  itemsDeBodega.forEach((item) => {
      bodyData.push([
          indexGlobal++,
          item.sku || 'N/A',
          item.nombreProducto,
          item.unidadMedida,
          item.cantidadSolicitada,
          item.cantidadDespachada,
          item.estadoItem
      ]);
  });
}

autoTable(doc, {
  startY: startYTabla,
  head: [columnas],
//... (El resto de tu configuración de autoTable queda igual)
      body: bodyData,
      theme: 'grid',
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
        4: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
        5: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
        6: { halign: 'center', cellWidth: 22, fontStyle: 'bold' }
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 6 && data.cell.raw !== undefined) {
            if (data.cell.raw === 'ENTREGADO') {
                data.cell.styles.textColor = [25, 135, 84]; // Verde
            } else if (data.cell.raw === 'PENDIENTE') {
                data.cell.styles.textColor = [220, 53, 69]; // Rojo
            }
        }
      }
    });

    // --- FIRMAS ---
    const finalY = (doc as any).lastAutoTable.finalY + 30;

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);


    doc.line(20, finalY, 80, finalY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

/*    doc.text(this.fn.formatearNombre(data.usuarioDespachado), 50, finalY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');*/
    doc.text('Despachado por', 50, finalY + 5, { align: 'center' });


    doc.line(120, finalY, 180, finalY);
    doc.setFont('helvetica', 'normal');

/*    doc.text(this.fn.formatearNombre(data.solicitante), 150, finalY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');*/
    doc.text('Recibido Conforme', 150, finalY + 5, { align: 'center' });

    // --- PIE DE PÁGINA ---
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    const nombreArchivo = `Solicitud #${data.nombreProyecto}`;
    doc.setProperties({
      title: nombreArchivo
    });


    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }
}

