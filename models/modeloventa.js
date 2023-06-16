const mongoose=require('mongoose');
const ventaSchema=new mongoose.Schema(
    {
        id_usu:{type:String, required:true},
        inf_ven:{type:Array, required:true},
        tot_ven:{type:Number, required:true},
        cod_env:{type:String, default:"S/C"},
        estado:{type:String, default:"En trámite"}
    }
);
module.exports=mongoose.model('venta', ventaSchema);