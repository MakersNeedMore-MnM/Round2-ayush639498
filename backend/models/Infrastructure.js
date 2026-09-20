const m=require('mongoose');
const s=new m.Schema({name:String,type:{type:String,enum:['HOSPITAL','POLICE','FIRE_STATION','SCHOOL','BRIDGE','IMPORTANT_INFRASTRUCTURE','WATERBODY']},latitude:Number,longitude:Number,address:String,phone:String,status:{type:String,default:'OPERATIONAL'},district:String,state:String,sourceType:{type:String,default:'DEMO'},sourceName:String,sourceUrl:String},{timestamps:true});
s.index({district:1,type:1});
module.exports=m.model('Infrastructure',s);
