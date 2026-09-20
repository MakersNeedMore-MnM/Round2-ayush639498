const bcrypt = require('bcryptjs');
const memory = require('./memoryStore');
const { DISTRICTS } = require('../config/districts');
const M = {
  District: require('../models/District'), Incident: require('../models/Incident'), Resource: require('../models/Resource'), Shelter: require('../models/Shelter'), Alert: require('../models/Alert'), RoadBlock: require('../models/RoadBlock'), RiverGauge: require('../models/RiverGauge'), Infrastructure: require('../models/Infrastructure'), FloodZone: require('../models/FloodZone'), User: require('../models/User'), EmergencyContact: require('../models/EmergencyContact'), WeatherSnapshot: require('../models/WeatherSnapshot'), Evacuation: require('../models/Evacuation')
};

async function ensureDemoDatabase() {
  if (await M.District.countDocuments() === 0) await M.District.insertMany(DISTRICTS);
  if (await M.User.countDocuments() === 0) {
    const password = bcrypt.hashSync('floodguard123', 10);
    await M.User.insertMany([
      ['System Administrator','admin@floodguard.gov','ADMIN'],['District Officer R. Sharma','officer@floodguard.gov','DISTRICT_OFFICER'],['Field Responder A. Khan','responder@floodguard.gov','FIELD_RESPONDER'],['Citizen User','citizen@floodguard.gov','CITIZEN']
    ].map(([name,email,role])=>({name,email,password,role,district:'Dibrugarh',state:'Assam'})));
  }
  if (await M.EmergencyContact.countDocuments() === 0) await M.EmergencyContact.insertMany([
    {category:'National Emergency',name:'Emergency Response Support',phone:'112',district:'ALL',state:'India',isDemo:false},
    {category:'Ambulance',name:'Emergency Medical',phone:'108',district:'ALL',state:'India',isDemo:false},
    {category:'Police',name:'Police Emergency',phone:'100',district:'ALL',state:'India',isDemo:false},
    {category:'Fire',name:'Fire & Rescue',phone:'101',district:'ALL',state:'India',isDemo:false},
    {category:'Assam Flood Control',name:'District Flood Control Room',phone:'1070',district:'ALL',state:'Assam',isDemo:true}
  ]);
  const store = memory.ensure();
  const mappings = [
    ['Incident','incidents'],['Resource','resources'],['Shelter','shelters'],['Alert','alerts'],['RoadBlock','roads'],['RiverGauge','gauges'],['Infrastructure','infrastructure'],['FloodZone','floodzones']
  ];
  for (const d of DISTRICTS) {
    const src = store[`${d.state}::${d.name}`];
    for (const [modelName,key] of mappings) {
      const Model = M[modelName];
      if (await Model.countDocuments({state:d.state,district:d.name}) === 0 && src[key]?.length) {
        const docs = src[key].map(({_id,...x})=>x);
        await Model.insertMany(docs, {ordered:false});
      }
    }
    if (await M.WeatherSnapshot.countDocuments({state:d.state,district:d.name}) === 0) {
      await M.WeatherSnapshot.create({...src.weather,fetchedAt:new Date()});
    }
    if (await M.Evacuation.countDocuments({state:d.state,district:d.name}) === 0 && src.evacuations?.length) {
      const shelterDocs = await M.Shelter.find({state:d.state,district:d.name}).sort({createdAt:1}).limit(3).lean();
      const evacDocs=await M.Evacuation.insertMany(src.evacuations.slice(0,3).map((e,i)=>({zone:e.zone,population:e.population,targetShelter:shelterDocs[i]?._id,assignedTeams:[],status:e.status,evacuated:e.evacuated||0,district:d.name,state:d.state,sourceType:'DEMO',public:true})));
      for (let i=0;i<evacDocs.length;i++){const resource=await M.Resource.findOne({state:d.state,district:d.name}).sort({createdAt:1}).skip(i).lean();if(resource)await M.Resource.updateOne({_id:resource._id},{$set:{status:'EN_ROUTE',assignedEvacuation:evacDocs[i]._id}});if(resource){evacDocs[i].assignedTeams=[resource._id];await evacDocs[i].save();}}
    }
  }
  return {ok:true};
}
module.exports={ensureDemoDatabase};
