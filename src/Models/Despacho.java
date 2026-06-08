package Models;

import java.time.LocalDateTime;

public class Despacho {
    private int idDespacho;
    private int idCliente;
    private LocalDateTime fecha;
    private String estado;
    private String operario;

    public Despacho() {
    }

    public Despacho(int idDespacho, int idCliente, LocalDateTime fecha, String estado, String operario) {
        this.idDespacho = idDespacho;
        this.idCliente = idCliente;
        this.fecha = fecha;
        this.estado = estado;
        this.operario = operario;
    }

    public int getIdDespacho() {
        return idDespacho;
    }

    public void setIdDespacho(int idDespacho) {
        this.idDespacho = idDespacho;
    }

    public int getIdCliente() {
        return idCliente;
    }

    public void setIdCliente(int idCliente) {
        this.idCliente = idCliente;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getOperario() {
        return operario;
    }

    public void setOperario(String operario) {
        this.operario = operario;
    }
}
