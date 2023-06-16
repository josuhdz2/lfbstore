function mensaje()
{
    alert("Producto agregado al carrito.");
};

const actualizacion=document.querySelectorAll('.cantidad');
actualizacion.forEach((itemmod)=>
{
    itemmod.addEventListener('click', actualizar);
});
function actualizar(event)
{
    const agregar=event.target;
    var iditemcar=agregar.id;
    var cantact=agregar.value;
    console.log(iditemcar, cantact);
    const cookie=decodeURIComponent(leerCookie("item"));
    const editable=JSON.parse(cookie);
    modificar(editable, iditemcar, cantact);
    const newcookie=JSON.stringify(editable)
    document.cookie="item=; max-age=0; path=/";
    document.cookie="item="+encodeURIComponent(newcookie)+"; path=/";
    window.location.href="/catalogo/carrito";
}
function leerCookie(nombre) {
    var lista = document.cookie.split(";");
    for (i in lista) {
        var busca = lista[i].search(nombre);
        if (busca > -1) {micookie=lista[i]}
        }
    var igual = micookie.indexOf("=");
    var valor = micookie.substring(igual+1);
    return valor;
    };
function modificar(donde, busqueda, newcantidad)
{
    var i=0, bandera=0;
    var e=Object.keys(donde).length;
    while(i<e)
    {
        if(donde[i].id==busqueda)
        {
            bandera=1;
            donde[i].cant=newcantidad;
            i++
        }
        else
        {
            i++;
        }
    }
    return bandera;
};