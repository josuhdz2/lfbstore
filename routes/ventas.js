const {Router}=require('express');
const ruta=Router();
const ModeloVentas=require('../models/modeloventa');
const ModeloUsuario=require('../models/modelousuario');
const ModeloProducto=require('../models/modeloproducto');
const nodemailer=require('nodemailer');
const emailpassword=process.env.emailpass;
const correodestino=process.env.correocli;
const cuentabanco=process.env.bancomer;
const transporter=nodemailer.createTransport(
    {
        service:'gmail',
        auth:{user:'littlefastbikestore@gmail.com', pass:emailpassword}
    }
);
const verify=(req, res, next)=>
{
    if(req.session.usuario || req.user)
    {
        next();
    }
    else
    {
        res.redirect("/login");
    }
}
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
require('dotenv').config();
ruta.get('/', verify, (req, res)=>
{
    res.redirect("/ventas/realizarventa");
});
ruta.get('/realizarventa', (req, res)=>
{
    const carrototal=JSON.parse(req.cookies.item);
    var obj, subtotal, i=0;
    total=100;
    let infoventa=[];
    var medida=Object.keys(carrototal).length;
    function generar()
    {
        return new Promise((resolve, reject)=>
        {
            carrototal.forEach((itemcar)=>
            {
                ModeloProducto.findById(itemcar.id)
                .then((usu)=>
                {
                    subtotal=itemcar.cant*usu.pre_pro;
                    obj={
                        idprod:usu._id,
                        cantidad:itemcar.cant,
                        sub:subtotal
                    };
                    total=total+subtotal;
                    infoventa.push(obj);
                    i++;
                    if(i==medida)
                    {
                        resolve(infoventa);
                    }
                });
            });
        });
    };
    async function llamada()
    {
        const ventalista=await generar();
        var nuevacompra=new ModeloVentas(
            {
                id_usu:req.session.usuario,
                inf_ven:ventalista,
                tot_ven:total
            }
        );
        nuevacompra.save()
        .then(()=>
        {
            res.redirect('/ventas/actualizar');
        });
    };
    llamada();
});
ruta.get('/actualizar', (req, res)=>
{
    const actual=JSON.parse(req.cookies.item);
    var medida=Object.keys(actual).length;
    var cant;
    var i=0;
    function actualizar()
    {
        return new Promise((resolve, reject)=>
        {
            actual.forEach((obj)=>
            {
                cant=parseInt(obj.cant);
                ModeloProducto.findByIdAndUpdate(obj.id, {$inc:{sto_pro:-cant}})
                .then(()=>
                {
                    i++;
                    if(i==medida)
                    {
                        resolve();
                    }
                });
            });
        });
    };
    async function espera()
    {
        const listo=await actualizar();
        res.redirect('/ventas/correoventa');
    };
    espera();
});
ruta.get('/correoventa', (req, res)=>
{
    var mensajeatienda=
    `
    <h1>Tienes un nuevo envió pendiente.</h1>
    <h3>Por favor entra a la pagina para verificar toda la información</h3>
    `;
    var mensajeacliente=
    `
    <h1>Tu compra ha sido confirmada.<br>A continuación te mostramos la información de pago</h1>
    <h3>Favor de pagar $${total}.00 a la siguiente cuenta Bancomer:${cuentabanco}. Después favor 
    de mandar foto del comprobante junto al código de compra (disponible en la tienda) al Whatsapp 4141002394</h3>
    `;
    console.log(cuentabanco);
    var datosCorreotienda=
    {
        from:"'LFB Store' <littlefastbikestore@gmail.com>",
        to:correodestino,// cuenta de correo receptora
        subject:'Correo de APP Web',
        html:mensajeatienda,
    };
    var datosCorreocliente=
    {
        from:"'LFB Store' <littlefastbikestore@gmail.com>",
        to:req.session.correo,
        subject:'Tu compra ha sido confirmada',
        html:mensajeacliente,
    };
    transporter.sendMail(datosCorreotienda, (err, data)=>
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            console.log("correo enviado a tienda");
        }
    });
    transporter.sendMail(datosCorreocliente, (err, data)=>
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render('compra', {cabeza:"Compra exitosa", a1:"", a2:"", usuariomenu:"Mi cuenta", numite:marcador(req.cookies.item)});
            console.log("correo enviado al cliente");
        }
    });
    res.clearCookie("item");
});
ruta.get('/listaventas', (req, res)=>
{
    if(req.session.usuario=="admin")
    {
        var mostrar=ModeloVentas.find()
        .then((ven)=>
        {
            res.render('listaventas', {ventas:ven, cabeza:"Lista de productos"});
        });
    }
    else
    {
        res.redirect("/login");
        console.log("Intento de acceso sin autorización.");
    }
});
ruta.get('/infocli/:id', (req, res)=>
{
    if(req.session.usuario=="admin")
    {
        var idurl=req.params.id;
        ModeloUsuario.findById(idurl)
        .then((mod)=>
        {
            res.render('infousu', {infousu:mod, cabeza:"Info cliente"});
        })
        .catch((err)=>
        {
            res.render('error', {cabeza:"Error", a1:"", a2:"", usuariomenu:"Mi cuenta", mensaje:"No se encontró la información del usuario, intentalo mas tarde.", numite:marcador(req.cookies.item)});
            console.log("Error al encontrar el registro a modificar "+err);
        });
    }
    else
    {
        res.redirect("/login");
    }
});
ruta.get('/codigoenv/:id', (req, res)=>
{
    var idmodven=req.params.id;
    ModeloVentas.findById(idmodven)
    .then((ven)=>
    {
        if(ven.estado=="En trámite")
        {
            res.redirect('/ventas/agregarcod/'+idmodven);
        }
        if(ven.estado=="Enviado")
        {
            ModeloVentas.findByIdAndUpdate(idmodven, {$set:
            {
                estado:"Entregado"
            }}, {new:true})
            .then((cli)=>
            {
                ModeloUsuario.findById(cli.id_usu)
                .then((usu)=>
                {
                    var correo=
                    `
                    <h1>Tu compra ya ha sido entregada</h1>
                    <h3>Tu compra ya ha sido entregada. Para más información puedes contactarnos a través de Whatsapp 4141002394</h3>
                    `;
                    var coment=
                    {
                        from:"'LFB Store' <littlefastbikestore@gmail.com>",
                        to:usu.ema_usu,// cuenta de correo receptora
                        subject:'Compra entregada',
                        html:correo,
                    };
                    transporter.sendMail(coment, (err, data)=>
                    {
                        if(err)
                        {
                            console.log(err);
                        }
                        else
                        {
                            console.log("correo enviado al cliente");
                        }
                    });
                    res.redirect('/ventas/listaventas');
                });
            });
        }
        if(ven.estado=="Entregado")
        {
            res.redirect('/ventas/listaventas');
        }
    })
});
ruta.get('/agregarcod/:id', (req, res)=>
{
    if(req.session.usuario!="admin")
    {
        res.redirect('/login');
    }
    else
    {
        var id=req.params.id;
        res.render('agregarcodigo', {cabeza:"Agregar codigo", idenv:id});
    }
});
ruta.post('/cambiarestado', (req, res)=>
{
    var idmodven=req.body.idenv;
    ModeloVentas.findByIdAndUpdate(idmodven, {$set:
    {
        estado:"Enviado",
        cod_env:req.body.codenv
    }}, {new:true})
    .then((cli)=>
    {
        ModeloUsuario.findById(cli.id_usu)
        .then((usu)=>
        {
            var correo=
            `
            <h1>Tu compra ha sido enviada</h1>
            <h3>Tu compra ya ha sido enviada. El código de rastreo es el siguiente: ${req.body.codenv}<br>
            Para más información puedes contactarnos mediante Whatsapp 4141002394</h3>
            `;
            var notcompra=
            {
                from:"'LFB Store' <littlefastbikestore@gmail.com>",
                to:usu.ema_usu,// cuenta de correo receptora
                subject:'Compra enviada',
                html:correo,
            };
            transporter.sendMail(notcompra, (err, data)=>
            {
                if(err)
                {
                    console.log(err);
                }
                else
                {
                    console.log("correo enviado al cliente");
                }
            });
            res.redirect('/ventas/listaventas');
        });
    });
});
module.exports=ruta;