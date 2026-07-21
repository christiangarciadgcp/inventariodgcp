package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.dto.*;
import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;

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
    private final NotificacionService notificacionService;

    public PresupuestoService(PresupuestoRepository presupuestoRepository,
                              PresupuestoDetalleRepository presupuestoDetalleRepository,
                              InventarioRepository inventarioRepository,
                              ProductoRepository productoRepository,
                              UsuarioRepository usuarioRepository,
                            InventarioService inventarioService,
                            MovimientoStockRepository movimientoStockRepository,
                            UbicacionRepository ubicacionRepository,
                            PresupuestoHistorialRepository presupuestoHistorialRepository,
                            NotificacionService notificacionService) {
        this.presupuestoRepository = presupuestoRepository;
        this.presupuestoDetalleRepository = presupuestoDetalleRepository;
        this.inventarioRepository = inventarioRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
        this.inventarioService = inventarioService;
        this.movimientoStockRepository = movimientoStockRepository;
        this.ubicacionRepository = ubicacionRepository;
        this.presupuestoHistorialRepository = presupuestoHistorialRepository;
        this.notificacionService = notificacionService;
    }

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

        List<PresupuestoDetalle> crudos = presupuestoDetalleRepository.findByPresupuesto(presupuesto);
        Map<Integer, PresupuestoDetalle> consolidados = new HashMap<>();

        for (PresupuestoDetalle d : crudos){
            Integer idProd = d.getProducto().getIdProducto();
            if(consolidados.containsKey(idProd)){
                PresupuestoDetalle existente = consolidados.get(idProd);
                existente.setCantidad_solicitada(existente.getCantidad_solicitada() + d.getCantidad_solicitada());
                existente.setCantidad_despachada(existente.getCantidad_despachada() + (d.getCantidad_despachada() != null ? d.getCantidad_despachada() : 0));
            }else{
                PresupuestoDetalle copia = new PresupuestoDetalle();
                copia.setIdPresupuestoDetalle(d.getIdPresupuestoDetalle());
                copia.setPresupuesto(d.getPresupuesto());
                copia.setProducto(d.getProducto());
                copia.setProductoFisico(null);
                copia.setCantidad_solicitada(d.getCantidad_solicitada());
                copia.setCantidad_despachada(d.getCantidad_despachada() != null ? d.getCantidad_despachada() : 0);
                consolidados.put(idProd, copia);
            }
        }

        return new ArrayList<>(consolidados.values());
    }

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

        notificacionService.registrar(usuario.getNombreusuario(), "ha creado el Presupuesto #" + presupuestoGuardado.getIdPresupuesto());

        return presupuestoGuardado;
    }

    @Transactional
    public Presupuesto actualizarPresupuesto(Long id, PresupuestoCreacionDTO dto) {
        Presupuesto presupuesto = this.obtenerPorId(id);
        if ("CANCELADO".equals(presupuesto.getEstado())) throw new RuntimeException("No se puede editar.");

        Usuario usuarioEditor = usuarioRepository.findById(dto.getIdUsuario()).orElseThrow();
        Ubicacion ubicacion = ubicacionRepository.findById(dto.getIdUbicacion()).orElseThrow();

        presupuesto.setNombre_presupuesto(dto.getNombrePresupuesto());
        presupuesto.setUbicacion(ubicacion);
        presupuesto.setObservaciones(dto.getObservaciones());
        presupuesto.setFecha_modificacion(Instant.now());

        List<PresupuestoDetalle> detallesAntiguos = presupuestoDetalleRepository.findByPresupuesto(presupuesto);
        Map<Integer, Integer> despachadosGenericos = detallesAntiguos.stream()
                .collect(Collectors.groupingBy(
                        d -> d.getProducto().getIdProducto(),
                        Collectors.summingInt(d -> d.getCantidad_despachada() != null ? d.getCantidad_despachada() : 0)
                ));

        for (PresupuestoDetalle d : detallesAntiguos) {
            if (d.getCantidad_despachada() == null || d.getCantidad_despachada() == 0) {
                presupuestoDetalleRepository.delete(d);
            }
        }
        presupuestoDetalleRepository.flush();

        boolean hayNuevosPendientes = false;

        for (PresupuestoCreacionDTO.DetalleItemDTO item : dto.getItems()) {
            Producto producto = productoRepository.findById(item.getIdProducto()).orElseThrow();
            int yaDespachado = despachadosGenericos.getOrDefault(item.getIdProducto(), 0);
            
            if (item.getCantidad() < yaDespachado) {
                throw new RuntimeException("La cantidad de '" + producto.getNombreproducto() + "' no puede ser menor a lo despachado (" + yaDespachado + ").");
            }

            int cantidadPendiente = item.getCantidad() - yaDespachado;
            if (cantidadPendiente > 0) {
                PresupuestoDetalle detalle = new PresupuestoDetalle();
                detalle.setPresupuesto(presupuesto);
                detalle.setProducto(producto);
                detalle.setProductoFisico(null);
                detalle.setCantidad_solicitada(cantidadPendiente);
                detalle.setCantidad_despachada(0);
                presupuestoDetalleRepository.save(detalle);
                hayNuevosPendientes = true;
            }
        }

        if ("DESPACHADO".equals(presupuesto.getEstado()) && hayNuevosPendientes) {
            presupuesto.setEstado("DESPACHO PARCIAL");
            presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuarioEditor, "REACTIVACION"));
        } else {
            presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuarioEditor, "EDICION"));
        }

        notificacionService.registrar(usuarioEditor.getNombreusuario(), "ha editado el Presupuesto #" + presupuesto.getIdPresupuesto());
        return presupuestoRepository.save(presupuesto);
    }

    @Transactional(readOnly = true)
    public List<PresupuestoRevisionDTO> obtenerDetallesConDisponibilidad(Long idPresupuesto) {
        Presupuesto presupuesto = this.obtenerPorId(idPresupuesto);
        List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuesto(presupuesto);

        Map<Integer, PresupuestoRevisionDTO> consolidados = new HashMap<>();

        for (PresupuestoDetalle detalle : detalles) {
            Integer idProd = detalle.getProducto().getIdProducto();

            PresupuestoRevisionDTO dto = consolidados.getOrDefault(idProd, new PresupuestoRevisionDTO());
            if (dto.getIdDetalle() == null) {
                dto.setIdDetalle(detalle.getIdPresupuestoDetalle());
                dto.setIdProducto(idProd.longValue());
                dto.setNombreProducto(detalle.getProducto().getNombreproducto());
                dto.setEsGenerico(detalle.getProducto().getEsGenerico());
                dto.setCantidadSolicitada(0);
                dto.setCantidadDespachada(0);
                dto.setUnidadMedida(detalle.getProducto().getUnidadMedida().getAbreviaturaunidadmedida());
            }

            dto.setCantidadSolicitada(dto.getCantidadSolicitada() + detalle.getCantidad_solicitada());
            dto.setCantidadDespachada(dto.getCantidadDespachada() + (detalle.getCantidad_despachada() != null ? detalle.getCantidad_despachada() : 0));
            dto.setCantidadPendiente(dto.getCantidadSolicitada() - dto.getCantidadDespachada());
            
            consolidados.put(idProd, dto);
        }

        for (PresupuestoRevisionDTO dto : consolidados.values()) {
            List<PresupuestoRevisionDTO.ProductoFisicoDisponibleDTO> sustitutos = new ArrayList<>();
            int totalDespachoVirtual = 0;
            int totalGlobalSustitutos = 0;

            if (dto.getEsGenerico()) {
                List<Producto> hijosFisicos = productoRepository.findByProductoPadre_IdProductoAndActivoTrue(dto.getIdProducto().intValue());
                for (Producto hijo : hijosFisicos) {
                    List<Inventario> stock = inventarioRepository.findByIdIdProducto(hijo.getIdProducto());
                    int enDespacho = stock.stream().filter(i -> i.getBodega().getIdBodega().equals(ID_BODEGA_DESPACHO.intValue())).mapToInt(Inventario::getCantidad_actual).sum();
                    int enGlobal = stock.stream().mapToInt(Inventario::getCantidad_actual).sum();
                    
                    List<StockBodegaDTO> desglose = stock.stream()
                        .filter(i -> !i.getBodega().getIdBodega().equals(ID_BODEGA_DESPACHO.intValue()) && i.getCantidad_actual() > 0)
                        .map(i -> new StockBodegaDTO(i.getBodega().getNombrebodega(), i.getCantidad_actual()))
                        .collect(Collectors.toList());

                    totalDespachoVirtual += enDespacho;
                    totalGlobalSustitutos += enGlobal;
                    
                    if (enGlobal > 0) {
                        PresupuestoRevisionDTO.ProductoFisicoDisponibleDTO s = new PresupuestoRevisionDTO.ProductoFisicoDisponibleDTO();
                        s.setIdProducto(hijo.getIdProducto());
                        s.setNombreProducto(hijo.getNombreproducto());
                        s.setSkuProducto(hijo.getSkuproducto());
                        
                        s.setMarcaProducto(hijo.getModelo() != null && hijo.getModelo().getMarca() != null ? hijo.getModelo().getMarca().getNombremarca() : "SIN ESPECIFICAR");
                        s.setModeloProducto(hijo.getModelo() != null ? hijo.getModelo().getNombremodelo() : "SIN ESPECIFICAR");
                        s.setSerieProducto(hijo.getSerieproducto());
                        s.setInventarioProducto(hijo.getInventarioproducto());
                        s.setEsNuevo(hijo.getEsNuevo());
                        s.setStockEnDespacho(enDespacho);
                        s.setStockGlobal(enGlobal);
                        s.setDesgloseBodegas(desglose);
                        sustitutos.add(s);
                    }
                }
            } else {
                List<Inventario> stock = inventarioRepository.findByIdIdProducto(dto.getIdProducto().intValue());
                int enDespacho = stock.stream().filter(i -> i.getBodega().getIdBodega().equals(ID_BODEGA_DESPACHO.intValue())).mapToInt(Inventario::getCantidad_actual).sum();
                int enGlobal = stock.stream().mapToInt(Inventario::getCantidad_actual).sum();
                
                List<StockBodegaDTO> desglose = stock.stream()
                    .filter(i -> !i.getBodega().getIdBodega().equals(ID_BODEGA_DESPACHO.intValue()) && i.getCantidad_actual() > 0)
                    .map(i -> new StockBodegaDTO(i.getBodega().getNombrebodega(), i.getCantidad_actual()))
                    .collect(Collectors.toList());

                totalDespachoVirtual += enDespacho;
                totalGlobalSustitutos += enGlobal;
                
                PresupuestoRevisionDTO.ProductoFisicoDisponibleDTO s = new PresupuestoRevisionDTO.ProductoFisicoDisponibleDTO();
                s.setIdProducto(dto.getIdProducto().intValue());
                s.setNombreProducto(dto.getNombreProducto());
                
                Producto prodFisicoUnico = productoRepository.findById(dto.getIdProducto().intValue()).orElse(null);
                if (prodFisicoUnico != null) {
                    s.setSkuProducto(prodFisicoUnico.getSkuproducto());

                }

                s.setMarcaProducto(prodFisicoUnico.getModelo() != null && prodFisicoUnico.getModelo().getMarca() != null ? prodFisicoUnico.getModelo().getMarca().getNombremarca() : "SIN ESPECIFICAR");
                s.setModeloProducto(prodFisicoUnico.getModelo() != null ? prodFisicoUnico.getModelo().getNombremodelo() : "SIN ESPECIFICAR");
                s.setSerieProducto(prodFisicoUnico.getSerieproducto());
                s.setInventarioProducto(prodFisicoUnico.getInventarioproducto());
                s.setEsNuevo(prodFisicoUnico.getEsNuevo());

                s.setStockEnDespacho(enDespacho);
                s.setStockGlobal(enGlobal);
                s.setDesgloseBodegas(desglose);
                sustitutos.add(s);
            }

            dto.setCantidadEnBodegaDespacho(totalDespachoVirtual);
            dto.setTotalStockGlobal(totalGlobalSustitutos);
            dto.setSustitutosDisponibles(sustitutos);
        }

        return new ArrayList<>(consolidados.values());
    }

    @Transactional
    public void aprobarPresupuesto(Long idPresupuesto, Integer idUsuario){
        Presupuesto presupuesto = this.obtenerPorId(idPresupuesto);
        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow();
        presupuesto.setEstado("APROBADO");
        presupuesto.setFecha_modificacion(Instant.now());
        presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuario, "APROBACION"));
        notificacionService.registrar(usuario.getNombreusuario(), "ha aprobado el Presupuesto #" + presupuesto.getIdPresupuesto());
        presupuestoRepository.save(presupuesto);
    }

    @Transactional
    public void cancelarPresupuesto(Long idPresupuesto, Integer idUsuario){
        Presupuesto presupuesto = this.obtenerPorId(idPresupuesto);
        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow();
        presupuesto.setEstado("CANCELADO");
        presupuesto.setFecha_modificacion(Instant.now());
        presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuario, "CANCELACION"));
        notificacionService.registrar(usuario.getNombreusuario(), "ha cancelado el Presupuesto #" + presupuesto.getIdPresupuesto());
        presupuestoRepository.save(presupuesto);
    }

    @Transactional
    public void despacharPresupuesto(Long idPresupuesto, DespachoPayloadDTO payload) {
        Presupuesto presupuesto = this.obtenerPorId(idPresupuesto);
        Usuario usuario = usuarioRepository.findById(payload.getIdUsuario()).orElseThrow();
        
        boolean seDespachoAlgo = false;

        // Mantenemos en memoria las líneas actuales para agrupar o añadir
        List<PresupuestoDetalle> detallesActuales = presupuestoDetalleRepository.findByPresupuesto(presupuesto);

        for (DespachoPayloadDTO.ItemDespachoDTO itemReq : payload.getItems()) {
            if (itemReq.getCantidadADespachar() <= 0) continue;

            PresupuestoDetalle detalleOrigen = presupuestoDetalleRepository.findById(itemReq.getIdDetalle()).orElseThrow();
            Producto productoFisico = productoRepository.findById(itemReq.getIdProductoFisico()).orElseThrow();

            InventarioId invId = new InventarioId();
            invId.setIdBodega(ID_BODEGA_DESPACHO.intValue());
            invId.setIdProducto(productoFisico.getIdProducto());
            Inventario inv = inventarioRepository.findById(invId).orElseThrow(() -> new RuntimeException("Sin inventario para " + productoFisico.getNombreproducto()));

            if (inv.getCantidad_actual() < itemReq.getCantidadADespachar()) {
                throw new RuntimeException("Stock insuficiente de " + productoFisico.getNombreproducto() + " en Bodega de Despacho.");
            }

            // 1. Salida física de bodega de despacho
            inventarioService.registrarMovimiento(
                productoFisico.getIdProducto(), 
                ID_BODEGA_DESPACHO.intValue(), 
                "DESPACHO", 
                itemReq.getCantidadADespachar(), 
                payload.getIdUsuario(), 
                "Despacho Aut. Presupuesto #" + idPresupuesto);

            // 2. AGRUPACIÓN FÍSICA: Verificamos si ya despachamos antes este producto físico en esta línea
            PresupuestoDetalle existenteFisico = detallesActuales.stream()
                .filter(d -> d.getProductoFisico() != null 
                          && d.getProductoFisico().getIdProducto().equals(productoFisico.getIdProducto())
                          && d.getProducto().getIdProducto().equals(detalleOrigen.getProducto().getIdProducto()))
                .findFirst().orElse(null);

            if (existenteFisico != null) {
                // Si ya existía, sumamos las cantidades para que no cree nuevas líneas repetidas
                existenteFisico.setCantidad_solicitada(existenteFisico.getCantidad_solicitada() + itemReq.getCantidadADespachar());
                existenteFisico.setCantidad_despachada(existenteFisico.getCantidad_despachada() + itemReq.getCantidadADespachar());
                presupuestoDetalleRepository.save(existenteFisico);
            } else {
                // Si es la primera vez que se despacha este físico, creamos la línea y la agregamos a memoria
                PresupuestoDetalle nuevoDespacho = new PresupuestoDetalle();
                nuevoDespacho.setPresupuesto(presupuesto);
                nuevoDespacho.setProducto(detalleOrigen.getProducto()); 
                nuevoDespacho.setProductoFisico(productoFisico); 
                nuevoDespacho.setCantidad_solicitada(itemReq.getCantidadADespachar());
                nuevoDespacho.setCantidad_despachada(itemReq.getCantidadADespachar());
                presupuestoDetalleRepository.save(nuevoDespacho);
                detallesActuales.add(nuevoDespacho);
            }

            // 3. Reducimos lo solicitado en la línea original
            detalleOrigen.setCantidad_solicitada(detalleOrigen.getCantidad_solicitada() - itemReq.getCantidadADespachar());
            if (detalleOrigen.getCantidad_solicitada() <= 0) {
                presupuestoDetalleRepository.delete(detalleOrigen);
                detallesActuales.remove(detalleOrigen);
            } else {
                presupuestoDetalleRepository.save(detalleOrigen);
            }
            seDespachoAlgo = true;
        }

        if (!seDespachoAlgo) throw new RuntimeException("No se procesó ningún despacho.");
        presupuestoDetalleRepository.flush();

        // 4. Evaluar Estado del Presupuesto sumando los despachos agrupados
        Map<Integer, Integer> solicitadosPorProducto = new HashMap<>();
        Map<Integer, Integer> despachadosPorProducto = new HashMap<>();

        for (PresupuestoDetalle d : detallesActuales) {
            Integer idProd = d.getProducto().getIdProducto();
            solicitadosPorProducto.put(idProd, solicitadosPorProducto.getOrDefault(idProd, 0) + d.getCantidad_solicitada());
            despachadosPorProducto.put(idProd, despachadosPorProducto.getOrDefault(idProd, 0) + (d.getCantidad_despachada() != null ? d.getCantidad_despachada() : 0));
        }

        boolean completado = true;
        for (Integer idProd : solicitadosPorProducto.keySet()) {
            int req = solicitadosPorProducto.get(idProd);
            int desp = despachadosPorProducto.getOrDefault(idProd, 0);
            
            if (desp < req) {
                completado = false;
                break;
            }
        }

        if (completado) {
            presupuesto.setEstado("DESPACHADO");
            presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuario, "DESPACHO TOTAL"));
        } else {
            presupuesto.setEstado("DESPACHO PARCIAL");
            presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuario, "DESPACHO PARCIAL"));
        }

        presupuesto.setFecha_modificacion(Instant.now());
        notificacionService.registrar(usuario.getNombreusuario(), "ha despachado materiales para el Presupuesto #" + idPresupuesto);
        presupuestoRepository.save(presupuesto);
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

        String refDespacho = "Despacho Aut. Presupuesto #" + idPresupuesto;
        List<MovimientoStock> movsDespacho = movimientoStockRepository.findMovimientosDeDespacho(refDespacho);
        if (!movsDespacho.isEmpty()) {
            movsDespacho.sort((m1, m2) -> m2.getFecha().compareTo(m1.getFecha()));
            reporte.setUsuarioDespachado(movsDespacho.get(0).getUsuario().getNombreusuario());
        } else {
            reporte.setUsuarioDespachado("Sistema");
        }

        String refOrigen = "Preparación para Presupuesto: " + idPresupuesto; 
        List<MovimientoStock> movimientosOrigen = movimientoStockRepository.findMovimientosDeOrigen(refOrigen);
        List<PresupuestoDetalle> detallesCrudos = presupuestoDetalleRepository.findByPresupuesto(presupuesto);

        Map<Integer, List<PresupuestoDetalle>> detallesPorGenerico = detallesCrudos.stream()
                .collect(Collectors.groupingBy(d -> d.getProducto().getIdProducto()));

        List<DespachoReporteDTO.DetalleDespachoItem> itemsDTO = new ArrayList<>();

        for(Map.Entry<Integer, List<PresupuestoDetalle>> entry : detallesPorGenerico.entrySet()) {
            List<PresupuestoDetalle> lineas = entry.getValue();
            Producto productoGenerico = lineas.get(0).getProducto();

            int totalReq = lineas.stream().mapToInt(PresupuestoDetalle::getCantidad_solicitada).sum();
            int totalDesp = lineas.stream().mapToInt(d -> d.getCantidad_despachada() != null ? d.getCantidad_despachada() : 0).sum();
            int pendiente = totalReq - totalDesp;
            
            DespachoReporteDTO.DetalleDespachoItem itemPadre = new DespachoReporteDTO.DetalleDespachoItem();
            itemPadre.setSkuGenerico(productoGenerico.getSkuproducto());
            itemPadre.setNombreGenerico(productoGenerico.getNombreproducto());
            itemPadre.setUnidadMedida(productoGenerico.getUnidadMedida() != null ? productoGenerico.getUnidadMedida().getNombreunidadmedida() : "Unid");
            itemPadre.setCantidadSolicitada(totalReq);
            itemPadre.setCantidadDespachada(totalDesp);
            itemPadre.setCantidadPendiente(pendiente);
            
            if (pendiente == 0) itemPadre.setEstadoItem("COMPLETADO");
            else if (totalDesp > 0) itemPadre.setEstadoItem("PARCIAL");
            else itemPadre.setEstadoItem("PENDIENTE");
            
            List<DespachoReporteDTO.SubItemDespacho> entregasFisicas = new ArrayList<>();
            
            // AGRUPACIÓN FÍSICA PARA EL PDF
            Map<Integer, Producto> mapProductosFisicos = new HashMap<>();
            Map<Integer, Integer> mapCantidadesFisicas = new HashMap<>();
            
            for (PresupuestoDetalle linea : lineas) {
                if (linea.getCantidad_despachada() != null && linea.getCantidad_despachada() > 0 && linea.getProductoFisico() != null) {
                    Producto prodFisico = linea.getProductoFisico();
                    mapProductosFisicos.put(prodFisico.getIdProducto(), prodFisico);
                    mapCantidadesFisicas.put(prodFisico.getIdProducto(), 
                        mapCantidadesFisicas.getOrDefault(prodFisico.getIdProducto(), 0) + linea.getCantidad_despachada());
                }
            }

            for (Integer idFisico : mapCantidadesFisicas.keySet()) {
                Producto prodFisico = mapProductosFisicos.get(idFisico);
                int cantEntregadaFisico = mapCantidadesFisicas.get(idFisico);
                
                List<MovimientoStock> movsFisicos = movimientosOrigen.stream()
                        .filter(m -> m.getProducto().getIdProducto().equals(prodFisico.getIdProducto()))
                        .collect(Collectors.toList());
                        
                Map<String, Integer> agrupadoPorBodega = movsFisicos.stream()
                        .collect(Collectors.groupingBy(m -> m.getBodega().getNombrebodega(), Collectors.summingInt(MovimientoStock::getCantidad)));
                        
                int yaMapeado = 0;
                for (Map.Entry<String, Integer> bEntry : agrupadoPorBodega.entrySet()) {
                    int aAsignar = Math.min(bEntry.getValue(), cantEntregadaFisico - yaMapeado);
                    if (aAsignar > 0) {
                        DespachoReporteDTO.SubItemDespacho sub = new DespachoReporteDTO.SubItemDespacho();
                        sub.setSkuFisico(prodFisico.getSkuproducto());
                        sub.setNombreFisico(prodFisico.getNombreproducto());
                        sub.setBodegaOrigen(bEntry.getKey());
                        sub.setCantidad(aAsignar);
                        entregasFisicas.add(sub);
                        yaMapeado += aAsignar;
                    }
                }
                
                // Fallback por si la cantidad transferida no cuadra con el historial de movimientos
                if (yaMapeado < cantEntregadaFisico) {
                    DespachoReporteDTO.SubItemDespacho sub = new DespachoReporteDTO.SubItemDespacho();
                    sub.setSkuFisico(prodFisico.getSkuproducto());
                    sub.setNombreFisico(prodFisico.getNombreproducto());
                    sub.setBodegaOrigen("Bodega Despacho");
                    sub.setCantidad(cantEntregadaFisico - yaMapeado);
                    entregasFisicas.add(sub);
                }
            }
            
            itemPadre.setEntregasFisicas(entregasFisicas);
            itemsDTO.add(itemPadre);
        }
        
        reporte.setItems(itemsDTO);
        return reporte;
    }
}