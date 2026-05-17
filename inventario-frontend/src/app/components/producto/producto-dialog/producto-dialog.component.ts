import { Component, OnInit, inject,ChangeDetectorRef, Inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

// servicios de catálogos
import { CategoriaService } from '../../../services/categoria.service';
import { ProveedorService } from '../../../services/proveedor.service';
import { UnidadMedidaService } from '../../../services/unidades-medida.service';
import { MarcaService } from '../../../services/marca.service';
import { ModeloService } from '../../../services/modelo.service';
import { Utils } from '../../../core/utils';
import { Mensaje } from '../../../core/mensaje';
import { ProductoService } from '../../../services/producto.service';

@Component({
  selector: 'app-producto-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule
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

  // Listas para los selects
  listaCategorias: any[] = [];
  listaProveedores: any[] = [];
  listaUnidades: any[] = [];
  listaMarcas: any[] = [];
  listaModelos: any[] = [];

  form: FormGroup = this.fb.group({
    nombreproducto: ['', [Validators.required]],
    skuproducto: ['', [Validators.required]],
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

  ngOnInit(): void {
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
        idMarca : p.marca?.idMarca,
        idModelo : p.modelo?.idModelo
      });

      this.form.get('precioventaproducto')?.disable();
    }
  }

  onInputMayusculas(event: Event, controlName: string) {
    const control = this.form.get(controlName);
    this.sn.convertirAMayusculas(event, control);
  }

  guardar() {
    if (this.form.invalid) return;

    this.guardando = true; // Deshabilita el botón

    // 1. Obtenemos los valores y aplicamos trim() al SKU y al nombre
    const valores = this.form.getRawValue();
    const productoDTO = {
      ...valores,
      skuproducto: valores.skuproducto.trim(),
      nombreproducto: valores.nombreproducto.trim()
    };

    // 2. Evaluamos si es edición o registro
    if (this.esEdicion) {
      const id = this.productoData.producto.idProducto;
      this.productoService.updateProducto(id, productoDTO).subscribe({
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
      this.productoService.createProducto(productoDTO).subscribe({
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
