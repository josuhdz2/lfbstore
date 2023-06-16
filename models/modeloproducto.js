const mongoose=require('mongoose');
const productoSchema=new mongoose.Schema(
    {
        nom_pro:{type:String, required:true},
        des_pro:{type:String, required:true},
        pre_pro:{type:Number, required:true},
        sto_pro:{type:Number, required:true},
        ima_pro:{type:String, required:true},
        cat_pro:{type:String, required:true},
        estado:{type:String, default:"disponible"}
    }
);
module.exports=mongoose.model('producto', productoSchema);
