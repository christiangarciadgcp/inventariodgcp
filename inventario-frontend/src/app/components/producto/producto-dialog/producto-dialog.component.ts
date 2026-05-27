import { Component, OnInit, inject,ChangeDetectorRef, Inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {MatTooltip} from '@angular/material/tooltip';

// servicios de catálogos
import { CategoriaService } from '../../../services/categoria.service';
import { ProveedorService } from '../../../services/proveedor.service';
import { UnidadMedidaService } from '../../../services/unidades-medida.service';
import { MarcaService } from '../../../services/marca.service';
import { ModeloService } from '../../../services/modelo.service';
import { Utils } from '../../../core/utils';
import { Mensaje } from '../../../core/mensaje';
import { ProductoService } from '../../../services/producto.service';
import {ProductoRegistroDTO} from '../../../models/producto';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-producto-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltip, MatIcon
  ],
  templateUrl: './producto-dialog.component.html',
  //styleUrl: './producto-dialog.component.css',
})
export class ProductoDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProductoDialogComponent>);
  private cdr = inject(ChangeDetectorRef);
  public sn = inject(Utils);
  private mensaje = inject(Mensaje);

  // servicios inyectados
  private catService = inject(CategoriaService);
  private provService = inject(ProveedorService);
  private unitService = inject(UnidadMedidaService);
  private marcaService = inject(MarcaService);
  private modeloService = inject(ModeloService);
  private productoService = inject(ProductoService);

  constructor(@Inject(MAT_DIALOG_DATA) public productoData:any) {}

  esEdicion=false;
  mostrarPrecioCompra=false;
  mostrarPrecioVenta=false;
  guardando=false;
  skuPreview : string = 'XXX-XXX-XXXXX';

  // Listas para los selects
  listaCategorias: any[] = [];
  listaProveedores: any[] = [];
  listaUnidades: any[] = [];
  listaMarcas: any[] = [];
  listaModelos: any[] = [];

  archivosSeleccionados: File[] = [];
  previsualizaciones: string[] = [];


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
    idMarca : [null, Validators.required],
    idModelo : [null, Validators.required]
  });


  // CODIGO ANTES DE SELECT DEPENDIENTES

/*  ngOnInit(): void {
    // Carga paralela de catálogos
    this.catService.getCategorias().subscribe(data => {
      this.listaCategorias = data;
      this.cdr.detectChanges();
    });

    this.provService.getProveedores().subscribe(data => {
      this.listaProveedores = data;
      this.cdr.detectChanges();
    });

    this.unitService.getUnidadesMedida().subscribe(data => {
      this.listaUnidades = data;
      this.cdr.detectChanges();
    });

    this.marcaService.getMarcasActivas().subscribe(data => {
      this.listaMarcas = data;
      this.cdr.detectChanges();
    });

    this.modeloService.getModelosActivos().subscribe(data => {
      this.listaModelos = data;
      this.cdr.detectChanges();
    })

    if(this.productoData && this.productoData.producto){
      this.esEdicion = true;
      const p = this.productoData.producto;

      //console.log(p);

      this.form.patchValue({
        nombreproducto: p.nombreproducto,
        skuproducto: p.skuproducto,
        descripcionproducto: p.descripcionproducto,
        serieproducto : p.serieproducto,
        inventarioproducto : p.inventarioproducto,
        preciocostoproducto: p.preciocostoproducto,
        precioventaproducto: p.precioventaproducto,
        idCategoria: p.categoria?.idCategoria,
        idProveedor: p.proveedor?.idProveedor,
        idUnidadMedida: p.unidadMedida?.idUnidadMedida,
        idMarca : p.modelo?.marca?.idMarca
      });

      setTimeout(() => {
        this.form.patchValue({ idModelo: p.modelo?.idModelo });
      }, 150);

      this.form.get('precioventaproducto')?.disable();
    }
  }*/

  ngOnInit(): void {

    this.catService.getCategoriasActivas().subscribe(data => this.listaCategorias = data);
    this.provService.getProveedoresActivos().subscribe(data => this.listaProveedores = data);
    this.unitService.getUnidadesMedidaActivas().subscribe(data => this.listaUnidades = data);
    this.marcaService.getMarcasActivas().subscribe(data => this.listaMarcas = data);

    this.form.valueChanges.subscribe( valores => {
      if(!this.esEdicion){
        this.actualizarPreviewSKU(valores.idCategoria, valores.idMarca);
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


    if(this.productoData && this.productoData.producto){
      this.esEdicion = true;
      const p = this.productoData.producto;

      this.form.patchValue({
        nombreproducto: p.nombreproducto,
        skuproducto: p.skuproducto,
        descripcionproducto: p.descripcionproducto,
        serieproducto : p.serieproducto,
        inventarioproducto : p.inventarioproducto,
        preciocostoproducto: p.preciocostoproducto,
        precioventaproducto: p.precioventaproducto,
        idCategoria: p.categoria?.idCategoria,
        idProveedor: p.proveedor?.idProveedor,
        idUnidadMedida: p.unidadMedida?.idUnidadMedida,
        idMarca : p.modelo?.marca?.idMarca // <--- ESTO DISPARA EL valueChanges DE ARRIBA
      });

      setTimeout(() => {
        this.form.patchValue({ idModelo: p.modelo?.idModelo });
      }, 200);

      this.form.get('precioventaproducto')?.disable();
    }
  }

  actualizarPreviewSKU(idCat: number | null, idMar: number | null) {
    let catStr = 'XXX';
    let marStr = 'XXX';

    if (idCat) {
      const categoria = this.listaCategorias.find(c => c.idCategoria === idCat);
      if (categoria) catStr = this.generarPrefijoCategoria(categoria.nombrecategoria);
    }

    if (idMar) {
      const marca = this.listaMarcas.find(m => m.idMarca === idMar);
      if (marca) marStr = this.generarPrefijoMarca(marca.nombremarca);
    }

    this.skuPreview = `${catStr}-${marStr}-XXXXX`;
  }

  generarPrefijoCategoria(texto: string): string {
    if (!texto) return "XXX";
    let limpio = texto.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return limpio.length >= 3 ? limpio.substring(0, 3) : limpio.padEnd(3, 'X');
  }

  generarPrefijoMarca(texto: string): string {
    if (!texto) return "XXX";
    let limpio = texto.trim().toUpperCase();

    if (limpio === "SIN ESPECIFICAR") return "SIN";
    if (limpio === "HP" || limpio === "LG") return limpio;

    limpio = limpio.replace(/[^a-zA-Z0-9]/g, "");
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


  guardar() {

    if (this.form.get('nombreproducto')?.invalid || this.form.get('idCategoria')?.invalid || this.form.get('idMarca')?.invalid || this.form.get('idModelo')?.invalid || this.form.get('idUnidadMedida')?.invalid) {
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
      idModelo: valores.idModelo
    };

    //console.log(valores);

    // 2. Evaluamos si es edición o registro
    if (this.esEdicion) {
      const id = this.productoData.producto.idProducto;
      this.productoService.updateProducto(id, productoDTO,this.archivosSeleccionados).subscribe({
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
