const {dbIsConnected}=require('../config/db');
const {scoreIncident}=require('../services/priorityService');
const {rank}=require('../services/resourceService');
const {getRoute}=require('../services/routingService');
const {getDistrict,DISTRICTS}=require('../config/districts');
const {fetchWeather}=require('../services/weatherService');
const memory=require('../services/memoryStore');
const publicCache=require('../services/publicDataCache');
const presenceService=require('../services/presenceService');
const models={District:require('../models/District'),Incident:require('../models/Incident'),Resource:require('../models/Resource'),Shelter:require('../models/Shelter'),Alert:require('../models/Alert'),RoadBlock:require('../models/RoadBlock'),Evacuation:require('../models/Evacuation'),Notification:require('../models/Notification'),CitizenReport:require('../models/CitizenReport'),Simulation:require('../models/Simulation'),RiverGauge:require('../models/RiverGauge'),Infrastructure:require('../models/Infrastructure'),FloodZone:require('../models/FloodZone'),EmergencyContact:require('../models/EmergencyContact'),MeshNode:require('../models/MeshNode')};
const map={districts:'District',incidents:'Incident',resources:'Resource',shelters:'Shelter',alerts:'Alert',roads:'RoadBlock',evacuations:'Evacuation',notifications:'Notification',reports:'CitizenReport',simulations:'Simulation',gauges:'RiverGauge',infrastructure:'Infrastructure',floodzones:'FloodZone',emergencycontacts:'EmergencyContact',meshnodes:'MeshNode'};
function cleanClientData(value){ if(Array.isArray(value)) return value.map(cleanClientData); if(value&&typeof value==='object'){ const out={}; for(const [k,v] of Object.entries(value)){ if(['dataPosture','fallback','cachedDemo','sourceType'].includes(k) && (k==='dataPosture'||k==='fallback'||k==='cachedDemo')) continue; if(typeof v==='string' && /fallback|demo data|cached demo|memory fallback/i.test(v)) continue; out[k]=cleanClientData(v); } return out; } return value; }
const keyFromReq=req=>{const parts=req.path.split('/').filter(Boolean);return parts[0]||''};
const filter=(req)=>({state:req.query.state||req.user?.state||'Assam',district:req.query.district||req.user?.district||'Dibrugarh'});
function publicData(d){return {district:d.district,incidents:d.incidents.filter(x=>['VERIFIED','ASSIGNED','IN_PROGRESS'].includes(x.status)).map(x=>({...x,description:undefined})),resources:[],shelters:d.shelters,alerts:d.alerts,roads:d.roads.filter(x=>x.status==='OPEN'),gauges:d.gauges,infrastructure:d.infrastructure,floodzones:d.floodzones,evacuations:d.evacuations.filter(x=>x.public===true),weather:d.weather,emergencyContacts:[]}}
async function operationalMemory(state,district){
 if(!dbIsConnected()) return true;
 try{const [i,r,s]=await Promise.all([models.Incident.countDocuments({state,district}),models.Resource.countDocuments({state,district}),models.Shelter.countDocuments({state,district})]);return i<10||r<5||s<3}catch{return true}
}
async function list(req,res){
 const key=keyFromReq(req),M=models[map[key]];if(!M)return res.status(404).json({message:'Unknown collection'});
 const {state,district}=filter(req);
 const useMemory=!dbIsConnected()||await operationalMemory(state,district);
 if(useMemory){const d=memory.get(state,district);let data=key==='districts'?DISTRICTS.filter(x=>!req.query.state||x.state===req.query.state):key==='emergencycontacts'?[{category:'National Emergency',name:'Emergency Response Support',phone:'112',state:'India',district:'ALL'},{category:'Ambulance',name:'Emergency Medical',phone:'108',state:'India',district:'ALL'},{category:'Police',name:'Police Emergency',phone:'100',state:'India',district:'ALL'},{category:'Fire',name:'Fire & Rescue',phone:'101',state:'India',district:'ALL'}]:d[key]||[];if(key==='reports'&&req.user?.role==='CITIZEN')data=d.reports.filter(x=>String(x.reporter)===String(req.user._id||req.user.id));if(req.user?.role==='CITIZEN'&&key==='emergencycontacts')data=[{category:'National Emergency',name:'Emergency Response Support',phone:'112',state:'India',district:'ALL'},{category:'Ambulance',name:'Emergency Medical',phone:'108',state:'India',district:'ALL'},{category:'Police',name:'Police Emergency',phone:'100',state:'India',district:'ALL'}];return res.json({success:true,data});}
 const f={};if(req.query.state)f.state=state;if(req.query.district&&key!=='districts')f.district=district;if(key==='reports'&&req.user?.role==='CITIZEN')f.reporter=req.user._id;let q=M.find(f).sort({createdAt:-1}).limit(500);if(['evacuations','reports'].includes(key))q=q.populate('targetShelter assignedTeams incident');res.json({success:true,data:await q.lean()})
}
async function create(req,res){const key=keyFromReq(req),M=models[map[key]];if(!M)return res.status(404).json({message:'Unknown collection'});const data={...req.body};if(key==='incidents')Object.assign(data,scoreIncident(data),{code:data.code||`FG-${Date.now().toString().slice(-8)}`,reportedBy:req.user?._id,state:data.state||req.user?.state,district:data.district||req.user?.district,sourceType:data.sourceType||'OPERATOR',sourceName:data.sourceName||'FloodGuard Operator',timeline:[{status:'UNVERIFIED',note:'Incident created',by:req.user?.name||'Operator'}]});if(await operationalMemory(data.state||req.user.state,data.district||req.user.district)){const d=memory.get(data.state||req.user.state,data.district||req.user.district);const x={...data,_id:Math.random().toString(36).slice(2,10),createdAt:new Date()};if(key==='reports')d.reports.unshift(x);else d[key]?.unshift(x);req.io?.emit(`${key}:updated`,x);return res.status(201).json({success:true,data:x})}const x=await M.create(data);req.io?.emit(`${key}:updated`,x);req.io?.emit('notification:new',{type:key,title:key.toUpperCase()+' UPDATED',district:data.district});res.status(201).json({success:true,data:x})}
async function update(req,res){const key=keyFromReq(req),M=models[map[key]];if(!M)return res.status(404).json({message:'Unknown collection'});if(await operationalMemory(filter(req).state,filter(req).district)){const f=filter(req),d=memory.get(f.state,f.district),arr=d[key]||[],x=arr.find(v=>v._id===req.params.id);if(!x)return res.status(404).json({message:'Not found'});Object.assign(x,req.body);if(key==='shelters'&&x.occupancy!==undefined){x.status=x.occupancy>=x.capacity?'FULL':x.occupancy>=x.capacity*.8?'NEAR_CAPACITY':'OPEN';x.lastUpdated=new Date();}if(key==='incidents'&&req.body.status)x.timeline=[...(x.timeline||[]),{status:req.body.status,note:req.body.note||`Status changed to ${req.body.status}`,by:req.user?.name||'Operator',at:new Date()}];req.io?.emit(`${key}:updated`,x);if(key==='roads')req.io?.emit(x.status==='BLOCKED'?'road:blocked':'road:cleared',x);return res.json({success:true,data:x})}const before=await M.findById(req.params.id);if(!before)return res.status(404).json({message:'Not found'});const patch={...req.body};if(key==='incidents'&&patch.status)patch.$push={timeline:{status:patch.status,note:patch.note||`Status changed to ${patch.status}`,by:req.user?.name||'Operator'}};if(key==='shelters'&&patch.occupancy!==undefined){patch.status=patch.occupancy>=before.capacity?'FULL':patch.occupancy>=before.capacity*.8?'NEAR_CAPACITY':'OPEN';patch.lastUpdated=new Date();}const x=await M.findByIdAndUpdate(req.params.id,patch,{new:true});req.io?.emit(`${key}:updated`,x);if(key==='roads')req.io?.emit(patch.status==='BLOCKED'?'road:blocked':'road:cleared',x);res.json({success:true,data:x})}
async function dashboard(req,res){
 const {state,district}=filter(req);
 const d=memory.get(state,district);
 const applyPublic=async base=>{const live=await publicCache.refresh(state,district).catch(()=>publicCache.getCached(state,district)||{});const mergedAlerts=[...(live.alerts||[]),...(base.alerts||[])].filter((a,i,self)=>self.findIndex(x=>String(x.externalId||x._id)===String(a.externalId||a._id))===i).sort((a,b)=>new Date(b.issuedAt||0)-new Date(a.issuedAt||0));return {...base,alerts:mergedAlerts,weather:live.weather||base.weather,emergencyContacts:(live.emergencyContacts?.length ? live.emergencyContacts : (base.emergencyContacts || [])),dataPosture:{liveWeather:!!live.weather,officialAlerts:(live.alerts||[]).filter(a=>a.sourceType==='OFFICIAL').length,liveEmergencyContacts:!!live.emergencyContacts?.length,cachedDemo:true}}};
 const memoryDashboard=async()=>applyPublic({...publicData(d),resources:req.user?.role==='CITIZEN'?d.resources.filter(x=>['EN_ROUTE','BUSY'].includes(x.status)):d.resources,incidents:req.user?.role==='FIELD_RESPONDER'?d.incidents.filter(x=>['ASSIGNED','IN_PROGRESS'].includes(x.status)):req.user?.role==='CITIZEN'?publicData(d).incidents:d.incidents,evacuations:req.user?.role==='FIELD_RESPONDER'?d.evacuations.filter(x=>x.status==='ACTIVE'):d.evacuations,emergencyContacts:[{category:'National Emergency',name:'Emergency Response Support',phone:'112',state,district,sourceType:'OFFICIAL',sourceName:'112 India',sourceUrl:'https://112.gov.in/'}]});
 if(!dbIsConnected()) return res.json({success:true,data:cleanClientData(await memoryDashboard())});
 try{
  const [cfg,incidents,resources,shelters,alerts,roads,gauges,infrastructure,evacuations,floodzones,weather,emergencyContacts]=await Promise.all([
   models.District.findOne({state,name:district}).lean(),
   models.Incident.find(req.user?.role==='FIELD_RESPONDER'?{state,district,status:{$in:['ASSIGNED','IN_PROGRESS']}}:req.user?.role==='CITIZEN'?{state,district,status:{$in:['VERIFIED','ASSIGNED','IN_PROGRESS']}}:{state,district}).sort({priorityScore:-1}).limit(500).lean(),
   models.Resource.find(req.user?.role==='FIELD_RESPONDER'?{state,district,assignedIncident:{$ne:null}}:{state,district}).limit(200).lean(),
   models.Shelter.find({state,district}).limit(100).lean(),
   models.Alert.find({state,$or:[{district},{district:'ALL'},{district:'National'}]}).sort({issuedAt:-1}).limit(30).lean(),
   models.RoadBlock.find({state,district}).limit(200).lean(),
   models.RiverGauge.find({state,district}).sort({waterLevel:-1}).lean(),
   models.Infrastructure.find({state,district}).limit(200).lean(),
   models.Evacuation.find(req.user?.role==='FIELD_RESPONDER'?{state,district,status:'ACTIVE'}:{state,district}).sort({createdAt:-1}).limit(30).populate('targetShelter assignedTeams').lean(),
   models.FloodZone.find({state,district}).limit(50).lean(),
   models.WeatherSnapshot.findOne({state,district}).sort({fetchedAt:-1}).lean(),
   models.EmergencyContact.find({$or:[{state,district},{state:'India',district:'ALL'},{state:'Assam',district:'ALL'}]}).lean()
  ]);
  const coreEmpty=incidents.length===0||resources.length===0||shelters.length===0||roads.length===0||gauges.length===0;
  if(coreEmpty){console.warn(`[DATA] MongoDB connected but ${state}/${district} is incomplete; serving backend demo dataset and attempting live public refresh`);return res.json({success:true,data:cleanClientData(await memoryDashboard())});}
  let w=weather; if(!w) w=(await publicCache.refresh(state,district).catch(()=>null))?.weather;
  const evacTeamIds=new Set((evacuations||[]).flatMap(e=>(e.assignedTeams||[]).map(t=>String(t?._id||t)))); const visibleResources=req.user?.role==='CITIZEN'?resources.filter(x=>['EN_ROUTE','BUSY'].includes(x.status)||evacTeamIds.has(String(x._id))):req.user?.role==='FIELD_RESPONDER'?resources.filter(x=>x.assignedIncident||x.assignedEvacuation):resources; const base={district:cfg||getDistrict(state,district),incidents,resources:visibleResources,shelters,alerts,roads,gauges,infrastructure,evacuations,floodzones,weather:w,emergencyContacts,dataPosture:{liveWeather:!!w,officialAlerts:alerts.filter(a=>a.sourceType==='OFFICIAL').length,cachedDemo:incidents.some(x=>x.sourceType==='DEMO')}};
  return res.json({success:true,data:cleanClientData(base)});
 }catch(error){console.warn('[DATA] Mongo dashboard failed; serving backend demo fallback:',error.message);return res.json({success:true,data:await memoryDashboard(),fallback:true,error:error.message});}
}

async function dispatch(req,res){const f=filter(req),id=req.params.id;if(await operationalMemory(f.state,f.district)){const d=memory.get(f.state,f.district),i=d.incidents.find(x=>x._id===id);if(!i)return res.status(404).json({message:'Incident not found'});const available=d.resources.filter(x=>x.status==='AVAILABLE');const r=available.sort((a,b)=>Math.hypot(a.latitude-i.latitude,a.longitude-i.longitude)-Math.hypot(b.latitude-i.latitude,b.longitude-i.longitude))[0];if(!r)return res.status(409).json({message:'No available resource'});const route=await getRoute(r.latitude,r.longitude,i.latitude,i.longitude);r.status='EN_ROUTE';r.assignedIncident=i._id;i.status='ASSIGNED';i.verificationStatus='VERIFIED';i.assignedResource=r._id;i.timeline=[...(i.timeline||[]),{status:'ASSIGNED',note:`${r.name} dispatched • ${route.distanceKm} km / ${route.etaMinutes} min`,by:req.user?.name||'Operator',at:new Date()}];req.io?.emit('resource:dispatched',r);req.io?.emit('incident:assigned',i);req.io?.emit('notification:new',{type:'DISPATCH',title:'RESOURCE DISPATCHED',message:`${r.name} → ${i.code}`,district:f.district});return res.json({success:true,resource:r,incident:i,recommendations:available.slice(0,3),route})}
 const i=await models.Incident.findById(req.params.id);if(!i)return res.status(404).json({message:'Incident not found'});const rs=await models.Resource.find({district:i.district,state:i.state,status:'AVAILABLE'});const ranked=rank(i,rs);if(!ranked.length)return res.status(409).json({message:'No available resource'});const selected=ranked[0].resource,route=await getRoute(selected.latitude,selected.longitude,i.latitude,i.longitude);selected.status='EN_ROUTE';selected.assignedIncident=i.id;i.status='ASSIGNED';i.verificationStatus='VERIFIED';i.assignedResource=selected.id;i.timeline.push({status:'ASSIGNED',note:`${selected.name} dispatched • ${route.distanceKm} km / ${route.etaMinutes} min`,by:req.user?.name||'Operator'});await selected.save();await i.save();req.io?.emit('resource:dispatched',selected);req.io?.emit('incident:assigned',i);req.io?.emit('notification:new',{type:'DISPATCH',title:'RESOURCE DISPATCHED',message:`${selected.name} → ${i.code}`,district:i.district});res.json({success:true,resource:selected,incident:i,recommendations:ranked.slice(0,3),route})}
async function createCitizenReport(req,res){
 const b=req.body||{};
 const state=req.user.state||'Assam';
 const district=b.district||req.user.district||'Dibrugarh';
 const districtFallback=getDistrict(state,district).center;
 const hasLocation=Number.isFinite(Number(b.latitude))&&Number.isFinite(Number(b.longitude));
 const immediate=Boolean(b.immediate);
 if(immediate&&!hasLocation)return res.status(400).json({success:false,message:'Live location is required for an immediate SOS'});
 if(b.type==='EVACUATION_REQUEST'&&!hasLocation)return res.status(400).json({success:false,message:'Live location is required for an evacuation request'});
 const x={type:immediate?'TRAPPED':(b.type||'OTHER'),description:b.description||b.rawText||(immediate?'I am in danger and need immediate help.':'Citizen emergency report'),rawText:b.rawText||b.description,latitude:hasLocation?Number(b.latitude):districtFallback.lat,longitude:hasLocation?Number(b.longitude):districtFallback.lng,peopleAffected:Number(b.peopleAffected)||1,elderly:!!b.elderly,children:!!b.children,disabled:!!b.disabled,medicalNeed:!!b.medicalNeed,trapped:immediate||b.type==='PERSON_TRAPPED',floodSeverity:immediate?5:Number(b.floodSeverity)||3,state,district,zone:b.zone||'Unassigned',source:'Citizen Report',sourceType:'COMMUNITY',sourceName:'Citizen Report',verificationStatus:'UNVERIFIED',status:'UNVERIFIED',immediate};
 Object.assign(x,scoreIncident(x),{code:`FG-${Date.now().toString().slice(-8)}`,reportedBy:req.user._id});
 if(immediate){x.severity='CRITICAL';x.priorityScore=100;x.priorityReasons=[{label:'Immediate SOS',points:100}];}
 const nearbyCount=req.io?presenceService.notifyNearby(req.io,x.latitude,x.longitude,5,'sos:nearby',{code:x.code,type:x.type,severity:x.severity,peopleAffected:x.peopleAffected,district:x.district,state:x.state,latitude:x.latitude,longitude:x.longitude,immediate,message:immediate?'A person nearby sent an emergency SOS':'Someone nearby reported an emergency'},req.user.id||req.user._id):0;
 if(await operationalMemory(state,district)){
  const incident={...x,_id:Math.random().toString(36).slice(2,10),createdAt:new Date()};
  const report={_id:Math.random().toString(36).slice(2,10),reporter:req.user.id||req.user._id,reporterName:req.user.name,incident,incidentType:x.type,peopleAffected:x.peopleAffected,status:'SUBMITTED',sourceType:'COMMUNITY',state,district,rawText:x.rawText,createdAt:new Date()};
  memory.addReport(state,district,report,incident);
  req.io?.emit('incident:new',incident);
  req.io?.emit('notification:new',{type:'NEW_CRITICAL_INCIDENT',title:incident.severity==='CRITICAL'?'NEW CRITICAL INCIDENT':'NEW CITIZEN REPORT',message:`${incident.code} • ${incident.type}`,severity:incident.severity,district});
  return res.status(201).json({success:true,data:{report,incident,nearbyCount}});
 }
 const incident=await models.Incident.create(x);
 const report=await models.CitizenReport.create({...b,incident:incident._id,reporter:req.user._id,reporterName:req.user.name,reporterPhone:req.user.phone,rawText:x.rawText,incidentType:incident.type,peopleAffected:incident.peopleAffected,district,state,sourceType:'COMMUNITY',status:'SUBMITTED'});
 req.io?.emit('incident:new',incident);
 req.io?.emit('notification:new',{type:'NEW_CRITICAL_INCIDENT',title:incident.severity==='CRITICAL'?'NEW CRITICAL INCIDENT':'NEW CITIZEN REPORT',message:`${incident.code} • ${incident.type}`,severity:incident.severity,district});
 res.status(201).json({success:true,data:{report,incident,nearbyCount}});
}
async function evacuate(req,res){const b=req.body||{},state=b.state||req.user.state,district=b.district||req.user.district,shelterId=b.shelterId,people=Math.max(1,Number(b.population||0));if(await operationalMemory(state,district)){const d=memory.get(state,district),s=d.shelters.find(x=>x._id===shelterId);if(!s)return res.status(404).json({message:'Shelter not found'});if(people>s.capacity-s.occupancy)return res.status(409).json({message:'Shelter does not have enough available capacity'});const ev={_id:Math.random().toString(36).slice(2,10),zone:b.zone||'Affected zone',population:people,targetShelter:s._id,targetShelterName:s.name,assignedTeams:[],state,district,status:'ACTIVE',priority:b.priority||'HIGH',evacuated:0,public:true,createdAt:new Date()};d.evacuations.unshift(ev);req.io?.emit('evacuation:updated',ev);return res.status(201).json({success:true,data:ev,shelter:s})}const shelter=await models.Shelter.findOne({_id:shelterId,state,district});if(!shelter)return res.status(404).json({message:'Shelter not found'});if(people>shelter.capacity-shelter.occupancy)return res.status(409).json({message:'Shelter does not have enough available capacity'});const ev=await models.Evacuation.create({zone:b.zone,population:people,targetShelter:shelterId,assignedTeams:[],state,district,status:'ACTIVE',priority:b.priority||'HIGH',evacuated:0,public:true});req.io?.emit('evacuation:updated',ev);res.status(201).json({success:true,data:ev,shelter})}
async function assignEvacuationTeam(req, res) {
  const f = filter(req);
  const id = req.params.id;
  const resourceId = req.body?.resourceId;
  if (!resourceId) return res.status(400).json({ message: 'resourceId required' });

  if (await operationalMemory(f.state, f.district)) {
    const d = memory.get(f.state, f.district);
    const ev = d.evacuations.find(x => x._id === id);
    const team = d.resources.find(x => x._id === resourceId);
    if (!ev) return res.status(404).json({ message: 'Evacuation operation not found' });
    if (!team) return res.status(404).json({ message: 'Response team not found' });
    if (team.status !== 'AVAILABLE' && !(ev.assignedTeams || []).includes(team._id)) {
      return res.status(409).json({ message: 'Team is not available' });
    }
    if (!(ev.assignedTeams || []).includes(team._id)) {
      ev.assignedTeams = [...(ev.assignedTeams || []), team._id];
    }
    team.status = 'EN_ROUTE';
    team.assignedEvacuation = ev._id;
    team.lastUpdated = new Date();
    req.io?.emit('evacuation:updated', ev);
    req.io?.emit('resource:dispatched', team);
    req.io?.emit('notification:new', {
      type: 'EVACUATION_TEAM',
      title: 'EVACUATION TEAM ASSIGNED',
      message: `${team.name} assigned to ${ev.zone}`,
      district: f.district
    });
    return res.json({ success: true, data: { evacuation: ev, resource: team } });
  }

  const ev = await models.Evacuation.findOne({ _id: id, state: f.state, district: f.district });
  if (!ev) return res.status(404).json({ message: 'Evacuation operation not found' });
  const team = await models.Resource.findOne({ _id: resourceId, state: f.state, district: f.district });
  if (!team) return res.status(404).json({ message: 'Response team not found' });
  if (team.status !== 'AVAILABLE' && !(ev.assignedTeams || []).some(x => String(x) === String(team._id))) {
    return res.status(409).json({ message: 'Team is not available' });
  }
  if (!(ev.assignedTeams || []).some(x => String(x) === String(team._id))) {
    ev.assignedTeams.push(team._id);
  }
  team.status = 'EN_ROUTE';
  team.assignedEvacuation = ev._id;
  team.lastUpdated = new Date();
  await Promise.all([ev.save(), team.save()]);
  req.io?.emit('evacuation:updated', ev);
  req.io?.emit('resource:dispatched', team);
  req.io?.emit('notification:new', {
    type: 'EVACUATION_TEAM',
    title: 'EVACUATION TEAM ASSIGNED',
    message: `${team.name} assigned to ${ev.zone}`,
    district: f.district
  });
  return res.json({ success: true, data: { evacuation: ev, resource: team } });
}

async function updateEvacuation(req, res) {
  const f = filter(req);
  const id = req.params.id;
  const b = req.body || {};

  if (await operationalMemory(f.state, f.district)) {
    const d = memory.get(f.state, f.district);
    const ev = d.evacuations.find(x => x._id === id);
    if (!ev) return res.status(404).json({ message: 'Evacuation operation not found' });
    const before = Math.max(0, Number(ev.evacuated || 0));
    const requested = b.evacuated === undefined
      ? before
      : Math.max(0, Math.min(Number(ev.population || 0), Number(b.evacuated)));

    if (requested > before) {
      const shelter = d.shelters.find(x => x._id === ev.targetShelter);
      if (!shelter) return res.status(404).json({ message: 'Target shelter not found' });
      const added = requested - before;
      if (added > shelter.capacity - shelter.occupancy) {
        return res.status(409).json({ message: 'Shelter has insufficient remaining capacity' });
      }
      shelter.occupancy += added;
      shelter.status = shelter.occupancy >= shelter.capacity
        ? 'FULL'
        : shelter.occupancy >= shelter.capacity * 0.8
          ? 'NEAR_CAPACITY'
          : 'OPEN';
      req.io?.emit('shelter:updated', shelter);
    }

    ev.evacuated = requested;
    if (b.status) ev.status = b.status;
    if (ev.evacuated >= ev.population) ev.status = 'COMPLETED';
    if (ev.status === 'COMPLETED') {
      for (const teamId of ev.assignedTeams || []) {
        const team = d.resources.find(x => String(x._id) === String(teamId));
        if (team && String(team.assignedEvacuation) === String(ev._id)) {
          team.status = 'AVAILABLE';
          delete team.assignedEvacuation;
          team.lastUpdated = new Date();
          req.io?.emit('resource:dispatched', team);
        }
      }
    }
    req.io?.emit('evacuation:updated', ev);
    return res.json({ success: true, data: ev });
  }

  const ev = await models.Evacuation.findOne({ _id: id, state: f.state, district: f.district });
  if (!ev) return res.status(404).json({ message: 'Evacuation operation not found' });
  const before = Math.max(0, Number(ev.evacuated || 0));
  const requested = b.evacuated === undefined
    ? before
    : Math.max(0, Math.min(Number(ev.population || 0), Number(b.evacuated)));

  if (requested > before) {
    const shelter = await models.Shelter.findById(ev.targetShelter);
    if (!shelter) return res.status(404).json({ message: 'Target shelter not found' });
    const added = requested - before;
    if (added > shelter.capacity - shelter.occupancy) {
      return res.status(409).json({ message: 'Shelter has insufficient remaining capacity' });
    }
    shelter.occupancy += added;
    shelter.status = shelter.occupancy >= shelter.capacity
      ? 'FULL'
      : shelter.occupancy >= shelter.capacity * 0.8
        ? 'NEAR_CAPACITY'
        : 'OPEN';
    await shelter.save();
    req.io?.emit('shelter:updated', shelter);
  }

  ev.evacuated = requested;
  if (b.status) ev.status = b.status;
  if (ev.evacuated >= ev.population) ev.status = 'COMPLETED';
  if (ev.status === 'COMPLETED' && ev.assignedTeams?.length) {
    await models.Resource.updateMany({ _id: { $in: ev.assignedTeams }, assignedEvacuation: ev._id }, { $set: { status: 'AVAILABLE', lastUpdated: new Date() }, $unset: { assignedEvacuation: 1 } });
  }
  await ev.save();
  req.io?.emit('evacuation:updated', ev);
  return res.json({ success: true, data: ev });
}

async function simulation(req,res){const {scenario,state='Assam',district='Dibrugarh'}=req.body;if(await operationalMemory(state,district)){const d=memory.get(state,district),before={activeIncidents:d.incidents.filter(x=>!['RESOLVED','REJECTED'].includes(x.status)).length,critical:d.incidents.filter(x=>x.severity==='CRITICAL').length,availableResources:d.resources.filter(x=>x.status==='AVAILABLE').length,shelterOccupancy:Math.round(d.shelters.reduce((a,x)=>a+x.occupancy,0)/Math.max(1,d.shelters.reduce((a,x)=>a+x.capacity,0))*100),blockedRoads:d.roads.filter(x=>x.status!=='OPEN').length},after={...before};if(scenario==='HEAVY_RAIN'){after.critical+=2;after.activeIncidents+=3;after.availableResources=Math.max(0,after.availableResources-2);after.shelterOccupancy=Math.min(100,after.shelterOccupancy+12)}if(scenario==='ROAD_BLOCK'){after.availableResources=Math.max(0,after.availableResources-1);after.blockedRoads+=1;after.activeIncidents+=2}if(scenario==='SHELTER_CAPACITY')after.shelterOccupancy=Math.min(100,after.shelterOccupancy+18);const x={_id:Math.random().toString(36).slice(2,10),scenario,state,district,beforeState:before,afterState:after,runBy:req.user?.name};d.simulations=[...(d.simulations||[]),x];req.io?.emit('simulation:updated',x);return res.json({success:true,data:x})}const [incidents,resources,shelters,roads]=await Promise.all([models.Incident.find({state,district}),models.Resource.find({state,district}),models.Shelter.find({state,district}),models.RoadBlock.find({state,district})]);const before={activeIncidents:incidents.filter(x=>!['RESOLVED','REJECTED'].includes(x.status)).length,critical:incidents.filter(x=>x.severity==='CRITICAL').length,availableResources:resources.filter(x=>x.status==='AVAILABLE').length,shelterOccupancy:Math.round(shelters.reduce((a,x)=>a+x.occupancy,0)/Math.max(1,shelters.reduce((a,x)=>a+x.capacity,0))*100),blockedRoads:roads.filter(x=>x.status!=='OPEN').length};const after={...before};if(scenario==='HEAVY_RAIN'){after.critical+=2;after.activeIncidents+=3;after.availableResources=Math.max(0,after.availableResources-2);after.shelterOccupancy=Math.min(100,after.shelterOccupancy+12)}if(scenario==='ROAD_BLOCK'){after.availableResources=Math.max(0,after.availableResources-1);after.blockedRoads+=1;after.activeIncidents+=2}if(scenario==='SHELTER_CAPACITY')after.shelterOccupancy=Math.min(100,after.shelterOccupancy+18);const x=await models.Simulation.create({scenario,state,district,beforeState:before,afterState:after,runBy:req.user?.name});req.io?.emit('simulation:updated',x);res.json({success:true,data:x})}

async function demoDashboard(req,res){
 const {state,district}=filter(req); const d=memory.get(state,district);
 const live=await publicCache.refresh(state,district).catch(()=>publicCache.getCached(state,district)||{});
 const alerts=[...(live.alerts||[]),...(d.alerts||[])].filter((a,i,self)=>self.findIndex(x=>String(x.externalId||x._id)===String(a.externalId||a._id))===i);
 const evacTeamIds=new Set((d.evacuations||[]).flatMap(e=>(e.assignedTeams||[]).map(String))); const base={...publicData(d),resources:req.user?.role==='CITIZEN'?d.resources.filter(x=>['EN_ROUTE','BUSY'].includes(x.status)||evacTeamIds.has(String(x._id))):req.user?.role==='FIELD_RESPONDER'?d.resources.filter(x=>x.assignedIncident||x.assignedEvacuation):d.resources,incidents:req.user?.role==='FIELD_RESPONDER'?d.incidents.filter(x=>['ASSIGNED','IN_PROGRESS'].includes(x.status)):req.user?.role==='CITIZEN'?publicData(d).incidents:d.incidents,evacuations:req.user?.role==='FIELD_RESPONDER'?d.evacuations.filter(x=>x.status==='ACTIVE'):d.evacuations,alerts,weather:live.weather||d.weather,emergencyContacts:[{category:'National Emergency',name:'Emergency Response Support',phone:'112',state,district,sourceType:'OFFICIAL',sourceName:'112 India',sourceUrl:'https://112.gov.in/'}],dataPosture:{liveWeather:!!live.weather,officialAlerts:(live.alerts||[]).filter(a=>a.sourceType==='OFFICIAL').length,cachedDemo:true}};
 res.json({success:true,data:cleanClientData(base)});
}

async function getWeather(req,res){const {state,district}=filter(req);const cfg=getDistrict(state,district);res.json({success:true,data:await fetchWeather(cfg.center.lat,cfg.center.lng,district,state)})}
module.exports={list,create,update,dispatch,dashboard,demoDashboard,createCitizenReport,evacuate,assignEvacuationTeam,updateEvacuation,simulation,getWeather};
