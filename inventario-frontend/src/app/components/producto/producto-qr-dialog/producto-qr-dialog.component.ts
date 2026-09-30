import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as QRCode from 'qrcode';
import { Producto } from '../../../models/producto';

@Component({
  selector: 'app-producto-qr-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './producto-qr-dialog.component.html',
  styleUrls: ['./producto-qr-dialog.component.css']
})
export class ProductoQrDialogComponent implements OnInit {

  qrDataUrl = signal<string>('');
  cargandoQr = signal<boolean>(true);

  constructor(
    public dialogRef: MatDialogRef<ProductoQrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: Producto }
  ) {}

  ngOnInit(): void {
    this.generarCodigoQR();
  }

  async generarCodigoQR(): Promise<void> {
    const p = this.data.producto;
    const marca = p.modelo?.marca?.nombremarca || 'N/A';
    const modelo = p.modelo?.nombremodelo || 'N/A';
    const serie = p.serieproducto || 'S/N';
    const inv = p.inventarioproducto || 'S/I';

    // Formato legible estructurado para cualquier lector o cámara de celular, mantiene la estructura en forma de columna
    const textoQR = [
      `SKU: ${p.skuproducto}`,
      `PRODUCTO: ${p.nombreproducto}`,
      `MARCA: ${marca}`,
      `MODELO: ${modelo}`,
      `SERIE: ${serie}`,
      `INVENTARIO: ${inv}`
    ].join('\n');

    try {
      const url = await QRCode.toDataURL(textoQR, {
        width: 250,
        margin: 1.5,
        color: {
          dark: '#031e3f',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
      this.qrDataUrl.set(url);
      this.cargandoQr.set(false);
    } catch (err) {
      console.error('Error al generar QR:', err);
      this.cargandoQr.set(false);
    }
  }

  imprimirEtiqueta(): void {
    const iframeAnterior = document.getElementById('iframe-impresion-qr');
    if (iframeAnterior) {
      iframeAnterior.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'iframe-impresion-qr';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const p = this.data.producto;

    const esValorValido = (val?: string | null): boolean => {
      if (!val) return false;
      const v = val.trim().toUpperCase();
      const invalidos = ['S/I', 'S/N', 'N/A', 'SIN ESPECIFICAR', 'NO ESPECIFICADO', 'NINGUNO'];
      return v !== '' && !invalidos.includes(v);
    };

    let textoHeader = '';

    if (esValorValido(p.inventarioproducto)) {
      textoHeader = `INV: ${p.inventarioproducto!.trim()}`;
    } else if(esValorValido(p.serieproducto)) {
      textoHeader = ` ${p.serieproducto!.trim()}`;
    }
    else {
      const marcaValida = esValorValido(p.modelo?.marca?.nombremarca) ? p.modelo!.marca!.nombremarca.trim() : '';
      const modeloValido = esValorValido(p.modelo?.nombremodelo) ? p.modelo!.nombremodelo.trim() : '';

      const marcaModelo = `${marcaValida} ${modeloValido}`.trim();

      if (marcaModelo) {
        textoHeader = marcaModelo;
      } else {
        textoHeader = p.nombreproducto || 'CONTROL DE INVENTARIO - UTDI';
      }
    }


    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta QR - UTDI</title>
        <style>
            @page {
              margin: 4mm;
              size: auto;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: flex-start;
              align-items: flex-start;
              background-color: #ffffff;
            }
            .etiqueta-card {
              width: 60mm;
              border: 1.5px solid #031e3f;
              border-radius: 8px;
              padding: 8px;
              text-align: center;
              box-sizing: border-box;
            }
            .header-tag {
              font-size: 8pt;
              font-weight: 800;
              line-height: 1.15;
              letter-spacing: 0.3px;
              color: #153863;
              text-transform: uppercase;
              border-bottom: 1.5px solid #153863;
              padding-bottom: 4px;
              margin-bottom: 6px;

              /* Permite el salto de línea y rompe secuencias alfanuméricas continuas */
              white-space: normal;
              word-break: break-all;
              overflow-wrap: anywhere;
            }
            .qr-img {
              width: 46mm;
              height: 46mm;
              display: block;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="etiqueta-card">
            <div class="header-tag">${textoHeader}</div>
            <img src="${this.qrDataUrl()}" class="qr-img" alt="Código QR" />
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 1000);
    }, 250);
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
