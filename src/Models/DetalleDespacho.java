package Models;

public class DetalleDespacho {
    private int idDetalle;
    private int idDespacho;
    private int idProducto;
    private int cantidad;

    public DetalleDespacho() {
    }

    public DetalleDespacho(int idDetalle, int idDespacho, int idProducto, int cantidad) {
        this.idDetalle = idDetalle;
        this.idDespacho = idDespacho;
        this.idProducto = idProducto;
        this.cantidad = cantidad;
    }

    public int getIdDetalle() {
        return idDetalle;
    }

    public void setIdDetalle(int idDetalle) {
        this.idDetalle = idDetalle;
    }

    public int getIdDespacho() {
        return idDespacho;
    }

    public void setIdDespacho(int idDespacho) {
        this.idDespacho = idDespacho;
    }

    public int getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(int idProducto) {
        this.idProducto = idProducto;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }
}
