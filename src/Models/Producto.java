package Models;

public class Producto {
    private int idProducto;
    private String codigo;
    private String nombre;
    private String detalle;
    private int cantidadActual;
    private int stockCritico;
    private String bodega;
    private String pasillo;
    private String estante;

    public Producto() {
    }

    public Producto(int idProducto, String codigo, String nombre, String detalle, int cantidadActual, int stockCritico, String bodega, String pasillo, String estante) {
        this.idProducto = idProducto;
        this.codigo = codigo;
        this.nombre = nombre;
        this.detalle = detalle;
        this.cantidadActual = cantidadActual;
        this.stockCritico = stockCritico;
        this.bodega = bodega;
        this.pasillo = pasillo;
        this.estante = estante;
    }

    public int getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(int idProducto) {
        this.idProducto = idProducto;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDetalle() {
        return detalle;
    }

    public void setDetalle(String detalle) {
        this.detalle = detalle;
    }

    public int getCantidadActual() {
        return cantidadActual;
    }

    public void setCantidadActual(int cantidadActual) {
        this.cantidadActual = cantidadActual;
    }

    public int getStockCritico() {
        return stockCritico;
    }

    public void setStockCritico(int stockCritico) {
        this.stockCritico = stockCritico;
    }

    public String getBodega() {
        return bodega;
    }

    public void setBodega(String bodega) {
        this.bodega = bodega;
    }

    public String getPasillo() {
        return pasillo;
    }

    public void setPasillo(String pasillo) {
        this.pasillo = pasillo;
    }

    public String getEstante() {
        return estante;
    }

    public void setEstante(String estante) {
        this.estante = estante;
    }
}
