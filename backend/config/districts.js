const DISTRICTS = [
  {state:'Assam',name:'Dibrugarh',center:{lat:27.4728,lng:94.9120},population:1320000,zones:['Dibrugarh East','Dibrugarh West','Chabua-Lahowal','Moran','Naharkatia','Tengakhat'],rivers:['Brahmaputra','Buridehing'],cwcSites:['Dibrugarh']},
  {state:'Assam',name:'Lakhimpur',center:{lat:27.2352,lng:94.1048},population:1040000,zones:['North Lakhimpur','Dhakuakhana','Narayanpur','Bihpuria','Nowboicha'],rivers:['Subansiri','Ranganadi'],cwcSites:['Badatighat']},
  {state:'Assam',name:'Barpeta',center:{lat:26.3222,lng:91.0063},population:1690000,zones:['Barpeta','Sarthebari','Chenga','Baghbar','Sarupeta'],rivers:['Beki','Brahmaputra'],cwcSites:['Beki Road Bridge']},
  {state:'Assam',name:'Morigaon',center:{lat:26.2526,lng:92.3426},population:958000,zones:['Morigaon','Mayong','Laharighat','Bhurbandha'],rivers:['Kopili','Brahmaputra'],cwcSites:['Kampur']},
  {state:'Assam',name:'Dhemaji',center:{lat:27.4830,lng:94.5830},population:688000,zones:['Dhemaji','Jonai','Sissiborgaon','Gogamukh'],rivers:['Brahmaputra','Jiadhal','Gai'],cwcSites:['Dhemaji']},
  {state:'Assam',name:'Majuli',center:{lat:27.0014,lng:94.2243},population:168000,zones:['Kamalabari','Garamur','Jengraimukh','Auniati'],rivers:['Brahmaputra','Subansiri'],cwcSites:['Neamatighat']},
  {state:'Assam',name:'Sonitpur',center:{lat:26.6290,lng:92.8000},population:785000,zones:['Tezpur','Dhekiajuli','Rangapara','Biswanath Chariali'],rivers:['Brahmaputra','Jia-Bharali'],cwcSites:['Tezpur','NTRC Jia Bharali']},
  {state:'Uttar Pradesh',name:'Lucknow',center:{lat:26.8467,lng:80.9462},population:3800000,zones:['Central','East','West','North','South'],rivers:['Gomti'],cwcSites:[]}
];
const key=(state,name)=>`${state}::${name}`;
const DISTRICT_MAP=Object.fromEntries(DISTRICTS.map(d=>[key(d.state,d.name),d]));
function getDistrict(state,name){return DISTRICT_MAP[key(state,name)]||DISTRICT_MAP[key('Uttar Pradesh','Lucknow')];}
function states(){return [...new Set(DISTRICTS.map(d=>d.state))];}
function districtsForState(state){return DISTRICTS.filter(d=>d.state===state);}
module.exports={DISTRICTS,DISTRICT_MAP,getDistrict,states,districtsForState};
