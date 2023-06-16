const mongoose=require('mongoose');
const loginSchema=new mongoose.Schema(
    {
        nom_usu:{type:String, required:true},
        eda_usu:{type:String, required:true},
        ema_usu:{type:String, required:true},
        pas_usu:{type:String, required:true},
        ent_usu:{type:String, required:true},
        mun_usu:{type:String, required:true},
        col_usu:{type:String, required:true},
        cal_usu:{type:String, required:true},
        num_usu:{type:String, required:true},
        tel_usu:{type:String, required:true},
        estado:{type:Boolean, default:true}
    }
);
module.exports=mongoose.model('registrousuario', loginSchema);
