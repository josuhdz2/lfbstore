const {Router}=require('express');
const ruta=Router();
const ModeloVentas=require('../models/modeloventa');
const ModeloUsuario=require('../models/modelousuario');
const CryptoJS=require('crypto-js');
require('dotenv').config();
const verify=(req, res, next)=>
{
    if(req.session.usuario || req.user)
    {
        netx();
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
const adminaccess=process.env.adminpass;
ruta.get('/login', (req, res)=>
{
    req.session.destroy();
    res.render('login', {cabeza:"Login"})
});
ruta.get('/', (req, res)=>
{
    res.render('inicio', {cabeza:"Inicio", a1:"active", a2:"", a3:"", usuariomenu:"Mi cuenta", numite:marcador(req.cookies.item)});
});
ruta.get('/registrousuario', (req, res)=>
{
    res.render('registrousuario', {cabeza:"Regístrate"});
});
ruta.post('/registrar', (req, res)=>
{
    ModeloUsuario.find({ema_usu:req.body.emareg})
    .then((reg)=>
    {
        if(reg=="")
        {
            var nuevousu=new ModeloUsuario(
                {
                    nom_usu:req.body.nomreg,
                    eda_usu:req.body.edareg,
                    ema_usu:req.body.emareg,
                    pas_usu:CryptoJS.AES.encrypt(req.body.pasreg, 'keywordforencryption').toString(),
                    ent_usu:req.body.entreg,
                    mun_usu:req.body.munreg,
                    col_usu:req.body.colreg,
                    cal_usu:req.body.calreg,
                    num_usu:req.body.numreg,
                    tel_usu:req.body.telreg
                }
            );
            nuevousu.save()
            .then((usu)=>
            {
                res.redirect('/login');
            })
            .catch((err)=>
            {
                console.log(err);
                res.render('error', {cabeza:"Error", a1:"", a2:"", usuariomenu:"Mi cuenta", mensaje:"Lo sentimos, hubo un error al guardar tus datos de usuario.", numite:marcador(req.cookies.item)});
            });
        }
        else
        {
            res.render('error', {cabeza:"Ya registrado", a1:"", a2:"", usuariomenu:"Mi cuenta", mensaje:"El correo ingresado ya esta en una cuenta registrada. Por favor ingresa uno diferente.", numite:marcador(req.cookies.item)});
        }
    })
    .catch(()=>
    {
        res.render('error', {cabeza:"Error", a1:"", a2:"", usuariomenu:"Mi cuenta", mensaje:"Hubo un error inesperado al guardar al usuario. Por favor intenta un momento mas tarde", numite:marcador(req.cookies.item)});
    });
});
ruta.post('/login', (req, res)=>
{
    var email=req.body.emalog;
    var loginvar=ModeloUsuario.find({ema_usu:email})
    .then((usu)=>
    {
        if(usu=="")
        {
            res.render('error', {cabeza:"Datos incorrectos", a1:"", a2:"", usuariomenu:"Mi cuenta", mensaje:"Los datos ingresados no coinciden. Por favor ingresa los datos correctos.", numite:marcador(req.cookies.item)});
        }
        else
        {
            var pass=CryptoJS.AES.decrypt(usu[0].pas_usu, 'keywordforencryption').toString(CryptoJS.enc.Utf8);
            if(email=="admin@gmail.com" && pass==req.body.paslog)
            {
                req.session.usuario="admin";
                console.log("Acceso como Administrador");
                res.redirect('/catalogo/admin');
            }
            else
            {
                if(pass==req.body.paslog)
                {
                    req.session.usuario=usu[0]._id;
                    req.session.correo=usu[0].ema_usu;
                    res.redirect('/');
                }
                else
                {
                    res.render('error', {cabeza:"Datos incorrectos", a1:"", a2:"", usuariomenu:"Mi cuenta", mensaje:"Los datos ingresados no coinciden. Por favor ingresa los datos correctos.", numite:marcador(req.cookies.item)});
                    console.log("Intento de inicio de sesión fallido.");
                }
            }   
        }
    })
    .catch((err)=>
    {
        res.render('error', {cabeza:"Error", a1:"", a2:"", usuariomenu:"Mi cuenta", mensaje:"Se produjo un error al iniciar la sesión. Por favor inténtelo mas tarde.", numite:marcador(req.cookies.item)});
        console.log("Error en login "+err);
    })
});
ruta.get('/micuenta', (req, res)=>
{
    if(!req.session.usuario)
    {
        res.redirect("/login");
    }
    else if(req.session.usuario=="admin")
    {
        res.redirect('/catalogo/admin');
    }
    else
    {
        var idsesion=req.session.usuario;
        ModeloUsuario.findById(idsesion)
        .then((datos)=>
        {
            ModeloVentas.find({id_usu:idsesion})
            .then((ven)=>
            {
                res.render('micuenta', {datosusu:datos, compras:ven, cabeza:"Mi cuenta", a1:"", a2:"", a3:"", usuariomenu:"Mi cuenta", numite:marcador(req.cookies.item)});
            })
        })
        .catch((err)=>
        {
            res.render('error', {cabeza:"Error", a1:"", a2:"", usuariomenu:"Mi cuenta", mensaje:"Lo sentimos. No pudimos encontrar tu información, intentalo mas tarde.", numite:marcador(req.cookies.item)})
            console.log("Error al mostrar datos del usuario");
        });
    }
});
ruta.get('/modificarusu/:id', verify, (req, res)=>
{
    var idurl=req.params.id;
    ModeloUsuario.findById(idurl)
    .then((mod)=>
    {
        var pass=CryptoJS.AES.decrypt(mod.pas_usu, 'keywordforencryption').toString(CryptoJS.enc.Utf8);
        res.render('modificarusuario', {modusu:mod, passwd:pass, cabeza:"Modificar", a1:"", a2:"", a3:"", usuariomenu:"Mi cuenta", numite:marcador(req.cookies.item)})
    })
    .catch((err)=>
    {
        res.render('error', {cabeza:"Error", a1:"", a2:"", usuariomenu:"Mi cuenta", mensaje:"No se encontró la información del usuario, intentalo mas tarde.", numite:marcador(req.cookies.item)});
        console.log("Error al encontrar el registro a modificar "+err);
    });
});
ruta.post('/modificar', (req, res)=>
{
    var idmod=req.body.idmod;
    ModeloUsuario.findByIdAndUpdate(idmod, {$set:
    {
        nom_usu:req.body.nommod,
        eda_usu:req.body.edamod,
        ema_usu:req.body.emamod,
        pas_usu:CryptoJS.AES.encrypt(req.body.pasmod, 'keywordforencryption').toString(),
        ent_usu:req.body.entmod,
        mun_usu:req.body.munmod,
        col_usu:req.body.colmod,
        cal_usu:req.body.calmod,
        num_usu:req.body.nummod,
        tel_usu:req.body.telmod
    }}, {new:true})
    .then(()=>
    {
        req.session.correo=req.body.emamod;
        res.redirect('/micuenta');
    })
    .catch((err)=>
    {
        res.render('error', {cabeza:"Error", a1:"", a2:"", usuariomenu:"Mi cuenta", mensaje:"Lo sentimos. No se pudo modifica la información del usuario, inténtelo mas tarde.", numite:marcador(req.cookies.item)});
    });
});
ruta.get('/logout',(req, res)=>
{
    req.session.destroy();
    res.redirect('/');
});
module.exports=ruta;