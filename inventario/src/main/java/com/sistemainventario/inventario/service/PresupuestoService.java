package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.dto.*;
import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PresupuestoService {

    private final Long ID_BODEGA_DESPACHO = 1L;
    private final Integer ID_BODEGA_ASIGNACION = 7;

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
    private final AsignacionDetalleRepository asignacionDetalleRepository;

    public PresupuestoService(PresupuestoRepository presupuestoRepository,
                              PresupuestoDetalleRepository presupuestoDetalleRepository,
                              InventarioRepository inventarioRepository,
                              ProductoRepository productoRepository,
                              UsuarioRepository usuarioRepository,
                              InventarioService inventarioService,
                              MovimientoStockRepository movimientoStockRepository,
                              UbicacionRepository ubicacionRepository,
                              PresupuestoHistorialRepository presupuestoHistorialRepository,
                              NotificacionService notificacionService,
                              AsignacionDetalleRepository asignacionDetalleRepository) {
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
        this.asignacionDetalleRepository = asignacionDetalleRepository;
    }

    private boolean esCategoriaMaterial(Producto p) {
        if (p == null || p.getCategoria() == null || p.getCategoria().getNombrecategoria() == null) {
            return false;
        }
        return p.getCategoria().getNombrecategoria().trim().equalsIgnoreCase("MATERIALES");
    }

    /**
     * Filtra únicamente bodegas físicas reales (excluye Bodega Despacho ID 1 y Bodega Asignación ID 7).
     */
    private boolean esBodegaFisica(Bodega b) {
        if (b == null || b.getIdBodega() == null) return false;
        if (b.getIdBodega().equals(ID_BODEGA_DESPACHO.intValue()) || b.getIdBodega().equals(ID_BODEGA_ASIGNACION)) {
            return false;
        }
        return b.getBodegaTipo() == null || b.getBodegaTipo().getIdBodegaTipo() != 1;
    }

    private static class RespaldoAsignacionInfo {
        int cantidadDisponible = 0;
        List<StockBodegaDTO> etiquetasDesglose = new ArrayList<>();
    }

    /**
     * Opción A: Verifica si el equipo está reservado en Bodega Asignación (PENDIENTE) o aprobado (ASIGNADO)
     * para la misma ubicación del presupuesto y aún no ha sido despachado en ningún presupuesto de esa ubicación.
     * Devuelve únicamente el badge limpio de su bodega física de origen.
     */
    private RespaldoAsignacionInfo calcularRespaldoPorAsignacion(Integer idProductoFisico, Integer idUbicacion, int stockEnBodegasFisicas) {
        RespaldoAsignacionInfo info = new RespaldoAsignacionInfo();
        List<AsignacionDetalle> asignaciones = asignacionDetalleRepository
                .buscarAsignacionesActivasEnUbicacion(idProductoFisico, idUbicacion);

        if (asignaciones.isEmpty()) {
            return info;
        }

        int totalEnAsignacionesUbicacion = 0;
        Map<String, Integer> bodegasOrigen = new java.util.LinkedHashMap<>();

        for (AsignacionDetalle ad : asignaciones) {
            String estadoDetalle = ad.getEstado();
            String nombreBod = ad.getBodegaOrigen() != null ? ad.getBodegaOrigen().getNombrebodega() : "Bodega General";

            if ("PENDIENTE".equalsIgnoreCase(estadoDetalle) || "ASIGNADO".equalsIgnoreCase(estadoDetalle)) {
                totalEnAsignacionesUbicacion += 1;
                bodegasOrigen.put(nombreBod, bodegasOrigen.getOrDefault(nombreBod, 0) + 1);
            }
        }

        if (totalEnAsignacionesUbicacion > 0) {
            int yaDocumentado = presupuestoDetalleRepository
                    .contarEquipoDespachadoEnUbicacion(idProductoFisico, idUbicacion);

            int disponibleSinDocumentar = Math.max(0, totalEnAsignacionesUbicacion - yaDocumentado);
            if (disponibleSinDocumentar > 0) {
                info.cantidadDisponible = disponibleSinDocumentar;

                // Mostrar solo el badge normal de su bodega física de origen
                if (stockEnBodegasFisicas == 0) {
                    for (Map.Entry<String, Integer> entry : bodegasOrigen.entrySet()) {
                        info.etiquetasDesglose.add(new StockBodegaDTO(entry.getKey(), Math.min(entry.getValue(), disponibleSinDocumentar)));
                    }
                }
            }
        }

        return info;
    }

    @Transactional(readOnly = true)
    public synchronized int calcularSiguienteCorrelativoActa(int anio) {
        return presupuestoRepository.findMaxCorrelativoNoCancelado(anio)
                .map(max -> max + 1)
                .orElse(1);
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
    public List<PresupuestoDetalle> listarDetallePresupuesto(Long idPresupuesto) {
        Presupuesto presupuesto = presupuestoRepository.findById(idPresupuesto)
            .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado"));

        List<PresupuestoDetalle> crudos = presupuestoDetalleRepository.findByPresupuesto(presupuesto);
        Map<Integer, PresupuestoDetalle> consolidados = new HashMap<>();

        for (PresupuestoDetalle d : crudos) {
            Integer idProd = d.getProducto().getIdProducto();
            if (consolidados.containsKey(idProd)) {
                PresupuestoDetalle existente = consolidados.get(idProd);
                existente.setCantidad_solicitada(existente.getCantidad_solicitada() + d.getCantidad_solicitada());
                existente.setCantidad_despachada(existente.getCantidad_despachada() + (d.getCantidad_despachada() != null ? d.getCantidad_despachada() : 0));
            } else {
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
        presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuario, "CREACION"));

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
        Integer idUbicacionPresupuesto = presupuesto.getUbicacion().getIdUbicacion();
        List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuesto(presupuesto);

        // Equipos físicos que ya fueron despachados parcialmente en ESTE presupuesto
        Map<Integer, Integer> yaDespachadoEnEstePresupuesto = detalles.stream()
                .filter(d -> d.getProductoFisico() != null && d.getCantidad_despachada() != null && d.getCantidad_despachada() > 0)
                .collect(Collectors.groupingBy(
                        d -> d.getProductoFisico().getIdProducto(),
                        Collectors.summingInt(PresupuestoDetalle::getCantidad_despachada)
                ));

        Map<Integer, PresupuestoRevisionDTO> consolidados = new HashMap<>();

        for (PresupuestoDetalle detalle : detalles) {
            Integer idProd = detalle.getProducto().getIdProducto();

            PresupuestoRevisionDTO dto = consolidados.getOrDefault(idProd, new PresupuestoRevisionDTO());
            if (dto.getIdProducto() == null) {
                dto.setIdDetalle(detalle.getIdPresupuestoDetalle());
                dto.setIdProducto(idProd.longValue());
                dto.setNombreProducto(detalle.getProducto().getNombreproducto());
                dto.setEsGenerico(detalle.getProducto().getEsGenerico());
                dto.setEsMaterial(esCategoriaMaterial(detalle.getProducto()));
                dto.setCantidadSolicitada(0);
                dto.setCantidadDespachada(0);
                dto.setUnidadMedida(detalle.getProducto().getUnidadMedida().getAbreviaturaunidadmedida());
            }

            // Apuntar siempre a la fila pendiente (donde productoFisico es null) para no borrar despachos parciales previos
            if (detalle.getProductoFisico() == null) {
                dto.setIdDetalle(detalle.getIdPresupuestoDetalle());
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

                    int stockRealBodegaDespacho = stock.stream()
                            .filter(i -> i.getBodega().getIdBodega().equals(ID_BODEGA_DESPACHO.intValue()))
                            .mapToInt(Inventario::getCantidad_actual).sum();

                    int stockEnBodegasFisicas = stock.stream()
                            .filter(i -> esBodegaFisica(i.getBodega()) && i.getCantidad_actual() > 0)
                            .mapToInt(Inventario::getCantidad_actual).sum();

                    int reservadoActivo = calcularReservaActivaEnDespacho(hijo.getIdProducto(), idPresupuesto);
                    int enDespacho = Math.min(stockRealBodegaDespacho, reservadoActivo);

                    List<StockBodegaDTO> desglose = new ArrayList<>();

                    if (!Boolean.TRUE.equals(dto.getEsMaterial())) {
                        int yaUsadoAqui = yaDespachadoEnEstePresupuesto.getOrDefault(hijo.getIdProducto(), 0);
                        int yaUsadoEnUbicacion = presupuestoDetalleRepository.contarEquipoDespachadoEnUbicacion(hijo.getIdProducto(), idUbicacionPresupuesto);
                        int descuentoPrevio = Math.max(yaUsadoAqui, yaUsadoEnUbicacion);

                        int stockFisicoDisponible = Math.max(0, stockEnBodegasFisicas - descuentoPrevio);

                        if (stockFisicoDisponible > 0) {
                            desglose = stock.stream()
                                    .filter(i -> esBodegaFisica(i.getBodega()) && i.getCantidad_actual() > 0)
                                    .map(i -> new StockBodegaDTO(i.getBodega().getNombrebodega(), Math.min(i.getCantidad_actual(), stockFisicoDisponible)))
                                    .collect(Collectors.toList());
                        }

                        RespaldoAsignacionInfo respaldo = calcularRespaldoPorAsignacion(
                                hijo.getIdProducto(), idUbicacionPresupuesto, stockFisicoDisponible);

                        int dispAsignacion = yaUsadoAqui > 0 ? 0 : respaldo.cantidadDisponible;
                        int enGlobal = stockFisicoDisponible + enDespacho + dispAsignacion;

                        if (dispAsignacion > 0 && !respaldo.etiquetasDesglose.isEmpty()) {
                            desglose.addAll(respaldo.etiquetasDesglose);
                        }

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
                            s.setDescripcionProducto(hijo.getDescripcionproducto());
                            s.setEsNuevo(hijo.getEsNuevo());
                            s.setStockEnDespacho(enDespacho);
                            s.setStockGlobal(enGlobal);
                            s.setDesgloseBodegas(desglose);
                            sustitutos.add(s);
                        }
                    } else {
                        int enGlobal = stockEnBodegasFisicas + enDespacho;
                        desglose = stock.stream()
                                .filter(i -> esBodegaFisica(i.getBodega()) && i.getCantidad_actual() > 0)
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
                            s.setDescripcionProducto(hijo.getDescripcionproducto());
                            s.setEsNuevo(hijo.getEsNuevo());
                            s.setStockEnDespacho(enDespacho);
                            s.setStockGlobal(enGlobal);
                            s.setDesgloseBodegas(desglose);
                            sustitutos.add(s);
                        }
                    }
                }
            } else {
                int idProdFisico = dto.getIdProducto().intValue();
                List<Inventario> stock = inventarioRepository.findByIdIdProducto(idProdFisico);

                int stockRealBodegaDespacho = stock.stream()
                        .filter(i -> i.getBodega().getIdBodega().equals(ID_BODEGA_DESPACHO.intValue()))
                        .mapToInt(Inventario::getCantidad_actual).sum();

                int stockEnBodegasFisicas = stock.stream()
                        .filter(i -> esBodegaFisica(i.getBodega()) && i.getCantidad_actual() > 0)
                        .mapToInt(Inventario::getCantidad_actual).sum();

                int reservadoActivo = calcularReservaActivaEnDespacho(idProdFisico, idPresupuesto);
                int enDespacho = Math.min(stockRealBodegaDespacho, reservadoActivo);
                int enGlobal = stockEnBodegasFisicas + enDespacho;

                List<StockBodegaDTO> desglose = stock.stream()
                        .filter(i -> esBodegaFisica(i.getBodega()) && i.getCantidad_actual() > 0)
                        .map(i -> new StockBodegaDTO(i.getBodega().getNombrebodega(), i.getCantidad_actual()))
                        .collect(Collectors.toList());

                if (!Boolean.TRUE.equals(dto.getEsMaterial())) {
                    int yaUsadoAqui = yaDespachadoEnEstePresupuesto.getOrDefault(idProdFisico, 0);
                    int yaUsadoEnUbicacion = presupuestoDetalleRepository.contarEquipoDespachadoEnUbicacion(idProdFisico, idUbicacionPresupuesto);
                    int descuentoPrevio = Math.max(yaUsadoAqui, yaUsadoEnUbicacion);

                    int stockFisicoDisponible = Math.max(0, stockEnBodegasFisicas - descuentoPrevio);
                    if (stockFisicoDisponible == 0) {
                        desglose.clear();
                    }

                    RespaldoAsignacionInfo respaldo = calcularRespaldoPorAsignacion(
                            idProdFisico, idUbicacionPresupuesto, stockFisicoDisponible);

                    int dispAsignacion = yaUsadoAqui > 0 ? 0 : respaldo.cantidadDisponible;
                    enGlobal = stockFisicoDisponible + enDespacho + dispAsignacion;

                    if (dispAsignacion > 0 && !respaldo.etiquetasDesglose.isEmpty()) {
                        desglose.addAll(respaldo.etiquetasDesglose);
                    }
                }

                totalDespachoVirtual += enDespacho;
                totalGlobalSustitutos += enGlobal;

                PresupuestoRevisionDTO.ProductoFisicoDisponibleDTO s = new PresupuestoRevisionDTO.ProductoFisicoDisponibleDTO();
                s.setIdProducto(idProdFisico);
                s.setNombreProducto(dto.getNombreProducto());

                Producto prodFisicoUnico = productoRepository.findById(idProdFisico).orElse(null);
                if (prodFisicoUnico != null) {
                    s.setSkuProducto(prodFisicoUnico.getSkuproducto());
                    s.setMarcaProducto(prodFisicoUnico.getModelo() != null && prodFisicoUnico.getModelo().getMarca() != null ? prodFisicoUnico.getModelo().getMarca().getNombremarca() : "SIN ESPECIFICAR");
                    s.setModeloProducto(prodFisicoUnico.getModelo() != null ? prodFisicoUnico.getModelo().getNombremodelo() : "SIN ESPECIFICAR");
                    s.setSerieProducto(prodFisicoUnico.getSerieproducto());
                    s.setInventarioProducto(prodFisicoUnico.getInventarioproducto());
                    s.setDescripcionProducto(prodFisicoUnico.getDescripcionproducto());
                    s.setEsNuevo(prodFisicoUnico.getEsNuevo());
                }

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
    public void aprobarPresupuesto(Long idPresupuesto, Integer idUsuario) {
        Presupuesto presupuesto = this.obtenerPorId(idPresupuesto);
        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow();
        presupuesto.setEstado("APROBADO");
        presupuesto.setFecha_modificacion(Instant.now());
        presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuario, "APROBACION"));
        notificacionService.registrar(usuario.getNombreusuario(), "ha aprobado el Presupuesto #" + presupuesto.getIdPresupuesto());
        presupuestoRepository.save(presupuesto);
    }

    @Transactional
    public void finalizarPresupuesto(Long idPresupuesto, Integer idUsuario) {
        Presupuesto presupuesto = this.obtenerPorId(idPresupuesto);
        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow();
        presupuesto.setEstado("DESPACHADO");
        presupuesto.setFecha_modificacion(Instant.now());
        presupuestoHistorialRepository.save(new PresupuestoHistorial(presupuesto, usuario, "DESPACHO TOTAL"));
        notificacionService.registrar(usuario.getNombreusuario(), "ha finalizado el Presupuesto #" + presupuesto.getIdPresupuesto());
        presupuestoRepository.save(presupuesto);
    }

    @Transactional
    public void cancelarPresupuesto(Long idPresupuesto, Integer idUsuario) {
        Presupuesto presupuesto = this.obtenerPorId(idPresupuesto);
        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow();
        presupuesto.setEstado("CANCELADO");
        presupuesto.setCorrelativo(null);
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
        List<PresupuestoDetalle> detallesActuales = presupuestoDetalleRepository.findByPresupuesto(presupuesto);

        for (DespachoPayloadDTO.ItemDespachoDTO itemReq : payload.getItems()) {
            if (itemReq.getCantidadADespachar() <= 0) continue;

            PresupuestoDetalle detalleOrigen = presupuestoDetalleRepository.findById(itemReq.getIdDetalle()).orElseThrow();
            // Blindaje para despachos parciales: asegurar que detalleOrigen sea siempre la fila pendiente (productoFisico == null)
            if (detalleOrigen.getProductoFisico() != null) {
                Integer idProdGen = detalleOrigen.getProducto().getIdProducto();
                detalleOrigen = detallesActuales.stream()
                        .filter(d -> d.getProductoFisico() == null && d.getProducto().getIdProducto().equals(idProdGen))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("No se encontró saldo pendiente por despachar para este requerimiento."));
            }

            Producto productoFisico = productoRepository.findById(itemReq.getIdProductoFisico()).orElseThrow();
            boolean esMaterial = esCategoriaMaterial(productoFisico) || esCategoriaMaterial(detalleOrigen.getProducto());

            if (esMaterial) {
                int disponibleReservado = calcularReservaActivaEnDespacho(productoFisico.getIdProducto(), idPresupuesto);

                if (disponibleReservado < itemReq.getCantidadADespachar()) {
                    throw new RuntimeException("El material '" + productoFisico.getNombreproducto() + "' no cuenta con reserva activa en Bodega de Despacho para este presupuesto.");
                }

                InventarioId invId = new InventarioId();
                invId.setIdBodega(ID_BODEGA_DESPACHO.intValue());
                invId.setIdProducto(productoFisico.getIdProducto());
                Inventario inv = inventarioRepository.findById(invId)
                        .orElseThrow(() -> new RuntimeException("Sin inventario en Bodega de Despacho para " + productoFisico.getNombreproducto()));

                if (inv.getCantidad_actual() < itemReq.getCantidadADespachar()) {
                    throw new RuntimeException("Stock insuficiente de " + productoFisico.getNombreproducto() + " en Bodega de Despacho.");
                }

                inventarioService.registrarMovimiento(
                    productoFisico.getIdProducto(), 
                    ID_BODEGA_DESPACHO.intValue(), 
                    "DESPACHO", 
                    itemReq.getCantidadADespachar(), 
                    payload.getIdUsuario(), 
                    "Despacho Aut. Presupuesto #" + idPresupuesto
                );
            } else {
                // EQUIPOS INFORMÁTICOS: Valida stock en bodegas físicas O asignación activa en la misma ubicación
                int yaDespachadoEnEste = detallesActuales.stream()
                        .filter(d -> d.getProductoFisico() != null && d.getProductoFisico().getIdProducto().equals(productoFisico.getIdProducto()))
                        .mapToInt(d -> d.getCantidad_despachada() != null ? d.getCantidad_despachada() : 0)
                        .sum();

                int stockFisicoReal = inventarioRepository.findByIdIdProducto(productoFisico.getIdProducto())
                        .stream()
                        .filter(i -> esBodegaFisica(i.getBodega()) && i.getCantidad_actual() > 0)
                        .mapToInt(Inventario::getCantidad_actual).sum();

                int stockFisicoDisponible = Math.max(0, stockFisicoReal - yaDespachadoEnEste);

                RespaldoAsignacionInfo respaldo = calcularRespaldoPorAsignacion(
                        productoFisico.getIdProducto(),
                        presupuesto.getUbicacion().getIdUbicacion(),
                        stockFisicoDisponible
                );

                int dispAsignacion = yaDespachadoEnEste > 0 ? 0 : respaldo.cantidadDisponible;
                int totalDisponibleParaDocumentar = stockFisicoDisponible + dispAsignacion;

                if (totalDisponibleParaDocumentar < itemReq.getCantidadADespachar()) {
                    throw new RuntimeException("El equipo " + productoFisico.getNombreproducto() + " ya fue despachado o no cuenta con existencias disponibles.");
                }
            }

            // 2. AGRUPACIÓN DOCUMENTAL EN PRESUPUESTO_DETALLE
            final PresupuestoDetalle refDetalleOrigen = detalleOrigen;
            PresupuestoDetalle existenteFisico = detallesActuales.stream()
                .filter(d -> d.getProductoFisico() != null 
                          && d.getProductoFisico().getIdProducto().equals(productoFisico.getIdProducto())
                          && d.getProducto().getIdProducto().equals(refDetalleOrigen.getProducto().getIdProducto()))
                .findFirst().orElse(null);

            if (existenteFisico != null) {
                existenteFisico.setCantidad_solicitada(existenteFisico.getCantidad_solicitada() + itemReq.getCantidadADespachar());
                existenteFisico.setCantidad_despachada(existenteFisico.getCantidad_despachada() + itemReq.getCantidadADespachar());
                presupuestoDetalleRepository.save(existenteFisico);
            } else {
                PresupuestoDetalle nuevoDespacho = new PresupuestoDetalle();
                nuevoDespacho.setPresupuesto(presupuesto);
                nuevoDespacho.setProducto(detalleOrigen.getProducto()); 
                nuevoDespacho.setProductoFisico(productoFisico); 
                nuevoDespacho.setCantidad_solicitada(itemReq.getCantidadADespachar());
                nuevoDespacho.setCantidad_despachada(itemReq.getCantidadADespachar());
                presupuestoDetalleRepository.save(nuevoDespacho);
                detallesActuales.add(nuevoDespacho);
            }

            // 3. Reducir lo pendiente en la línea original
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

        // 4. Generar correlativo independiente del Acta de Movimiento de Materiales (si aún no tiene)
        if (presupuesto.getNumeroActa() == null || presupuesto.getNumeroActa().trim().isEmpty()) {
            int anioActual = Year.now().getValue();
            int siguienteCorrelativo = calcularSiguienteCorrelativoActa(anioActual);
            presupuesto.setAnio(anioActual);
            presupuesto.setCorrelativo(siguienteCorrelativo);
            presupuesto.setNumeroActa(siguienteCorrelativo + "-" + anioActual);
        }
        presupuesto.setFechaSalida(Instant.now());

        // 5. Evaluar Estado del Presupuesto
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

    private int calcularReservaActivaEnDespacho(Integer idProductoFisico, Long idPresupuestoTarget) {
        List<MovimientoStock> historialDespacho = movimientoStockRepository
                .findByProductoAndBodegaOrdenado(idProductoFisico, ID_BODEGA_DESPACHO.intValue());

        Map<Long, Integer> reservasActivas = new java.util.LinkedHashMap<>();

        for (MovimientoStock m : historialDespacho) {
            String tipo = m.getTipo() != null ? m.getTipo().trim().toUpperCase() : "";
            String motivo = m.getMotivo() != null ? m.getMotivo().trim() : "";
            int cant = m.getCantidad() != null ? m.getCantidad() : 0;

            if (cant <= 0) continue;

            if (tipo.contains("ENTRADA")) {
                if (motivo.startsWith("Preparación para Presupuesto:")) {
                    try {
                        Long idPres = Long.parseLong(motivo.replace("Preparación para Presupuesto:", "").trim());
                        reservasActivas.put(idPres, reservasActivas.getOrDefault(idPres, 0) + cant);
                    } catch (NumberFormatException ignored) {}
                }
            } else if (tipo.contains("DESPACHO")) {
                if (motivo.startsWith("Despacho Aut. Presupuesto #")) {
                    try {
                        Long idPres = Long.parseLong(motivo.replace("Despacho Aut. Presupuesto #", "").trim());
                        int actual = reservasActivas.getOrDefault(idPres, 0);
                        reservasActivas.put(idPres, Math.max(0, actual - cant));
                    } catch (NumberFormatException ignored) {}
                }
            } else if (tipo.contains("SALIDA") || tipo.contains("DESCARGO")) {
                if (motivo.startsWith("Reversión Preparación Presupuesto:")) {
                    try {
                        Long idPres = Long.parseLong(motivo.replace("Reversión Preparación Presupuesto:", "").trim());
                        int actual = reservasActivas.getOrDefault(idPres, 0);
                        reservasActivas.put(idPres, Math.max(0, actual - cant));
                    } catch (NumberFormatException ignored) {}
                } else {
                    int porDescontar = cant;
                    List<Long> ids = new ArrayList<>(reservasActivas.keySet());
                    for (int i = ids.size() - 1; i >= 0 && porDescontar > 0; i--) {
                        Long idPres = ids.get(i);
                        int resActual = reservasActivas.getOrDefault(idPres, 0);
                        if (resActual > 0) {
                            int descuento = Math.min(resActual, porDescontar);
                            reservasActivas.put(idPres, resActual - descuento);
                            porDescontar -= descuento;
                        }
                    }
                }
            }
        }

        return reservasActivas.getOrDefault(idPresupuestoTarget, 0);
    }

    @Transactional
    public void revertirPreparacionMaterial(Long idPresupuesto, Integer idProductoFisico, Integer idUsuario) {
        int reservadoActivo = calcularReservaActivaEnDespacho(idProductoFisico, idPresupuesto);
        if (reservadoActivo <= 0) {
            throw new RuntimeException("No hay material reservado en Bodega de Despacho para este presupuesto.");
        }

        InventarioId invDespachoId = new InventarioId();
        invDespachoId.setIdBodega(ID_BODEGA_DESPACHO.intValue());
        invDespachoId.setIdProducto(idProductoFisico);

        Inventario invDespacho = inventarioRepository.findById(invDespachoId)
                .orElseThrow(() -> new RuntimeException("No se encontró stock en Bodega de Despacho."));

        int cantidadARevertir = Math.min(reservadoActivo, invDespacho.getCantidad_actual());
        if (cantidadARevertir <= 0) {
            throw new RuntimeException("La Bodega de Despacho no cuenta con existencias físicas para regresar.");
        }

        String refOrigen = "Preparación para Presupuesto: " + idPresupuesto;
        List<MovimientoStock> movsOrigen = movimientoStockRepository.findMovimientosDeOrigen(refOrigen).stream()
                .filter(m -> m.getProducto().getIdProducto().equals(idProductoFisico))
                .collect(Collectors.toList());

        Map<Integer, Integer> disponiblePorBodegaOrigen = new java.util.LinkedHashMap<>();
        for (MovimientoStock m : movsOrigen) {
            Integer idBod = m.getBodega().getIdBodega();
            disponiblePorBodegaOrigen.put(idBod, disponiblePorBodegaOrigen.getOrDefault(idBod, 0) + m.getCantidad());
        }

        String motivoReversion = "Reversión Preparación Presupuesto: " + idPresupuesto;
        int restantePorRegresar = cantidadARevertir;

        for (Map.Entry<Integer, Integer> entry : disponiblePorBodegaOrigen.entrySet()) {
            if (restantePorRegresar <= 0) break;

            Integer idBodegaDestino = entry.getKey();
            int cantHaciaEstaBodega = Math.min(entry.getValue(), restantePorRegresar);

            if (cantHaciaEstaBodega > 0) {
                inventarioService.registrarMovimiento(
                        idProductoFisico,
                        ID_BODEGA_DESPACHO.intValue(),
                        "SALIDA",
                        cantHaciaEstaBodega,
                        idUsuario,
                        motivoReversion
                );

                inventarioService.registrarMovimiento(
                        idProductoFisico,
                        idBodegaDestino,
                        "ENTRADA",
                        cantHaciaEstaBodega,
                        idUsuario,
                        motivoReversion
                );

                restantePorRegresar -= cantHaciaEstaBodega;
            }
        }
    }

    @Transactional(readOnly = true)
    public DespachoReporteDTO generarDatosDespacho(Long idPresupuesto) {
        Presupuesto presupuesto = this.obtenerPorId(idPresupuesto);
        DespachoReporteDTO reporte = new DespachoReporteDTO();
        reporte.setIdPresupuesto(presupuesto.getIdPresupuesto());
        reporte.setNumeroActa(presupuesto.getNumeroActa() != null ? presupuesto.getNumeroActa() : String.valueOf(presupuesto.getIdPresupuesto()));
        reporte.setFechaSalida(presupuesto.getFechaSalida() != null ? presupuesto.getFechaSalida() : presupuesto.getFecha_modificacion());
        reporte.setNombreProyecto(presupuesto.getNombre_presupuesto());
        reporte.setSolicitante(presupuesto.getIdusuariopresupuesto().getNombreusuario());
        reporte.setFechaAprobacion(presupuesto.getFecha_modificacion());
        reporte.setEstado(presupuesto.getEstado());
        reporte.setUbicacionDestino(presupuesto.getUbicacion().getSiglasubicacion());
        reporte.setNombreUbicacionDestino(presupuesto.getUbicacion().getNombreubicacion());
        reporte.setObservaciones(presupuesto.getObservaciones());

        Usuario usuarioQueDespacho = null;
        if (presupuesto.getHistorial() != null) {
            for (int i = presupuesto.getHistorial().size() - 1; i >= 0; i--) {
                PresupuestoHistorial h = presupuesto.getHistorial().get(i);
                if ("DESPACHO TOTAL".equals(h.getAccion()) || "DESPACHO PARCIAL".equals(h.getAccion())) {
                    usuarioQueDespacho = h.getUsuario();
                    break;
                }
            }
        }

        if (usuarioQueDespacho != null) {
            reporte.setUsuarioDespachado(usuarioQueDespacho.getNombreusuario());
            String ini = usuarioQueDespacho.getIniciales();
            if (ini == null || ini.trim().isEmpty()) {
                ini = presupuesto.getIdusuariopresupuesto().getIniciales();
            }
            reporte.setInicialesUsuarioActa(ini);
        } else {
            String refDespacho = "Despacho Aut. Presupuesto #" + idPresupuesto;
            List<MovimientoStock> movsDespacho = movimientoStockRepository.findMovimientosDeDespacho(refDespacho);
            if (!movsDespacho.isEmpty()) {
                movsDespacho.sort((m1, m2) -> m2.getFecha().compareTo(m1.getFecha()));
                Usuario uMov = movsDespacho.get(0).getUsuario();
                reporte.setUsuarioDespachado(uMov.getNombreusuario());
                reporte.setInicialesUsuarioActa(uMov.getIniciales() != null ? uMov.getIniciales() : presupuesto.getIdusuariopresupuesto().getIniciales());
                reporte.setFechaSalida(movsDespacho.get(0).getFecha());
            } else {
                reporte.setUsuarioDespachado("Sistema");
                reporte.setInicialesUsuarioActa(presupuesto.getIdusuariopresupuesto().getIniciales());
                reporte.setFechaSalida(presupuesto.getFecha_modificacion());
            }
        }

        String refOrigen = "Preparación para Presupuesto: " + idPresupuesto; 
        List<MovimientoStock> movimientosOrigen = movimientoStockRepository.findMovimientosDeOrigen(refOrigen);
        List<PresupuestoDetalle> detallesCrudos = presupuestoDetalleRepository.findByPresupuesto(presupuesto);

        Map<Integer, List<PresupuestoDetalle>> detallesPorGenerico = detallesCrudos.stream()
                .collect(Collectors.groupingBy(d -> d.getProducto().getIdProducto()));

        List<DespachoReporteDTO.DetalleDespachoItem> itemsDTO = new ArrayList<>();

        for (Map.Entry<Integer, List<PresupuestoDetalle>> entry : detallesPorGenerico.entrySet()) {
            List<PresupuestoDetalle> lineas = entry.getValue();
            Producto productoGenerico = lineas.get(0).getProducto();

            int totalReq = lineas.stream().mapToInt(PresupuestoDetalle::getCantidad_solicitada).sum();
            int totalDesp = lineas.stream().mapToInt(d -> d.getCantidad_despachada() != null ? d.getCantidad_despachada() : 0).sum();
            int pendiente = totalReq - totalDesp;
            
            DespachoReporteDTO.DetalleDespachoItem itemPadre = new DespachoReporteDTO.DetalleDespachoItem();
            itemPadre.setSkuGenerico(productoGenerico.getSkuproducto());
            itemPadre.setNombreGenerico(productoGenerico.getNombreproducto());
            itemPadre.setUnidadMedida(productoGenerico.getUnidadMedida() != null ? productoGenerico.getUnidadMedida().getAbreviaturaunidadmedida() : "u");
            itemPadre.setCantidadSolicitada(totalReq);
            itemPadre.setCantidadDespachada(totalDesp);
            itemPadre.setCantidadPendiente(pendiente);
            
            if (pendiente == 0) itemPadre.setEstadoItem("COMPLETADO");
            else if (totalDesp > 0) itemPadre.setEstadoItem("PARCIAL");
            else itemPadre.setEstadoItem("PENDIENTE");
            
            List<DespachoReporteDTO.SubItemDespacho> entregasFisicas = new ArrayList<>();
            
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
                boolean esMat = esCategoriaMaterial(prodFisico) || esCategoriaMaterial(productoGenerico);

                String marcaStr = (prodFisico.getModelo() != null && prodFisico.getModelo().getMarca() != null)
                        ? prodFisico.getModelo().getMarca().getNombremarca() : "N/A";
                String modeloStr = (prodFisico.getModelo() != null)
                        ? prodFisico.getModelo().getNombremodelo() : "N/A";
                String serieStr = (prodFisico.getSerieproducto() != null && !prodFisico.getSerieproducto().trim().isEmpty())
                        ? prodFisico.getSerieproducto() : "S/N";
                String invStr = (prodFisico.getInventarioproducto() != null && !prodFisico.getInventarioproducto().trim().isEmpty())
                        ? prodFisico.getInventarioproducto() : "S/I";
                
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
                        sub.setMarca(marcaStr);
                        sub.setModelo(modeloStr);
                        sub.setSerie(serieStr);
                        sub.setInventario(invStr);
                        sub.setEsMaterial(esMat);
                        sub.setBodegaOrigen(bEntry.getKey());
                        sub.setCantidad(aAsignar);
                        entregasFisicas.add(sub);
                        yaMapeado += aAsignar;
                    }
                }
                
                if (yaMapeado < cantEntregadaFisico) {
                    String nombreBodegaOrigen = "Bodega Despacho";
                    if (!esMat) {
                        List<Inventario> stockActual = inventarioRepository.findByIdIdProducto(prodFisico.getIdProducto())
                                .stream()
                                .filter(i -> esBodegaFisica(i.getBodega()))
                                .collect(Collectors.toList());

                        if (!stockActual.isEmpty()) {
                            nombreBodegaOrigen = stockActual.get(0).getBodega().getNombrebodega();
                        } else {
                            List<AsignacionDetalle> asigs = asignacionDetalleRepository
                                    .buscarAsignacionesActivasEnUbicacion(prodFisico.getIdProducto(), presupuesto.getUbicacion().getIdUbicacion());
                            if (!asigs.isEmpty() && asigs.get(0).getBodegaOrigen() != null) {
                                nombreBodegaOrigen = asigs.get(0).getBodegaOrigen().getNombrebodega();
                            } else {
                                nombreBodegaOrigen = "Bodega UTDI";
                            }
                        }
                    }

                    DespachoReporteDTO.SubItemDespacho sub = new DespachoReporteDTO.SubItemDespacho();
                    sub.setSkuFisico(prodFisico.getSkuproducto());
                    sub.setNombreFisico(prodFisico.getNombreproducto());
                    sub.setMarca(marcaStr);
                    sub.setModelo(modeloStr);
                    sub.setSerie(serieStr);
                    sub.setInventario(invStr);
                    sub.setEsMaterial(esMat);
                    sub.setBodegaOrigen(nombreBodegaOrigen);
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