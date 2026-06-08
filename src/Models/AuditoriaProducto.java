package Models;

import java.time.LocalDateTime;

public class AuditoriaProducto {
    private int idAuditoria;
    private int idProducto;
    private LocalDateTime fecha;
    private int cantidadAnterior;
    private int nuevaCantidad;
    private String usuario;

    public AuditoriaProducto() {
    }

    public AuditoriaProducto(int idAuditoria, int idProducto, LocalDateTime fecha, int cantidadAnterior, int nuevaCantidad, String usuario) {
        this.idAuditoria = idAuditoria;
        this.idProducto = idProducto;
        this.fecha = fecha;
        this.cantidadAnterior = cantidadAnterior;
        this.nuevaCantidad = nuevaCantidad;
        this.usuario = usuario;
    }

    public int getIdAuditoria() {
        return idAuditoria;
    }

    public void setIdAuditoria(int idAuditoria) {
        this.idAuditoria = idAuditoria;
    }

    public int getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(int idProducto) {
        this.idProducto = idProducto;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public int getCantidadAnterior() {
        return cantidadAnterior;
    }

    public void setCantidadAnterior(int cantidadAnterior) {
        this.cantidadAnterior = cantidadAnterior;
    }

    public int getNuevaCantidad() {
        return nuevaCantidad;
    }

    public void setNuevaCantidad(int nuevaCantidad) {
        this.nuevaCantidad = nuevaCantidad;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }
}
