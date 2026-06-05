package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.dto.AjusteStockDTO;
import com.sistemainventario.inventario.dto.DescargoDTO;
import com.sistemainventario.inventario.dto.MovimientoDTO;
import com.sistemainventario.inventario.dto.MovimientoItemDTO;
import com.sistemainventario.inventario.dto.MovimientoStockDTO;
import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Sort;

@Service
public class InventarioService {

    private final InventarioRepository inventarioRepository;
    private final MovimientoStockRepository movimientoStockRepository;
    private final ProductoRepository productoRepository;
    private final BodegaRepository bodegaRepository;
    private final UsuarioRepository usuarioRepository;

    public InventarioService(InventarioRepository inventarioRepository,
                             MovimientoStockRepository movimientoStockRepository,
                             ProductoRepository productoRepository,
                             BodegaRepository bodegaRepository,
                             UsuarioRepository usuarioRepository) {
        this.inventarioRepository = inventarioRepository;
        this.movimientoStockRepository = movimientoStockRepository;
        this.productoRepository = productoRepository;
        this.bodegaRepository = bodegaRepository;
        this.usuarioRepository = usuarioRepository;
    }


    /********************************************************************************************************
    METODO PARA LISTAR TODAS LAS BODEGAS QUE ESTAN CON ESTADO ACTIVO EN LA PANTALLA DE INVENTARIO
    *********************************************************************************************************/
    @Transactional(readOnly = true)
    public List<Bodega> listarTodasLasBodegas(){
        Sort idbodega = Sort.by(Sort.Direction.ASC,"idBodega");
        return bodegaRepository.findByActivoTrue(idbodega);
    }

    /********************************************************************************************************
    METODO PARA LISTAR TODOS LOS PRODUCTOS/MATERIALES QUE ESTAN EN ESA BODEGA
    *********************************************************************************************************/
    @Transactional(readOnly = true)
    public List<Inventario> listarInventarioPorBodega(Integer idBodega){
        Sort stockbajo = Sort.by(Sort.Direction.DESC,"cantidad_actual");
        return inventarioRepository.findByBodega_IdBodega(idBodega, stockbajo);
    }


    /********************************************************************************************************
    METODO PARA LISTAR EL STOCK DE UN PRODUCTO PARA PODER REALIZAR EL MOVIMIENTO DESDE LA VENTANA REVISION PRESUPUESTO 
    *********************************************************************************************************/
    @Transactional(readOnly = true)
    public List<Inventario> listarStockPorProducto(Integer idProducto){
        return inventarioRepository.findByIdIdProducto(idProducto);
    }

    /********************************************************************************************************
    METODO PARA REGISTRAR LOS CAMBIOS DE ENTRADA/SALIDA/DESPACHO/DESCARGO/AJUSTE EN EL INVENTARIO
    *********************************************************************************************************/
    @Transactional
    public void registrarMovimiento(Integer idProducto, Integer idBodega, String tipo, Integer cantidad, Integer idUsuario, String motivo){

        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        Bodega bodega = bodegaRepository.findById(idBodega)
                .orElseThrow(() -> new RuntimeException("Bodega no encontrado"));
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        //REGISTRAR EL MOVIMIENTO EN EL KARDEX
        MovimientoStock movimiento = new MovimientoStock();
        movimiento.setProducto(producto);
        movimiento.setBodega(bodega);
        movimiento.setUsuario(usuario);
        movimiento.setTipo(tipo);
        movimiento.setCantidad(cantidad);
        movimiento.setMotivo(motivo);
        movimientoStockRepository.save(movimiento);

        //ACTUALIZAR EL INVENTARIO
        InventarioId inventarioId = new InventarioId();
        inventarioId.setIdProducto(idProducto);
        inventarioId.setIdBodega(idBodega);

        //SE BUSCA SI YA EXISTE EL REGISTRO DE ESE PRODUCTO EN LA BODEGA
        Optional<Inventario> inventarioOpt = inventarioRepository.findById(inventarioId);
        Inventario inventario;

        if(inventarioOpt.isPresent()){
            inventario = inventarioOpt.get();
        }else{
            inventario = new Inventario();
            inventario.setId(inventarioId);
            inventario.setProducto(producto);
            inventario.setBodega(bodega);
            inventario.setCantidad_actual(0);
        }

        //CALCULAR LA NUEVA CANTIDAD SEGUN EL TIPO DE MOVIMIENTO
        int nuevaCantidad = inventario.getCantidad_actual();
        if("ENTRADA".equals(tipo)){
            nuevaCantidad += cantidad;
        }else if("SALIDA".equals(tipo)){
            if(nuevaCantidad < cantidad){
                throw new RuntimeException("No hay suficiente STOCK para realizar la salida");
            }
            nuevaCantidad -= cantidad;
        }else if("DESCARGO".equals(tipo)){
            if(nuevaCantidad < cantidad){
                throw new RuntimeException("No hay suficiente STOCK para realizar el descargo de este producto");
            }
            nuevaCantidad -= cantidad;
        }else if("DESPACHO".equals(tipo)){
            if(nuevaCantidad < cantidad){
                throw new RuntimeException("No hay suficiente STOCK para realizar el despacho de este producto");
            }
            nuevaCantidad -= cantidad;
        }else if("AJUSTE".equals(tipo)){
            nuevaCantidad += cantidad;
        }

        inventario.setCantidad_actual(nuevaCantidad);
        inventarioRepository.save(inventario);
    }


    @Transactional
    public void realizarAjusteManual(AjusteStockDTO ajusteStockDTO) {
        
        // Validaciones básicas
        if (ajusteStockDTO.getCantidad() <= 0) {
            throw new RuntimeException("La cantidad del ajuste debe ser mayor a 0.");
        }

        if (!"ENTRADA".equals(ajusteStockDTO.getTipoMovimiento()) && !"SALIDA".equals(ajusteStockDTO.getTipoMovimiento())) {
            throw new RuntimeException("Tipo de movimiento inválido. Use ENTRADA o SALIDA.");
        }

        this.registrarMovimiento(
            ajusteStockDTO.getIdProducto(), 
            ajusteStockDTO.getIdBodega(), 
            ajusteStockDTO.getTipoMovimiento(),
            ajusteStockDTO.getCantidad(), 
            ajusteStockDTO.getIdUsuario(), 
            "Ajuste Manual (" + ajusteStockDTO.getTipoMovimiento() + "): " + ajusteStockDTO.getMotivo()
        );
    }

    @Transactional
    public void realizarMovimiento(MovimientoDTO movimientoDTO ){

        //Validaciones logicas
        if (movimientoDTO.getIdBodegaOrigen().equals(movimientoDTO.getIdBodegaDestino())){
            throw new RuntimeException("La Bodega Origen no puede ser igual a la Bodega Destino");
        }

        if(movimientoDTO.getCantidad() <= 0 ){
            throw new RuntimeException("La cantidad a mover debe ser mayor a cero");
        }


        //Validar el inventario de la Bodega Origen
        InventarioId idBodegaOrigen = new InventarioId();
        idBodegaOrigen.setIdBodega(movimientoDTO.getIdBodegaOrigen());
        idBodegaOrigen.setIdProducto(movimientoDTO.getIdProducto());

        Inventario inventarioOrigen = inventarioRepository.findById(idBodegaOrigen)
                    .orElseThrow( () -> new RuntimeException("Este Producto no existe en la Bodega Origen"));

        if(inventarioOrigen.getCantidad_actual() < movimientoDTO.getCantidad()){
            throw new RuntimeException("Inventario Insuficiente en la bodega origen para realizar el movimiento");
        }

        Bodega bodegaOrigen = bodegaRepository.findById(movimientoDTO.getIdBodegaOrigen())
            .orElseThrow(() -> new RuntimeException("Bodega destino no encontrada"));

        Bodega bodegaDestino = bodegaRepository.findById(movimientoDTO.getIdBodegaDestino())
        .orElseThrow(() -> new RuntimeException("Bodega destino no encontrada"));

        // String referenciaMovimiento = "MOVIMIENTO -" + System.currentTimeMillis();

        //Registrar una salida en Bodega Origen
        this.registrarMovimiento(
            movimientoDTO.getIdProducto(),
            movimientoDTO.getIdBodegaOrigen(),
            "SALIDA",
            movimientoDTO.getCantidad(),
            movimientoDTO.getIdUsuario(),
            "Movimiento de Materiales desde : " + bodegaOrigen.getNombrebodega() + " - " + movimientoDTO.getMotivo()
        );

        //Registrar una entrada en Bodega Destino
        this.registrarMovimiento(
            movimientoDTO.getIdProducto(),
            movimientoDTO.getIdBodegaDestino(),
            "ENTRADA",
            movimientoDTO.getCantidad(),
            movimientoDTO.getIdUsuario(),
            "Recepcion de Materiales hacia : " + bodegaDestino.getNombrebodega() + " - " + movimientoDTO.getMotivo()
        ) ;
    }

    @Transactional
    public void realizarMovimientoStock(MovimientoStockDTO movimientoStockDTO){

        if (movimientoStockDTO.getIdBodegaOrigen().equals(movimientoStockDTO.getIdBodegaDestino())){
            throw new RuntimeException("Bodega Origen no puede ser igual a Bodega Destino");
        }

        if(movimientoStockDTO.getItems() == null || movimientoStockDTO.getItems().isEmpty()){
            throw new RuntimeException("Lista de materiales no puede estar vacia");
        }

        Bodega bodegaOrigen = bodegaRepository.findById(movimientoStockDTO.getIdBodegaOrigen())
                .orElseThrow(() -> new RuntimeException("Bodega origen no encontrada"));

        Bodega bodegaDestino = bodegaRepository.findById(movimientoStockDTO.getIdBodegaDestino())
                .orElseThrow(() -> new RuntimeException("Bodega destino no encontrada")); 


        for (MovimientoItemDTO item : movimientoStockDTO.getItems()){

            //Validar el stock actual
            InventarioId idInventarioOrigen = new InventarioId();
            idInventarioOrigen.setIdBodega(movimientoStockDTO.getIdBodegaOrigen());
            idInventarioOrigen.setIdProducto(item.getIdProducto());

            Inventario inventario = inventarioRepository.findById(idInventarioOrigen)
                    .orElseThrow( () -> new RuntimeException("Producto " + item.getIdProducto() + "no existe en Origen"));

            if (inventario.getCantidad_actual() < item.getCantidad()){
                throw new RuntimeException("Stock insuficiente para el producto " + item.getIdProducto());
            }

            this.registrarMovimiento(
                item.getIdProducto(),
                movimientoStockDTO.getIdBodegaOrigen(),
                "SALIDA", 
                item.getCantidad(),
                movimientoStockDTO.getIdUsuario(),
                "Salida de Material desde: " + bodegaOrigen.getNombrebodega() + " - " + movimientoStockDTO.getMotivo()
            );

            this.registrarMovimiento(
                item.getIdProducto(),
                movimientoStockDTO.getIdBodegaDestino(),
                "ENTRADA", 
                item.getCantidad(),
                movimientoStockDTO.getIdUsuario(),
                "Recepcion de Material en: " + bodegaDestino.getNombrebodega() + " - " + movimientoStockDTO.getMotivo()
            ) ;
        }
    }

    @Transactional
    public void realizarDescargo(DescargoDTO descargdoDto){
        if (descargdoDto.getItems() == null || descargdoDto.getItems().isEmpty()) {
            throw new RuntimeException("La lista de descargo no puede estar vacía.");
        }

        Bodega bodega = bodegaRepository.findById(descargdoDto.getIdBodega())
                .orElseThrow(() -> new RuntimeException("Bodega no encontrada"));

        for (MovimientoItemDTO item : descargdoDto.getItems()){
            InventarioId idInventarioDescargo = new InventarioId();
            idInventarioDescargo.setIdBodega(descargdoDto.getIdBodega());
            idInventarioDescargo.setIdProducto(item.getIdProducto());

            Inventario inventario = inventarioRepository.findById(idInventarioDescargo)
                    .orElseThrow(() -> new RuntimeException("Producto ID " + item.getIdProducto() + " no existe en bodega.")); 

            if (inventario.getCantidad_actual() < item.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para: " + inventario.getProducto().getNombreproducto());
            }

            this.registrarMovimiento(
                item.getIdProducto(),
                descargdoDto.getIdBodega(),
                "DESCARGO",
                item.getCantidad(),
                descargdoDto.getIdUsuario(),
                "Descargo de Material desde: " + bodega.getNombrebodega()
            );
        }       
    }

    /********************************************************************************************************
    MÉTODO PARA OBTENER EL INVENTARIO CONSOLIDADO EXISTENTE DE TODAS LAS BODEGAS (EXCLUYE STOCK 0)
    *********************************************************************************************************/
    @Transactional(readOnly = true)
    public List<Inventario> listarInventarioConsolidadoExistente() {
        return inventarioRepository.findInventarioConsolidadoExistente();
    }

    /********************************************************************************************************
    MÉTODO PARA FILTRAR HISTORIAL DE MOVIMIENTOS POR FECHAS Y TIPO OPCIONAL
    *********************************************************************************************************/
    @Transactional(readOnly = true)
    public List<MovimientoStock> filtrarMovimientosHistorial (Instant inicio, Instant fin, String tipo){
        if(tipo == null || tipo.trim().isEmpty() || "TODOS".equals(tipo.toUpperCase())){
            return movimientoStockRepository.findMovimientosPorRangoDeFechas(inicio,fin);
        }else{
            return movimientoStockRepository.findMovimientosPorRangoYTipo(inicio, fin, tipo.toUpperCase());
        }
    }


}
