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

    @Transactional(readOnly = true)
    public List<Bodega> listarTodasLasBodegas(){
        Sort idbodega = Sort.by(Sort.Direction.ASC,"nombrebodega");
        return bodegaRepository.findByActivoTrue(idbodega);
    }

    @Transactional(readOnly = true)
    public List<Inventario> listarInventarioPorBodega(Integer idBodega){
        Sort nombreProducto = Sort.by(Sort.Direction.ASC, "producto.nombreproducto");
        Sort stock = Sort.by(Sort.Direction.DESC,"cantidad_actual");
        Sort sku = Sort.by(Sort.Direction.ASC, "producto.skuproducto");
        Sort filtro = nombreProducto.and(stock).and(sku);
        return inventarioRepository.findByBodega_IdBodega(idBodega, filtro);
    }

    @Transactional(readOnly = true)
    public List<Inventario> listarStockPorProducto(Integer idProducto){
        return inventarioRepository.findByIdIdProducto(idProducto);
    }

    @Transactional
    public void registrarMovimiento(Integer idProducto, Integer idBodega, String tipo, Integer cantidad, Integer idUsuario, String motivo){
        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        Bodega bodega = bodegaRepository.findById(idBodega)
                .orElseThrow(() -> new RuntimeException("Bodega no encontrado"));
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        MovimientoStock movimiento = new MovimientoStock();
        movimiento.setProducto(producto);
        movimiento.setBodega(bodega);
        movimiento.setUsuario(usuario);
        movimiento.setTipo(tipo);
        movimiento.setCantidad(cantidad);
        movimiento.setMotivo(motivo);
        movimientoStockRepository.save(movimiento);

        InventarioId inventarioId = new InventarioId();
        inventarioId.setIdProducto(idProducto);
        inventarioId.setIdBodega(idBodega);

        Optional<Inventario> inventarioOpt = inventarioRepository.findById(inventarioId);
        Inventario inventario;

        if(inventarioOpt.isPresent()){
            inventario = inventarioOpt.get();
        } else {
            inventario = new Inventario();
            inventario.setId(inventarioId);
            inventario.setProducto(producto);
            inventario.setBodega(bodega);
            inventario.setCantidad_actual(0);
        }

        int nuevaCantidad = inventario.getCantidad_actual();
        if("ENTRADA".equals(tipo)){
            nuevaCantidad += cantidad;
        } else if("SALIDA".equals(tipo)){
            if(nuevaCantidad < cantidad){
                throw new RuntimeException("No hay suficiente STOCK para realizar la salida");
            }
            nuevaCantidad -= cantidad;
        } else if("DESCARGO".equals(tipo)){
            if(nuevaCantidad < cantidad){
                throw new RuntimeException("No hay suficiente STOCK para realizar el descargo de este producto");
            }
            nuevaCantidad -= cantidad;
        } else if("DESPACHO".equals(tipo)){
            if(nuevaCantidad < cantidad){
                throw new RuntimeException("No hay suficiente STOCK para realizar el despacho de este producto");
            }
            nuevaCantidad -= cantidad;
        } else if("AJUSTE".equals(tipo)){
            nuevaCantidad += cantidad;
        }

        if (nuevaCantidad == 0) {
            if (inventarioOpt.isPresent()) {
                inventarioRepository.delete(inventario);
            }
        } else {
            inventario.setCantidad_actual(nuevaCantidad);
            inventarioRepository.save(inventario);
        }
    }

    @Transactional
    public void realizarAjusteManual(AjusteStockDTO ajusteStockDTO) {
        if (ajusteStockDTO.getCantidad() <= 0) {
            throw new RuntimeException("La cantidad del ajuste debe ser mayor a 0.");
        }

        if (!"ENTRADA".equals(ajusteStockDTO.getTipoMovimiento()) && !"SALIDA".equals(ajusteStockDTO.getTipoMovimiento())) {
            throw new RuntimeException("Tipo de movimiento inválido. Use ENTRADA o SALIDA.");
        }

        // Se guarda directamente el motivo del usuario
        this.registrarMovimiento(
            ajusteStockDTO.getIdProducto(), 
            ajusteStockDTO.getIdBodega(), 
            ajusteStockDTO.getTipoMovimiento(),
            ajusteStockDTO.getCantidad(), 
            ajusteStockDTO.getIdUsuario(), 
            ajusteStockDTO.getMotivo()
        );
    }

    @Transactional
    public void realizarMovimiento(MovimientoDTO movimientoDTO ){
        if (movimientoDTO.getIdBodegaOrigen().equals(movimientoDTO.getIdBodegaDestino())){
            throw new RuntimeException("La Bodega Origen no puede ser igual a la Bodega Destino");
        }

        if(movimientoDTO.getCantidad() <= 0 ){
            throw new RuntimeException("La cantidad a mover debe ser mayor a cero");
        }

        InventarioId idBodegaOrigen = new InventarioId();
        idBodegaOrigen.setIdBodega(movimientoDTO.getIdBodegaOrigen());
        idBodegaOrigen.setIdProducto(movimientoDTO.getIdProducto());

        Inventario inventarioOrigen = inventarioRepository.findById(idBodegaOrigen)
                    .orElseThrow(() -> new RuntimeException("Este Producto no existe en la Bodega Origen"));

        if(inventarioOrigen.getCantidad_actual() < movimientoDTO.getCantidad()){
            throw new RuntimeException("Inventario Insuficiente en la bodega origen para realizar el movimiento");
        }

        // Salida en Origen guardando únicamente el motivo ingresado
        this.registrarMovimiento(
            movimientoDTO.getIdProducto(),
            movimientoDTO.getIdBodegaOrigen(),
            "SALIDA",
            movimientoDTO.getCantidad(),
            movimientoDTO.getIdUsuario(),
            movimientoDTO.getMotivo()
        );

        // Entrada en Destino guardando únicamente el motivo ingresado
        this.registrarMovimiento(
            movimientoDTO.getIdProducto(),
            movimientoDTO.getIdBodegaDestino(),
            "ENTRADA",
            movimientoDTO.getCantidad(),
            movimientoDTO.getIdUsuario(),
            movimientoDTO.getMotivo()
        );
    }

    @Transactional
    public void realizarMovimientoStock(MovimientoStockDTO movimientoStockDTO){
        if (movimientoStockDTO.getIdBodegaOrigen().equals(movimientoStockDTO.getIdBodegaDestino())){
            throw new RuntimeException("Bodega Origen no puede ser igual a Bodega Destino");
        }

        if(movimientoStockDTO.getItems() == null || movimientoStockDTO.getItems().isEmpty()){
            throw new RuntimeException("Lista de materiales no puede estar vacia");
        }

        for (MovimientoItemDTO item : movimientoStockDTO.getItems()){
            InventarioId idInventarioOrigen = new InventarioId();
            idInventarioOrigen.setIdBodega(movimientoStockDTO.getIdBodegaOrigen());
            idInventarioOrigen.setIdProducto(item.getIdProducto());

            Inventario inventario = inventarioRepository.findById(idInventarioOrigen)
                    .orElseThrow(() -> new RuntimeException("Producto " + item.getIdProducto() + " no existe en Origen"));

            if (inventario.getCantidad_actual() < item.getCantidad()){
                throw new RuntimeException("Stock insuficiente para el producto " + item.getIdProducto());
            }

            // Salida en Origen guardando solo el motivo
            this.registrarMovimiento(
                item.getIdProducto(),
                movimientoStockDTO.getIdBodegaOrigen(),
                "SALIDA", 
                item.getCantidad(),
                movimientoStockDTO.getIdUsuario(),
                movimientoStockDTO.getMotivo()
            );

            // Entrada en Destino guardando solo el motivo
            this.registrarMovimiento(
                item.getIdProducto(),
                movimientoStockDTO.getIdBodegaDestino(),
                "ENTRADA", 
                item.getCantidad(),
                movimientoStockDTO.getIdUsuario(),
                movimientoStockDTO.getMotivo()
            );
        }
    }

    @Transactional
    public void realizarDescargo(DescargoDTO descargdoDto){
        if (descargdoDto.getItems() == null || descargdoDto.getItems().isEmpty()) {
            throw new RuntimeException("La lista de descargo no puede estar vacía.");
        }

        for (MovimientoItemDTO item : descargdoDto.getItems()){
            InventarioId idInventarioDescargo = new InventarioId();
            idInventarioDescargo.setIdBodega(descargdoDto.getIdBodega());
            idInventarioDescargo.setIdProducto(item.getIdProducto());

            Inventario inventario = inventarioRepository.findById(idInventarioDescargo)
                    .orElseThrow(() -> new RuntimeException("Producto ID " + item.getIdProducto() + " no existe en bodega.")); 

            if (inventario.getCantidad_actual() < item.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para: " + inventario.getProducto().getNombreproducto());
            }

            // Descargo guardando directamente el motivo digitado por el usuario
            this.registrarMovimiento(
                item.getIdProducto(),
                descargdoDto.getIdBodega(),
                "DESCARGO",
                item.getCantidad(),
                descargdoDto.getIdUsuario(),
                descargdoDto.getMotivo()
            );
        }       
    }

    @Transactional(readOnly = true)
    public List<Inventario> listarInventarioConsolidadoExistente() {
        return inventarioRepository.findInventarioConsolidadoExistente();
    }

    @Transactional(readOnly = true)
    public List<MovimientoStock> filtrarMovimientosHistorial (Instant inicio, Instant fin, String tipo){
        if(tipo == null || tipo.trim().isEmpty() || "TODOS".equals(tipo.toUpperCase())){
            return movimientoStockRepository.findMovimientosPorRangoDeFechas(inicio,fin);
        } else {
            return movimientoStockRepository.findMovimientosPorRangoYTipo(inicio, fin, tipo.toUpperCase());
        }
    }
}