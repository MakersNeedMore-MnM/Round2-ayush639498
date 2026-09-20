const m=require('mongoose');
const s=new m.Schema({district:String,state:String,station:String,river:String,latitude:Number,longitude:Number,waterLevel:Number,warningLevel:Number,dangerLevel:Number,trend:{type:String,default:'STEADY'},floodStatus:{type:String,default:'NORMAL'},sourceType:{type:String,default:'CACHED'},sourceName:String,sourceUrl:String,lastFetchedAt:Date},{timestamps:true});
s.index({district:1,station:1});
module.exports=m.model('RiverGauge',s);
