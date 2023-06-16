/*
Authors:
TI01SM-20    
Josue Hernández Chávez
Alexandra Monserrath Gudiño Lucas
Luis Manues Jimenes Hernandez
*/
require('dotenv').config();//pide a dotenv para manejar variables de entorno
const express=require('express');//servidor
const mongoose=require('mongoose');//base de datos
const session=require('express-session');//sesiones
const path=require('path');//rutas locales
const rutas=require('./routes/rutas');//rutas de servidor
const productos=require('./routes/productos');//rutas de servidor
const ventas=require('./routes/ventas');//rutas del servidor
const cookieParser=require('cookie-parser');//manipulador de cookies
const database=process.env.database;
mongoose.connect(database, {useNewUrlParser:true, useUnifiedTopology:true, useFindAndModify:false})
.then(()=>
{
    console.log("Conectado a la base de datos");
})
.catch((err)=>
{
    console.log("Error al conectarse a MongoDB"+err);
});
const app=express();
app.set('view engine', 'ejs');
app.use(session(
    {
        secret:"abcdefghijklmnopqrstuvwxyz",
        resave:true,
        saveUninitialized:true
    }
));
app.use(cookieParser());
app.use(express.static("public"));// se desconoce porque ignora la carpeta public
app.use(express.urlencoded({extended:true}));
app.use('/', rutas);
app.use('/catalogo', productos);
app.use('/ventas', ventas);
const port=process.env.PORT || 3000;
app.listen(port ,()=>
{
    console.log("Servidor en linea");
});
