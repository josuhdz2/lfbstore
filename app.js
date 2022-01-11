const express=require('express');
const path=require('path');
const app=express();
app.use(express.urlencoded({extended:true}));
app.use('/', express.static(path.join(__dirname, "/public/html")));
app.use(express.static("public"));
app.listen(3000, ()=>{
    console.log('Servidor en linea');
});