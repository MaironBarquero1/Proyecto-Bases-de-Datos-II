package Models;

public class Cliente {
    private int idCliente;
    private String nombre;
    private String rol;

    public Cliente() {
    }

    public Cliente(int idCliente, String nombre, String rol) {
        this.idCliente = idCliente;
        this.nombre = nombre;
        this.rol = rol;
    }

    public int getIdCliente() {
        return idCliente;
    }

    public void setIdCliente(int idCliente) {
        this.idCliente = idCliente;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }
}
