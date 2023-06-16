const {Router}=require('express');
const ruta=Router();
const ModeloProducto=require('../models/modeloproducto');
const multer=require('multer');
const fs=require('fs');
const path = require('path');
const cookieParser=require('cookie-parser');
const verify=(req, res, next)=>
{
    if(req.session.usuario=="admin")
    {
        next();
    }
    else
    {
        res.redirect("/login");
    }
}
var storage = multer.diskStorage({
    destination:(req, file, cb)=>
    {
        cb(null, './public/galeria/producto')
    },
    filename:(req, file, cb)=>
    {
        cb(null, "producto.jpeg");
    }
});
const subir=multer({storage});
function marcador(lista)
{
    var numero;
    if(lista==[] || lista==undefined)
    {
        numero=0;
    }
    else
    {
        numero=Object.keys(JSON.parse(lista)).length;
    }
    return numero;
}
ruta.get('/admin', verify, (req, res)=>
{
    res.render('administracion', {cabeza:"Administración"});
});
ruta.get('/', (req, res)=>
{
    var prod=ModeloProducto.find({estado:"disponible"})
    .then((pro)=>
    {
        res.render('catalogo', {productos:pro, cabeza:"Catalogo", a1:"", a2:"active", usuariomenu:"Mi cuenta", numite:marcador(req.cookies.item)});
    });
});
ruta.get('/registro', verify, (req, res)=>
{
    res.render('registroproducto', {cabeza:"Registro de producto"});
});
ruta.get('/listapro', verify, (req, res)=>
{
    var mostrar=ModeloProducto.find()
    .then((pro)=>
    {
        res.render('productoslista', {productos:pro, cabeza:"Lista de productos"});
    });
});
ruta.get('/modpro/:id', (req, res)=>
{
    var idmod=req.params.id;
    ModeloProducto.findById(idmod)
    .then((prod)=>
    {
        res.render('modificarproducto', {cabeza:"Modificar producto", producto:prod});
    })
});
ruta.post('/modificacionpro', (req, res)=>
{
    var disponible=req.body.stomod;
    var estmod;
    if(disponible=="0")
    {
        estmod="no disponible";
    }
    else
    {
        estmod="disponible"
    }
    var idpro=req.body.idmod;
    ModeloProducto.findByIdAndUpdate(idpro, {$set:
    {
        nom_pro:req.body.nommod,
        des_pro:req.body.desmod,
        pre_pro:req.body.premod,
        sto_pro:req.body.stomod,
        cat_pro:req.body.catmod,
        estado:estmod
    }}, {new:true})
    .then(()=>
    {
        res.redirect('/catalogo/listapro');
    })
    .catch((err)=>
    {
        res.render('error', {cabeza:"Error al modificar", a1:"", a2:"", usuariomenu:"Mi cuenta", mensaje:"No se pudo hacer la modificación al producto. Inténtenlo mas tarde.", numite:marcador(req.cookies.item)})
    })
});
ruta.post('/registrar', subir.single('imgreg'), (req, res)=>
{
    var nuevopro=new ModeloProducto(
        {
            nom_pro:req.body.nomreg,
            des_pro:req.body.desreg,
            cat_pro:req.body.catreg,
            pre_pro:req.body.prereg,
            sto_pro:req.body.storeg,
            ima_pro:"producto"
        }
    );
    nuevopro.save()
    .then((pro)=>
    {
        fs.renameSync(req.file.path, req.file.path.replace('producto.jpeg', pro._id+path.extname(req.file.originalname)));
        ModeloProducto.findByIdAndUpdate(pro._id, {$set:{ima_pro:pro._id+path.extname(req.file.originalname)}},
        {new:true})
        .then(()=>
        {
            console.log("imagen recibida");
        })
        .catch((err)=>
        {
            console.log("Error: "+err)
        });
        res.redirect('/catalogo/admin');
    })
    .catch((err)=>
    {
        console.log(err);
        res.render('error', {cabeza:"Error", a1:"", a2:"", usuariomenu:"Mi cuenta", mensaje:"Hubo un error al registrar el producto", numite:marcador(req.cookies.item)});
    });
});
ruta.get('/producto/:id', (req, res)=>
{
    var idprod=req.params.id;
    ModeloProducto.findById(idprod)
    .then((pro)=>
    {
        res.render('producto', {producto:pro, cabeza:pro.nom_pro, a1:"", a2:"", usuariomenu:"Mi cuenta", numite:marcador(req.cookies.item)});
    })
    .catch((err)=>
    {
        console.log("Error al buscar producto "+err);
    });
});
ruta.get('/carrito', (req, res)=>
{
    if(req.cookies.item==undefined || req.cookies.item==[])
    {
        res.render('error', {cabeza:"Carrito vació", mensaje:"Su carrito está vació, por favor vaya al catálogo y agregue los productos que desee.", a1:"", a2:"", usuariomenu:"Mi cuenta", numite:marcador(req.cookies.item)});
    }
    else
    {
        var carrokey=JSON.parse(req.cookies.item);
        var obj, subtotal, i=0, total=100;
        let carrolisto=[];
        var medida=Object.keys(carrokey).length;
        function getdatos()
        {
            return new Promise((resolve, reject)=>
            {
                carrokey.forEach((itemcar)=>
                {
                    ModeloProducto.findById(itemcar.id)
                    .then((usu)=>
                    {
                        subtotal=itemcar.cant*usu.pre_pro;
                        obj={
                            cant:itemcar.cant,
                            nombre:usu.nom_pro,
                            imagen:usu.ima_pro,
                            stock:usu.sto_pro,
                            id:usu._id,
                            costo:usu.pre_pro,
                            sub:subtotal,
                        };
                        total=total+subtotal;
                        carrolisto.push(obj);
                        i++;
                        if(i==medida)
                        {
                            resolve(carrolisto);
                        }
                    });
                });
            });
        };
        async function llamada()
        {
            const resultado=await getdatos();
            res.render('carrito', {cabeza:"Carrito", totalcom:total, items:resultado, a1:"", a2:"", usuariomenu:"Mi cuenta", numite:marcador(req.cookies.item)});
        };
        llamada();
    }
});
ruta.post('/buscar', (req, res)=>
{
    var busqueda=ModeloProducto.find({nom_pro:new RegExp(req.body.busqueda, 'i')})
    .then((pro)=>
    {
        if(pro=="")
        {
            res.render('error', {cabeza:"0 resultados", a1:"", a2:"", usuariomenu:"Mi cuenta", mensaje:"No hubo resultados para tu búsqueda", numite:marcador(req.cookies.item)});
        }
        else
        {
            res.render('busqueda', {productos:pro, resultados:req.body.busqueda, cabeza:"Búsqueda", a1:"", a2:"", usuariomenu:"Mi cuenta", numite:marcador(req.cookies.item)});
        }
    });
});
ruta.post('/agregarpro', (req, res)=>
{
    if(req.cookies.item==undefined)
    {
        prodcar=[];
    }
    else
    {
        prodcar=JSON.parse(req.cookies.item);
    }
    var id=req.body.idpro;
    if(prodcar=="")
    {
        var newitem={
        id:req.body.idpro,
        cant:req.body.canagr
        };
        prodcar.push(newitem);
        res.cookie("item", JSON.stringify(prodcar));
        res.redirect('/catalogo/producto/'+id);
    }
    else
    {
        var buscaritem=buscar(prodcar, id);
        if(buscaritem==1)
        {
            res.cookie("item", JSON.stringify(prodcar));
            res.redirect('/catalogo/producto/'+id);
        }
        else
        {
            newitem={
            id:req.body.idpro,
            cant:req.body.canagr
            }
            id=req.body.idpro;
            prodcar.push(newitem);
            res.cookie("item", JSON.stringify(prodcar));
            res.redirect('/catalogo/producto/'+id);
        }
    }
    function buscar(donde, busqueda)
    {
        var i=0, bandera=0;
        var e=Object.keys(donde).length;
        while(i<e)
        {
            if(donde[i].id==busqueda)
            {
                bandera=1;
                a=parseInt(donde[i].cant);
                b=parseInt(req.body.canagr);
                c=a+b
                donde[i].cant=c;
                i++
            }
            else
            {
                i++;
            }
        }
        return bandera;
    }
});
ruta.get('/eliminaritem/:id', (req, res)=>
{
    var itemid=req.params.id;
    var car=JSON.parse(req.cookies.item);
    var long=Object.keys(car).length;
    var indice=buscar(car, itemid);
    if(long==1)
    {
        res.clearCookie("item");
        res.redirect('/catalogo/carrito');
    }
    else
    {
        car.splice(indice, 1);
        res.cookie("item", JSON.stringify(car));
        res.redirect('/catalogo/carrito');
    }
    function buscar(donde, busqueda)
    {
        var i=0, posicion;
        var e=Object.keys(donde).length;
        while(i<e)
        {
            if(donde[i].id==busqueda)
            {
                posicion=i;
                i++
            }
            else
            {
                i++;
            }
        }
        return posicion;
    }
});
module.exports=ruta;