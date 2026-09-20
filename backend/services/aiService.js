const axios=require('axios');
async function groq(messages){if(!process.env.GROQ_API_KEY)throw Error('GROQ_NOT_CONFIGURED');const {data}=await axios.post('https://api.groq.com/openai/v1/chat/completions',{model:process.env.GROQ_MODEL||'openai/gpt-oss-120b',messages,temperature:.1,response_format:{type:'json_object'}},{headers:{Authorization:`Bearer ${process.env.GROQ_API_KEY}`},timeout:15000});return JSON.parse(data.choices[0].message.content)}
async function extractIncident(text){try{return await groq([{role:'system',content:'Extract flood incident facts. Return JSON only with incidentType,peopleAffected,elderly,children,disabled,medicalNeed,trapped,severity,recommendedResource. Never invent facts.'},{role:'user',content:text}])}catch(e){let t=text.toLowerCase();return{incidentType:t.includes('ambulance')||t.includes('medical')?'MEDICAL_EMERGENCY':t.includes('trapped')||t.includes('phasa')?'PERSON_TRAPPED':'FLOODED_HOUSE',peopleAffected:Number((text.match(/\d+/)||['1'])[0]),elderly:/elderly|dadi|nani|disabled|दादी|बुजुर्ग/i.test(text),children:/child|children|kid|बच्च/i.test(text),disabled:/disabled|wheelchair|विकलांग/i.test(text),medicalNeed:/medical|hospital|medicine|ambulance|दवा/i.test(text),trapped:/trapped|phasa|urgent|critical|फंसा/i.test(text),severity:/trapped|phasa|urgent|critical|फंसा/i.test(text)?'CRITICAL':'MODERATE',recommendedResource:'RESCUE_TEAM'}}}
function deterministic(question,c){const q=question.toLowerCase(),critical=c.incidents.filter(x=>x.severity==='CRITICAL'),active=c.incidents.filter(x=>!['RESOLVED','REJECTED'].includes(x.status)),available=c.resources.filter(x=>x.status==='AVAILABLE'),shelter=c.shelters.slice().sort((a,b)=>(b.capacity-b.occupancy)-(a.capacity-a.occupancy))[0],worst=Object.entries(c.incidents.reduce((a,i)=>(a[i.zone||'Unassigned']=(a[i.zone||'Unassigned']||0)+1,a),{})).sort((a,b)=>b[1]-a[1])[0];if(q.includes('immediate')||q.includes('attention'))return{answer:`${critical.length} critical incidents require review first. ${critical[0]?`${critical[0].code} is highest priority at ${critical[0].priorityScore}/100.`:'No critical incident is currently recorded.'}`,actions:critical.slice(0,3).map(i=>`Review ${i.code} (${i.type.replaceAll('_',' ')}) and confirm dispatch.`)};if(q.includes('shelter'))return{answer:`${shelter?shelter.name+' has '+Math.max(shelter.capacity-shelter.occupancy,0)+' spaces available.':'No shelter capacity record is available.'}`,actions:shelter?[`Monitor ${shelter.name} at ${Math.round(shelter.occupancy/shelter.capacity*100)}% occupancy.`]:[]};if(q.includes('resource'))return{answer:`${available.length} response units are currently marked AVAILABLE out of ${c.resources.length}.`,actions:available.slice(0,4).map(r=>`${r.name} • ${r.type.replaceAll('_',' ')}`)};if(q.includes('zone')||q.includes('worst'))return{answer:worst?`${worst[0]} has the largest incident cluster with ${worst[1]} records in this district.`:'Zone clustering is unavailable.',actions:[]};return{answer:`Current district picture: ${active.length} active incidents, ${critical.length} critical, ${available.length} available units, and ${c.alerts.length} alert records. ${worst?`Highest incident concentration: ${worst[0]}.`:''}`,actions:['Review the critical queue.','Check river trend and blocked roads.','Confirm shelter capacity before evacuation.']}}
async function copilot(question,context){try{return await groq([{role:'system',content:'You are FloodGuard emergency operations copilot. Use only supplied database context. Never invent facts, government warnings, locations or resources. Return JSON with answer and actions array. If the data does not contain an answer, say so.'},{role:'user',content:JSON.stringify({question,context})}])}catch(e){return deterministic(question,context)}}

async function translate(text,language){
  try{
    return await groq([
      {role:'system',content:`Translate the supplied emergency/public-safety message into ${language}. Preserve facts, numbers, urgency and place names. Return JSON with translatedText only. Do not add information.`},
      {role:'user',content:text}
    ]);
  }catch(e){ return {translatedText:text, fallback:true}; }
}
async function advisory(context,language='English'){
  try{
    return await groq([
      {role:'system',content:`Write a concise public flood safety advisory in ${language}. Use only supplied facts. Do not claim a flood prediction. Return JSON with title, message, doList and dontList.`},
      {role:'user',content:JSON.stringify(context)}
    ]);
  }catch(e){
    return {title:'Flood safety advisory',message:'Follow verified district instructions, move to safe ground when directed, and avoid floodwater.',doList:['Keep emergency supplies ready','Follow official evacuation instructions'],dontList:['Do not enter moving floodwater','Do not drive through blocked roads'],fallback:true};
  }
}
async function sitrep(context){
  try{
    return await groq([
      {role:'system',content:'Generate a concise operational Situation Report for a district emergency operations centre. Use ONLY supplied database context. Clearly distinguish demo/cached/official data. Return JSON with report and keyActions array. Never invent facts.'},
      {role:'user',content:JSON.stringify(context)}
    ]);
  }catch(e){
    const active=(context.incidents||[]).filter(x=>!['RESOLVED','REJECTED'].includes(x.status));
    const critical=(context.incidents||[]).filter(x=>x.severity==='CRITICAL');
    const available=(context.resources||[]).filter(x=>x.status==='AVAILABLE');
    const occ=(context.shelters||[]).reduce((a,x)=>a+(x.occupancy||0),0);
    const cap=(context.shelters||[]).reduce((a,x)=>a+(x.capacity||0),0);
    return {report:`FLOODGUARD DISTRICT SITUATION REPORT\n\nDistrict: ${context.district}, ${context.state}\nGenerated: ${new Date().toLocaleString()}\n\nActive incidents: ${active.length}\nCritical incidents: ${critical.length}\nAvailable response units: ${available.length}/${(context.resources||[]).length}\nShelter occupancy: ${cap?Math.round(occ/cap*100):0}%\nBlocked roads: ${(context.roads||[]).filter(x=>x.status!=='OPEN').length}\n\nRecommended actions:\n1. Review the critical incident queue.\n2. Confirm rescue/medical readiness.\n3. Monitor blocked access and shelter capacity.\n\nDATA NOTE: This report is generated from FloodGuard operational records; demo/cached records remain labelled in the UI.`,keyActions:['Review critical incidents','Confirm resource readiness','Monitor access and shelter capacity'],fallback:true};
  }
}
module.exports={extractIncident,copilot,translate,advisory,sitrep};

