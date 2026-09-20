const r=require('express').Router(),{protect}=require('../middleware/auth'),{extractIncident,copilot,translate,advisory,sitrep}=require('../services/aiService'),{dbIsConnected}=require('../config/db'),memory=require('../services/memoryStore');
const Incident=require('../models/Incident'),Resource=require('../models/Resource'),Shelter=require('../models/Shelter'),Alert=require('../models/Alert'),RoadBlock=require('../models/RoadBlock');
r.use(protect);
r.post('/extract',async(req,res)=>res.json({success:true,data:await extractIncident(req.body.text||'')}));
r.post('/copilot',async(req,res)=>{const district=req.body.district||req.user.district,state=req.body.state||req.user.state;let context;if(!dbIsConnected()){const d=memory.get(state,district);context={district,state,incidents:d.incidents,resources:d.resources,shelters:d.shelters,alerts:d.alerts,roads:d.roads}}else{const [incidents,resources,shelters,alerts,roads]=await Promise.all([Incident.find({state,district}).sort({priorityScore:-1}).limit(40).lean(),Resource.find({state,district}).lean(),Shelter.find({state,district}).lean(),Alert.find({state,district}).sort({issuedAt:-1}).limit(15).lean(),RoadBlock.find({state,district}).lean()]);context={district,state,incidents,resources,shelters,alerts,roads}}res.json({success:true,data:await copilot(req.body.question||'',context)})});

r.post('/translate',async(req,res)=>res.json({success:true,data:await translate(String(req.body.text||''),String(req.body.language||'English'))}));
r.post('/advisory',async(req,res)=>res.json({success:true,data:await advisory(req.body.context||{},String(req.body.language||'English'))}));
r.post('/sitrep',async(req,res)=>res.json({success:true,data:await sitrep({state:req.body.state||req.user.state,district:req.body.district||req.user.district,...(req.body.context||{})})}));
module.exports=r;

