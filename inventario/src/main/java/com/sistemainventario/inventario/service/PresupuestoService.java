package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.dto.*;
import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
//import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PresupuestoService {

    private final Long ID_BODEGA_DESPACHO = 1L; // CONSTANTE DE BODEGA VIRTUAL/DESPACHO

    private final PresupuestoRepository presupuestoRepository;
    private final PresupuestoDetalleRepository presupuestoDetalleRepository;
    private final InventarioRepository inventarioRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final InventarioService inventarioService;
    private final MovimientoStockRepository movimientoStockRepository;
    private final UbicacionRepository ubicacionRepository;
    private final PresupuestoHistorialRepository presupuestoHistorialRepository;

    public PresupuestoService(PresupuestoRepository presupuestoRepository,
                              PresupuestoDetalleRepository presupuestoDetalleRepository,
                              InventarioRepository inventarioRepository,
                              ProductoRepository productoRepository,
                              UsuarioRepository usuarioRepository,
                            InventarioService inventarioService,
                            MovimientoStockRepository movimientoStockRepository,
                            UbicacionRepository ubicacionRepository,
                            PresupuestoHistorialRepository presupuestoHistorialRepository) {
        this.presupuestoRepository = presupuestoRepository;
        this.presupuestoDetalleRepository = presupuestoDetalleRepository;
        this.inventarioRepository = inventarioRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
        this.inventarioService = inventarioService;
        this.movimientoStockRepository = movimientoStockRepository;
        this.ubicacionRepository = ubicacionRepository;
        this.presupuestoHistorialRepository = presupuestoHistorialRepository;
    }

    // METODOS PARA LISTAR LOS PRESUPUESTOS

    @Transactional(readOnly = true)
    public List<Presupuesto> listarTodos() {
        return presupuestoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Presupuesto obtenerPorId(Long id) {
        return presupuestoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado con ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Presupuesto> listarPorEstado(String estado) {
        return presupuestoRepository.findByEstado(estado);
    }

    @Transactional(readOnly = true)
    public List<PresupuestoDetalle> listarDetallePresupuesto(Long idPresupuesto){
        Presupuesto presupuesto = presupuestoRepository.findById(idPresupuesto)
            .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado"));

        return presupuestoDetalleRepository.findByPresupuesto(presupuesto);
    }

    // METODOS PARA GESTIONAR LAS SOLICITUDES DE PRESUPUESTO

    //CREAR LA SOLICITUD DE PRESUPUESTO
    @Transactional
    public Presupuesto crearPresupuesto(PresupuestoCreacionDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Ubicacion ubicacion = ubicacionRepository.findById(dto.getIdUbicacion())
                .orElseThrow(() -> new RuntimeException("Ubicacion no encontrada"));

        Presupuesto presupuesto = new Presupuesto();
        presupuesto.setNombre_presupuesto(dto.getNombrePresupuesto());
        presupuesto.setIdusuariopresupuesto(usuario);
        presupuesto.setUbicacion(ubicacion);
        presupuesto.setObservaciones(dto.getObservaciones());
        presupuesto.setFecha_creacion(Instant.now());
        presupuesto.setFecha_modificacion(Instant.now());
        presupuesto.setEstado("PENDIENTE"); 
        
        Presupuesto presupuestoGuardado = presupuestoRepository.save(presupuesto);

        for (PresupuestoCreacionDTO.DetalleItemDTO item : dto.getItems()) {
            Producto producto = productoRepository.findById(item.getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado ID: " + item.getIdProducto()));

            PresupuestoDetalle detalle = new PresupuestoDetalle();
            detalle.setPresupuesto(presupuestoGuardado);
            detalle.setProducto(producto);
            detalle.setCantidad_solicitada(item.getCantidad());
            
            presupuestoDetalleRepository.save(detalle);
        }
        presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto,usuario, "CREACION"));
        return presupuestoGuardado;
    }


// EDITAR UN PRESUPUESTO CUANDO YA FUE CREADO O ESTÁ EN PROCESO
    @Transactional
    public Presupuesto actualizarPresupuesto(Long id, PresupuestoCreacionDTO dto) {
        Presupuesto presupuesto = this.obtenerPorId(id);

        if ("CANCELADO".equals(presupuesto.getEstado())) {
            throw new RuntimeException("No se pueden editar presupuestos en estado CANCELADO.");
        }

        Usuario usuarioEditor = usuarioRepository.findById(dto.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Ubicacion ubicacion = ubicacionRepository.findById(dto.getIdUbicacion())
                .orElseThrow(() -> new RuntimeException("Ubicacion no encontrada"));

        presupuesto.setNombre_presupuesto(dto.getNombrePresupuesto());
        presupuesto.setUbicacion(ubicacion);
        presupuesto.setObservaciones(dto.getObservaciones());
        presupuesto.setFecha_modificacion(Instant.now());

        // 1. RESPALDAR LO QUE YA SE DESPACHÓ ANTES DE BORRAR
        List<PresupuestoDetalle> detallesAntiguos = presupuestoDetalleRepository.findByPresupuesto(presupuesto);
        java.util.Map<Integer, Integer> despachadosPorProducto = detallesAntiguos.stream()
                .collect(Collectors.toMap(
                        d -> d.getProducto().getIdProducto(),
                        d -> d.getCantidad_despachada() != null ? d.getCantidad_despachada() : 0
                ));

        // 2. VALIDAR QUE NO SE ELIMINEN PRODUCTOS QUE YA TIENEN ENTREGAS FÍSICAS
        for (java.util.Map.Entry<Integer, Integer> entry : despachadosPorProducto.entrySet()) {
            if (entry.getValue() > 0) {
                boolean aunExiste = dto.getItems().stream().anyMatch(i -> i.getIdProducto().equals(entry.getKey()));
                if (!aunExiste) {
                    throw new RuntimeException("No puedes eliminar un producto que ya tiene unidades despachadas. Redúcelo al mínimo entregado si es necesario.");
                }
            }
        }

        // 3. LIMPIAR DETALLES ANTERIORES
        presupuestoDetalleRepository.deleteByPresupuesto(presupuesto);
        presupuestoDetalleRepository.flush(); // Forzamos el borrado en BD antes de reinsertar

        boolean hayNuevosPendientes = false;

        // 4. INSERTAR LOS NUEVOS DETALLES CON SU HISTORIAL DE DESPACHO
        for (PresupuestoCreacionDTO.DetalleItemDTO item : dto.getItems()) {
            Producto producto = productoRepository.findById(item.getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado ID: " + item.getIdProducto()));

            PresupuestoDetalle detalle = new PresupuestoDetalle();
            detalle.setPresupuesto(presupuesto);
            detalle.setProducto(producto);

            int yaDespachado = despachadosPorProducto.getOrDefault(item.getIdProducto(), 0);
            
            // Validar que no pidan menos de lo que ya se entregó físicamente
            if (item.getCantidad() < yaDespachado) {
                throw new RuntimeException("La cantidad solicitada del material '" + producto.getNombreproducto() + 
                                        "' no puede ser menor a lo que ya se despachó (" + yaDespachado + ").");
            }

            detalle.setCantidad_solicitada(item.getCantidad());
            detalle.setCantidad_despachada(yaDespachado);

            if (item.getCantidad() > yaDespachado) {
                hayNuevosPendientes = true;
            }

            presupuestoDetalleRepository.save(detalle);
        }

        // 5. LÓGICA DE REVERSIÓN DE ESTADO AUTOMÁTICA
        if ("DESPACHADO".equals(presupuesto.getEstado()) && hayNuevosPendientes) {
            presupuesto.setEstado("DESPACHO PARCIAL");
            presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuarioEditor, "REACTIVACION"));
        } else {
            presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuarioEditor, "EDICION"));
        }

        return presupuestoRepository.save(presupuesto);
    }

    // VALIDACION DE INVENTARIO PARA LAS EXISTENCIAS
    @Transactional(readOnly = true)
    public List<PresupuestoRevisionDTO> obtenerDetallesConDisponibilidad(Long idPresupuesto) {
        Presupuesto presupuesto = this.obtenerPorId(idPresupuesto);
        List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuesto(presupuesto);

        return detalles.stream().map(detalle -> {
            PresupuestoRevisionDTO dto = new PresupuestoRevisionDTO();
            dto.setIdDetalle(detalle.getIdPresupuestoDetalle());
            dto.setIdProducto(detalle.getProducto().getIdProducto().longValue());
            dto.setNombreProducto(detalle.getProducto().getNombreproducto());
            dto.setCantidadSolicitada(detalle.getCantidad_solicitada());

            //VALIDAR LA EXISTENCIA DEL PRODUCTO PARA EL DESPACHO PARCIAL
            int despachada = detalle.getCantidad_despachada() != null ? detalle.getCantidad_despachada() : 0;
            dto.setCantidadDespachada(despachada);
            dto.setCantidadPendiente(detalle.getCantidad_solicitada() - despachada);

            // Buscar stock en todas las bodegas
            List<Inventario> stockEncontrado = inventarioRepository.findByIdIdProducto(detalle.getProducto().getIdProducto());

            // Calcular stock específico en Bodega Despacho (ID 1)
            int stockEnDespacho = stockEncontrado.stream()
                    .filter(inv -> inv.getBodega().getIdBodega().equals(ID_BODEGA_DESPACHO.intValue()))
                    .mapToInt(Inventario::getCantidad_actual)
                    .findFirst()
                    .orElse(0);
            
            dto.setCantidadEnBodegaDespacho(stockEnDespacho);

            // Calcular desglose general
            List<StockBodegaDTO> listaBodegas = stockEncontrado.stream()
                    .map(inv -> new StockBodegaDTO(
                        inv.getBodega().getNombrebodega(), 
                        inv.getCantidad_actual()
                    ))
                    .collect(Collectors.toList());

            dto.setDesglosePorBodega(listaBodegas);
            
            int totalGlobal = listaBodegas.stream().mapToInt(StockBodegaDTO::getCantidadActual).sum();
            dto.setTotalStockGlobal(totalGlobal);

            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void aprobarPresupuesto(Long idPresupuesto, Integer idUsuario){
        Presupuesto presupuesto = this.obtenerPorId(idPresupuesto);
        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow();

        if(!"PENDIENTE".equals(presupuesto.getEstado())){
            throw new RuntimeException("Solo se pueden aprobar presupuestos PENDIENTES");
        }

        presupuesto.setEstado("APROBADO");
        presupuesto.setFecha_modificacion(Instant.now());

        presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuario, "APROBACION"));
        presupuestoRepository.save(presupuesto);
    }

    @Transactional
    public void cancelarPresupuesto(Long idPresupuesto, Integer idUsuario){
        Presupuesto presupuesto = this.obtenerPorId(idPresupuesto);
        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow();
        if(!"PENDIENTE".equals(presupuesto.getEstado())){
            throw new RuntimeException("Solo se puede cancelar un presupuesto si está PENDIENTE");
        }

        presupuesto.setEstado("CANCELADO");
        presupuesto.setFecha_modificacion(Instant.now());

        presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuario, "CANCELACION"));
        presupuestoRepository.save(presupuesto);
    }

    // MÉTODO: APROBAR Y DESPACHAR (SOLO ROL INVENTARIO)
    @Transactional
    public void despacharPresupuesto(Long idPresupuesto, Integer idUsuarioEjecutor) {
        Presupuesto presupuesto = this.obtenerPorId(idPresupuesto);
        Usuario usuario = usuarioRepository.findById(idUsuarioEjecutor).orElseThrow();
        if (!"APROBADO".equals(presupuesto.getEstado()) && !"DESPACHO PARCIAL".equals(presupuesto.getEstado())) {
            throw new RuntimeException("Solo se pueden despachar presupuestos en estado APROBADO o en DESPACHO PARCIAL.");
        }

        List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuesto(presupuesto);

        boolean seDespachoAlgo = false;
        boolean todoCompletado = true;

        for(PresupuestoDetalle item : detalles){
            int despachadoAnteriormente = item.getCantidad_despachada() != null ? item.getCantidad_despachada() : 0;
            int pendiente = item.getCantidad_solicitada() - despachadoAnteriormente;

            if(pendiente > 0){
                InventarioId invId = new InventarioId();
                invId.setIdBodega(ID_BODEGA_DESPACHO.intValue());
                invId.setIdProducto(item.getProducto().getIdProducto());

                Inventario inventario = inventarioRepository.findById(invId).orElse(null);
                int stockDisponible = inventario != null ? inventario.getCantidad_actual() : 0 ;

                if(stockDisponible > 0 ){
                    int aDespachar = Math.min(stockDisponible, pendiente);

                    inventarioService.registrarMovimiento(
                        item.getProducto().getIdProducto(), 
                        ID_BODEGA_DESPACHO.intValue(), 
                        "DESPACHO", 
                        aDespachar, 
                        idUsuarioEjecutor, 
                        "Despacho Aut. Presupuesto #" + idPresupuesto);

                    item.setCantidad_despachada(despachadoAnteriormente + aDespachar);
                    presupuestoDetalleRepository.save(item);
                    seDespachoAlgo = true;

                    if(item.getCantidad_despachada() < item.getCantidad_solicitada()){
                        todoCompletado = false;
                    }
                }else{
                    todoCompletado = false;
                }
            }
        }

        if (!seDespachoAlgo) {
            throw new RuntimeException("No hay existencias en Bodega de Despacho para los materiales pendientes.");
        }

        // Evaluar estado final
        if (todoCompletado) {
            presupuesto.setEstado("DESPACHADO");
            presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuario, "DESPACHO TOTAL"));
        } else {
            presupuesto.setEstado("DESPACHO PARCIAL");
            presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuario, "DESPACHO PARCIAL"));
        }

        presupuesto.setFecha_modificacion(Instant.now());

        presupuestoRepository.save(presupuesto);
        //presupuestoRepository.save(presupuesto);
    }

    @Transactional(readOnly = true)
    public DespachoReporteDTO generarDatosDespacho(Long idPresupuesto) {
        Presupuesto presupuesto = this.obtenerPorId(idPresupuesto);
        
        DespachoReporteDTO reporte = new DespachoReporteDTO();
        reporte.setIdPresupuesto(presupuesto.getIdPresupuesto());
        reporte.setNombreProyecto(presupuesto.getNombre_presupuesto());
        reporte.setSolicitante(presupuesto.getIdusuariopresupuesto().getNombreusuario());
        reporte.setFechaAprobacion(presupuesto.getFecha_modificacion());
        reporte.setEstado(presupuesto.getEstado());
        reporte.setUbicacionDestino(presupuesto.getUbicacion().getSiglasubicacion());
        reporte.setObservaciones(presupuesto.getObservaciones());

        // A. OBTENER USUARIO DESPACHADOR
        // Buscamos el movimiento que generamos en despacharPresupuesto
        String refDespacho = "Despacho Aut. Presupuesto #" + idPresupuesto;
        List<MovimientoStock> movsDespacho = movimientoStockRepository.findMovimientosDeDespacho(refDespacho);

        if (!movsDespacho.isEmpty()) {
            // Tomamos el usuario del primer movimiento encontrado
            movsDespacho.sort((m1, m2) -> m2.getFecha().compareTo(m1.getFecha()));
            reporte.setUsuarioDespachado(movsDespacho.get(0).getUsuario().getNombreusuario());
            
            //System.out.println(movsDespacho.get(0).getUsuario().getNombreusuario());
        } else {
            reporte.setUsuarioDespachado("Sistema");
        }

        //OBTENER ORIGEN FÍSICO DE LOS MATERIALES
        //Buscamos transferencias previas con "Solicitud #ID"
        String refOrigen = "para Presupuesto: " + idPresupuesto; 
        List<MovimientoStock> movimientosOrigen = movimientoStockRepository.findMovimientosDeOrigen(refOrigen);
        List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuesto(presupuesto);

        // --- INICIO DE LA NUEVA LÓGICA DE DESGLOSE ---
        List<DespachoReporteDTO.DetalleDespachoItem> itemsDTO = new java.util.ArrayList<>();

        for (PresupuestoDetalle d : detalles) {
            int totalSolicitado = d.getCantidad_solicitada() != null ? d.getCantidad_solicitada() : 0;
            int totalDespachado = d.getCantidad_despachada() != null ? d.getCantidad_despachada() : 0;
            String um = d.getProducto().getUnidadMedida() != null ? d.getProducto().getUnidadMedida().getNombreunidadmedida() : "Unid";

            if (totalDespachado == 0) {
                // CASO 1: No ha salido nada, todo va directo a PENDIENTES
                DespachoReporteDTO.DetalleDespachoItem item = new DespachoReporteDTO.DetalleDespachoItem();
                item.setSku(d.getProducto().getSkuproducto());
                item.setNombreProducto(d.getProducto().getNombreproducto());
                item.setUnidadMedida(um);
                item.setCantidadSolicitada(totalSolicitado);
                item.setCantidadDespachada(0);
                item.setEstadoItem("PENDIENTE");
                item.setBodegaOrigen("PENDIENTES DE ENTREGAR");
                itemsDTO.add(item);
            } else {
                // CASO 2: Se hicieron despachos, buscamos de qué bodegas salieron
                List<MovimientoStock> movsProducto = movimientosOrigen.stream()
                        .filter(m -> m.getProducto().getIdProducto().equals(d.getProducto().getIdProducto()))
                        .collect(Collectors.toList());

                // Agrupamos y sumamos lo que se movió de cada bodega específica
                java.util.Map<String, Integer> despachosPorBodega = movsProducto.stream()
                        .collect(Collectors.groupingBy(
                                m -> m.getBodega().getNombrebodega(),
                                Collectors.summingInt(MovimientoStock::getCantidad)
                        ));

                int cantidadYaAsignada = 0;

                // Creamos una línea de "ENTREGADO" por cada bodega que aportó material
                for (java.util.Map.Entry<String, Integer> entry : despachosPorBodega.entrySet()) {
                    int cantidadMovida = entry.getValue();
                    
                    // Aseguramos no sobrepasar el total despachado (por si el usuario movió stock extra que aún no entrega)
                    int cantidadParaEstaBodega = Math.min(cantidadMovida, totalDespachado - cantidadYaAsignada);
                    
                    if (cantidadParaEstaBodega > 0) {
                        DespachoReporteDTO.DetalleDespachoItem item = new DespachoReporteDTO.DetalleDespachoItem();
                        item.setSku(d.getProducto().getSkuproducto());
                        item.setNombreProducto(d.getProducto().getNombreproducto());
                        item.setUnidadMedida(um);
                        // Lo requerido y lo despachado en esta línea coinciden con lo que salió de la bodega
                        item.setCantidadSolicitada(cantidadParaEstaBodega);
                        item.setCantidadDespachada(cantidadParaEstaBodega);
                        item.setEstadoItem("ENTREGADO");
                        item.setBodegaOrigen(entry.getKey());
                        itemsDTO.add(item);
                        
                        cantidadYaAsignada += cantidadParaEstaBodega;
                    }
                }

                // Fallback de seguridad: Si no encontramos el origen (ej. Ajuste manual), lo metemos en Bodega Despacho general
                if (cantidadYaAsignada < totalDespachado) {
                    int faltante = totalDespachado - cantidadYaAsignada;
                    DespachoReporteDTO.DetalleDespachoItem item = new DespachoReporteDTO.DetalleDespachoItem();
                    item.setSku(d.getProducto().getSkuproducto());
                    item.setNombreProducto(d.getProducto().getNombreproducto());
                    item.setUnidadMedida(um);
                    item.setCantidadSolicitada(faltante);
                    item.setCantidadDespachada(faltante);
                    item.setEstadoItem("ENTREGADO");
                    item.setBodegaOrigen("Bodega Despacho"); 
                    itemsDTO.add(item);
                }

                // Finalmente, si sobró material por entregar, agregamos la línea "fantasma" de lo pendiente
                int pendiente = totalSolicitado - totalDespachado;
                if (pendiente > 0) {
                    DespachoReporteDTO.DetalleDespachoItem itemPendiente = new DespachoReporteDTO.DetalleDespachoItem();
                    itemPendiente.setSku(d.getProducto().getSkuproducto());
                    itemPendiente.setNombreProducto(d.getProducto().getNombreproducto());
                    itemPendiente.setUnidadMedida(um);
                    itemPendiente.setCantidadSolicitada(pendiente);
                    itemPendiente.setCantidadDespachada(0);
                    itemPendiente.setEstadoItem("PENDIENTE");
                    itemPendiente.setBodegaOrigen("PENDIENTES DE ENTREGAR");
                    itemsDTO.add(itemPendiente);
                }
            }
        }

        reporte.setItems(itemsDTO);
        return reporte;
        // --- FIN ---
    }
}