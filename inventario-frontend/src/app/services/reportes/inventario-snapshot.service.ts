import { Injectable } from '@angular/core';
import { Utils } from '../../core/utils';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root',
})
export class InventarioSnapshotService {

  generarSnapshotDiario(snapshot : any[], nombreBodega:string,fechaFiltro:string) : string {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const logoUrl = 'assets/images/dgcp-logo.jpg';
    const img = new Image();
    img.src = logoUrl;
    doc.addImage(img, 'GIF', pageWidth - 54, 10 ,40, 20);

    doc.setFontSize(16);
    doc.setTextColor(21,56,99);
    doc.setFont('Helvetica', 'bold');
    doc.text('Cierre de Inventario', 14,20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Bodega: ${nombreBodega}`, 14,26);
    doc.text(`Fecha: ${fechaFiltro}`, 14,32);

    const columnas = ['N°', 'SKU', 'Producto', 'Categoria', 'Stock'];
    const data = snapshot.map((s, index) => [
      index + 1,
      s.producto?.skuproducto || 'NA',
      s.producto?.nombreproducto || 'NA',
      s.producto?.categoria?.nombrecategoria || 'NA',
      `${s.cantidadactual} ${s.producto?.unidadMedida?.abreviaturaunidadmedida?.toLowerCase() || ''}`
    ]);

    autoTable(doc, {
      startY: 40,
      head : [columnas],
      body : data,
      theme: "grid",
      headStyles: { fillColor : [21,56,99], textColor : 255, fontStyle: 'bold', halign: 'center' },
      styles : {fontSize : 8, cellPadding: 2.5},
      columnStyles : {
        0 : {cellWidth: 10, halign:'center'},
        1 : {cellWidth: 'auto', halign:'center'},
        4 : {cellWidth: 25, halign:'center', fontStyle : 'bold'}
      }
    });

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

  generarExcelSnapshot(snapshot : any[], nombreBodega : string, fechaFiltro : string) : void {

    const cleanStr = (valor: any, fallback: string = '') => {
      if (valor === null || valor === undefined) return fallback;
      return String(valor).replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '').trim() || fallback;
    };

    const getNum = (valor: any) => {
      const n = Number(valor);
      return isNaN(n) ? 0 : n;
    };

    const data = snapshot.map((s, index) => ({
      'N°': index + 1,
      'Bodega': cleanStr(nombreBodega, 'N/A'),
      'Fecha': fechaFiltro,
      'SKU': cleanStr(s.producto?.skuproducto, 'N/A'),
      'Producto': cleanStr(s.producto?.nombreproducto, 'N/A'),
      'Categoría': cleanStr(s.producto?.categoria?.nombrecategoria, 'N/A'),
      'Stock al Corte': getNum(s.cantidadactual),
      'U. Medida': cleanStr(s.producto?.unidadMedida?.abreviaturaunidadmedida, 'N/A')
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 45 }, { wch: 20 }, { wch: 12 }, { wch: 10 }];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Snapshot');

    const nombreArchivo = `Snapshot_${nombreBodega.replace(/\s+/g, '_')}_${fechaFiltro.replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  }
}
