import { Component, OnInit, inject, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIcon } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

// servicios de catálogos
import { CategoriaService } from '../../../services/categoria.service';
import { ProveedorService } from '../../../services/proveedor.service';
import { UnidadMedidaService } from '../../../services/unidades-medida.service';
import { MarcaService } from '../../../services/marca.service';
import { ModeloService } from '../../../services/modelo.service';
import { Utils } from '../../../core/utils';
import { Mensaje } from '../../../core/mensaje';
import { ProductoService } from '../../../services/producto.service';
import { ProductoRegistroDTO } from '../../../models/producto';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-producto-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTooltip, MatIcon, MatSlideToggleModule, MatAutocompleteModule
  ],
  templateUrl: './producto-dialog.component.html',
})
export class ProductoDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProductoDialogComponent>);
  private cdr = inject(ChangeDetectorRef);
  public sn = inject(Utils);
  private mensaje = inject(Mensaje);
  private dialog = inject(MatDialog);

  // servicios inyectados
  private catService = inject(CategoriaService);
  private provService = inject(ProveedorService);
  private unitService = inject(UnidadMedidaService);
  private marcaService = inject(MarcaService);
  private modeloService = inject(ModeloService);
  private productoService = inject(ProductoService);

  constructor(@Inject(MAT_DIALOG_DATA) public productoData: any) {}

  esEdicion = false;
  mostrarPrecioCompra = false;
  mostrarPrecioVenta = false;
  guardando = false;
  skuPreview: string = 'XXX-XXX-XXXXX';

  // Listas para los selects
  listaCategorias: any[] = [];
  listaProveedores: any[] = [];
  listaUnidades: any[] = [];
  listaMarcas: any[] = [];
  listaModelos: any[] = [];
  listaGenericos: any[] = [];

  // Control y lista observable para autocompletar el Producto Base
  padreFiltroCtrl = new FormControl<any>('');
  genericosFiltrados!: Observable<any[]>;

  archivosSeleccionados: File[] = [];
  previsualizaciones: string[] = [];
  imagenesActuales: any[] = [];

  form: FormGroup = this.fb.group({
    nombreproducto: ['', [Validators.required]],
    skuproducto: [''],
    descripcionproducto: [''],
    serieproducto: [''],
    inventarioproducto: [''],
    preciocostoproducto: [0, [Validators.required, Validators.min(0)]],
    precioventaproducto: [0, [Validators.required, Validators.min(0)]],
    idCategoria: [null, Validators.required],
    idProveedor: [null],
    idUnidadMedida: [null, Validators.required],
    idMarca: [null, Validators.required],
    idModelo: [null, Validators.required],
    esGenerico: [false],
    idProductoPadre: [null],
    esNuevo: [true]
  });

  ngOnInit(): void {
    this.catService.getCategoriasActivas().subscribe(data => {
      this.listaCategorias = data;
      this.actualizarPreviewSKU(this.form.get('idCategoria')?.value, this.form.get('nombreproducto')?.value);
    });

    this.provService.getProveedoresActivos().subscribe(data => this.listaProveedores = data);
    this.unitService.getUnidadesMedidaActivas().subscribe(data => this.listaUnidades = data);

    // Carga de productos base con inicialización del autocompletado
    this.productoService.getProductosGenericos().subscribe(data => {
      this.listaGenericos = data.sort((a, b) =>
        a.nombreproducto.localeCompare(b.nombreproducto, 'es', { sensitivity: 'base' })
      );

      this.genericosFiltrados = this.padreFiltroCtrl.valueChanges.pipe(
        startWith(''),
        map(valor => this.filtrarGenericos(valor || ''))
      );

      // Si es edición y ya tenía producto padre, lo preseleccionamos en el input
      if (this.esEdicion && this.productoData?.producto) {
        const p = this.productoData.producto;
        const idPadre = p.productoPadre?.idProducto || p.idProductoPadre;
        if (idPadre) {
          const padreEncontrado = this.listaGenericos.find(g => g.idProducto === idPadre);
          if (padreEncontrado) {
            this.padreFiltroCtrl.setValue(padreEncontrado);
          }
        }
      }
    });

    this.marcaService.getMarcasActivas().subscribe(data => {
      this.listaMarcas = data;
    });

    if (this.productoData && this.productoData.sugerenciaParaConvertir) {
      const sug = this.productoData.sugerenciaParaConvertir;
      this.form.patchValue({
        nombreproducto: sug.nombreSugerido,
        descripcionproducto: `Sugerencia por Técnico UTDI.\nMotivo: ${sug.justificacion}`,
        idCategoria: sug.categoriaSugerida?.idCategoria
      });
    }

    this.form.valueChanges.subscribe(valores => {
      this.actualizarPreviewSKU(valores.idCategoria, valores.nombreproducto);
    });

    // Si el usuario borra todo el texto del input, desvinculamos el id
    this.padreFiltroCtrl.valueChanges.subscribe(val => {
      if (typeof val === 'string' && val.trim() === '') {
        this.form.get('idProductoPadre')?.setValue(null);
      }
    });

    this.form.get('idMarca')?.valueChanges.subscribe(idMarcaSeleccionada => {
      if (idMarcaSeleccionada) {
        this.modeloService.getModelosPorMarca(idMarcaSeleccionada).subscribe(modelos => {
          this.listaModelos = modelos;
          const idModeloActual = this.form.get('idModelo')?.value;
          if (idModeloActual && !this.listaModelos.some(m => m.idModelo === idModeloActual)) {
            this.form.get('idModelo')?.setValue(null);
          }
        });
      } else {
        this.listaModelos = [];
        this.form.get('idModelo')?.setValue(null);
      }
    });

    this.form.get('esGenerico')?.valueChanges.subscribe(esGen => {
      const marcaCtrl = this.form.get('idMarca');
      const modeloCtrl = this.form.get('idModelo');

      if (esGen) {
        this.form.get('idProductoPadre')?.setValue(null);
        this.padreFiltroCtrl.setValue('');
        marcaCtrl?.clearValidators();
        modeloCtrl?.clearValidators();
        marcaCtrl?.setValue(null);
        modeloCtrl?.setValue(null);
      } else {
        marcaCtrl?.setValidators([Validators.required]);
        modeloCtrl?.setValidators([Validators.required]);
      }

      marcaCtrl?.updateValueAndValidity();
      modeloCtrl?.updateValueAndValidity();
    });

    if (this.productoData && this.productoData.producto) {
      this.esEdicion = true;
      const p = this.productoData.producto;

      if (p.imagenes && p.imagenes.length > 0) {
        this.imagenesActuales = [...p.imagenes];
      }

      this.form.patchValue({
        nombreproducto: p.nombreproducto,
        skuproducto: p.skuproducto,
        descripcionproducto: p.descripcionproducto,
        serieproducto: p.serieproducto,
        inventarioproducto: p.inventarioproducto,
        preciocostoproducto: p.preciocostoproducto,
        precioventaproducto: p.precioventaproducto,
        idCategoria: p.categoria?.idCategoria,
        idProveedor: p.proveedor?.idProveedor,
        idUnidadMedida: p.unidadMedida?.idUnidadMedida,
        idMarca: p.modelo?.marca?.idMarca,
        esGenerico: p.esGenerico,
        idProductoPadre: p.productoPadre?.idProducto,
        esNuevo: p.esNuevo !== undefined ? p.esNuevo : false
      });

      setTimeout(() => {
        this.form.patchValue({ idModelo: p.modelo?.idModelo });
        this.actualizarPreviewSKU(this.form.get('idCategoria')?.value, this.form.get('nombreproducto')?.value);
      }, 200);

      this.form.get('precioventaproducto')?.disable();
    }
  }

  // Métodos para el Autocomplete de Producto Base
  filtrarGenericos(valor: any): any[] {
    const texto = (typeof valor === 'string' ? valor : valor?.nombreproducto || '').toLowerCase().trim();
    if (!texto) {
      return this.listaGenericos;
    }
    return this.listaGenericos.filter(g =>
      (g.nombreproducto && g.nombreproducto.toLowerCase().includes(texto)) ||
      (g.skuproducto && g.skuproducto.toLowerCase().includes(texto))
    );
  }

  displayFnPadre(item: any): string {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.nombreproducto || '';
  }

  seleccionarPadre(event: any) {
    const item = event.option.value;
    if (item && item.idProducto) {
      this.form.get('idProductoPadre')?.setValue(item.idProducto);
    } else {
      this.limpiarPadre();
    }
  }

  limpiarPadre() {
    this.padreFiltroCtrl.setValue('');
    this.form.get('idProductoPadre')?.setValue(null);
  }

  actualizarPreviewSKU(idCat: number | null, nombreProd: string | null) {
    let catStr = 'XXX';
    let nomStr = 'XXX';

    if (idCat && this.listaCategorias.length > 0) {
      const categoria = this.listaCategorias.find(c => c.idCategoria === idCat);
      if (categoria) catStr = this.generarPrefijoCategoria(categoria.nombrecategoria);
    }

    if (nombreProd) {
      nomStr = this.generarPrefijoNombre(nombreProd);
    }

    if (this.esEdicion && this.productoData?.producto) {
      const idStr = this.productoData.producto.idProducto.toString().padStart(5, '0');
      this.skuPreview = `${catStr}-${nomStr}-${idStr}`;
    } else {
      this.skuPreview = `${catStr}-${nomStr}-XXXXX`;
    }
  }

  generarPrefijoCategoria(texto: string): string {
    if (!texto) return "XXX";
    let limpio = texto.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return limpio.length >= 3 ? limpio.substring(0, 3) : limpio.padEnd(3, 'X');
  }

  generarPrefijoNombre(texto: string): string {
    if (!texto) return "XXX";
    let limpio = texto.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return limpio.length >= 3 ? limpio.substring(0, 3) : limpio.padEnd(3, 'X');
  }

  onInputMayusculas(event: Event, controlName: string) {
    const control = this.form.get(controlName);
    this.sn.convertirAMayusculas(event, control);
  }

  onFilesSelected(event: any) {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.archivosSeleccionados.push(file);
        this.previsualizaciones.push(URL.createObjectURL(file));
      }
    }
    event.target.value = '';
  }

  removerImagenNueva(index: number) {
    this.archivosSeleccionados.splice(index, 1);
    this.previsualizaciones.splice(index, 1);
  }

  eliminarImagenExistente(idImagen: number, index: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: '¿Eliminar fotografía?',
        mensaje: 'Esta acción borrará la imagen de la base de datos inmediatamente.',
        textoBoton: 'Eliminar',
        colorBoton: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.productoService.eliminarImagenProducto(idImagen).subscribe({
          next: () => {
            this.imagenesActuales.splice(index, 1);
            this.mensaje.open('Imagen eliminada correctamente', 'exito');
          },
          error: () => {
            this.mensaje.open('Error al eliminar la imagen', 'error');
          }
        });
      }
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensaje.open('Complete los campos requeridos', 'warning');
      return;
    }

    this.guardando = true;
    const valores = this.form.getRawValue();

    const productoDTO: ProductoRegistroDTO = {
      nombreproducto: valores.nombreproducto.trim(),
      skuproducto: valores.skuproducto ? valores.skuproducto.trim() : '',
      descripcionproducto: valores.descripcionproducto,
      serieproducto: valores.serieproducto,
      inventarioproducto: valores.inventarioproducto,
      preciocostoproducto: valores.preciocostoproducto,
      precioventaproducto: valores.precioventaproducto,
      idCategoria: valores.idCategoria,
      idProveedor: valores.idProveedor,
      idUnidadMedida: valores.idUnidadMedida,
      idModelo: valores.idModelo,
      esGenerico: valores.esGenerico,
      idProductoPadre: valores.esGenerico ? null : valores.idProductoPadre,
      esNuevo: valores.esNuevo
    };

    if (this.esEdicion) {
      const id = this.productoData.producto.idProducto;
      this.productoService.updateProducto(id, productoDTO, this.archivosSeleccionados).subscribe({
        next: () => {
          this.mensaje.open("Producto actualizado exitosamente", 'exito');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.guardando = false;
          const msg = err.error?.message || err.error?.mensaje || 'Error al actualizar el producto';
          this.mensaje.open(msg, 'error');
        }
      });
    } else {
      this.productoService.createProducto(productoDTO, this.archivosSeleccionados).subscribe({
        next: () => {
          this.mensaje.open('Producto registrado exitosamente', 'exito');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.guardando = false;
          const msg = err.error?.message || err.error?.mensaje || 'Error al registrar el producto';
          this.mensaje.open(msg, 'error');
        }
      });
    }
  }

  cancelar() {
    this.dialogRef.close();
  }
}
