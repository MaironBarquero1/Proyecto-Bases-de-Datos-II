package Models;

import java.time.LocalDateTime;

public class Recepcion {
    private int idRecepcion;
    private int idProducto;
    private int idCliente;
    private String numeroLote;
    private int cantidad;
    private LocalDateTime fecha;
    private String usuario;

    public Recepcion() {
    }

    public Recepcion(int idRecepcion, int idProducto, int idCliente, String numeroLote, int cantidad, LocalDateTime fecha, String usuario) {
        this.idRecepcion = idRecepcion;
        this.idProducto = idProducto;
        this.idCliente = idCliente;
        this.numeroLote = numeroLote;
        this.cantidad = cantidad;
        this.fecha = fecha;
        this.usuario = usuario;
    }

    public int getIdRecepcion() {
        return idRecepcion;
    }

    public void setIdRecepcion(int idRecepcion) {
        this.idRecepcion = idRecepcion;
    }

    public int getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(int idProducto) {
        this.idProducto = idProducto;
    }

    public int getIdCliente() {
        return idCliente;
    }

    public void setIdCliente(int idCliente) {
        this.idCliente = idCliente;
    }

    public String getNumeroLote() {
        return numeroLote;
    }

    public void setNumeroLote(String numeroLote) {
        this.numeroLote = numeroLote;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }
}
