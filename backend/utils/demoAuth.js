const bcrypt=require('bcryptjs');const password=bcrypt.hashSync('floodguard123',10);const DEMO_USERS=[
{id:'demo-admin',name:'System Administrator',email:'admin@floodguard.gov',password,role:'ADMIN',district:'Dibrugarh',state:'Assam',language:'en'},
{id:'demo-officer',name:'District Officer R. Sharma',email:'officer@floodguard.gov',password,role:'DISTRICT_OFFICER',district:'Dibrugarh',state:'Assam',language:'en'},
{id:'demo-responder',name:'Field Responder A. Khan',email:'responder@floodguard.gov',password,role:'FIELD_RESPONDER',district:'Dibrugarh',state:'Assam',language:'en'},
{id:'demo-citizen',name:'Citizen User',email:'citizen@floodguard.gov',password,role:'CITIZEN',district:'Dibrugarh',state:'Assam',language:'en'}];module.exports={DEMO_USERS,DEMO_PASSWORD:'floodguard123'};
