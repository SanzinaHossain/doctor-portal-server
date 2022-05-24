const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors=require('cors')
const jwt=require('jsonwebtoken');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000
//middle wire for cors
app.use(cors())
app.use(express.json())
//verify jst token
function verifyJWT(req,res,next){
   const authHeader=req.headers.authorization;
   if(!authHeader)
   {
     return res.status(401).send({message:'Unauthorized access'});
   }
   const token=authHeader.split(' ')[1];
   jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,function(err,decoded){
     if(err){
       return res.status(403).send({message:'Forbidden access'});
     }
     req.decoded=decoded;
     next()
   })
}
//database connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bnwni.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
 async function run(){
   try{
         await client.connect();
         const serviceCollection=client.db('doctor-portal').collection('services');
         const bookingCollection=client.db('doctor-portal').collection('booking');
         const userCollection=client.db('doctor-portal').collection('users');
         console.log("database connected")

         //get all data from services
         app.get('/services',async(req,res)=>{
           const query={};
           const cursor=serviceCollection.find(query);
           const services=await cursor.toArray()
           res.send(services)
         })
         app.get('/users',verifyJWT,async(req,res)=>{
          const query={};
          const cursor=userCollection.find(query);
          const users=await cursor.toArray()
          res.send(users)
        })
         app.get('/booking',verifyJWT,async(req,res)=>{
          const Patient=req.query.PatientEmail;
           const decodedEmail=req.decoded.email;
           if(Patient===decodedEmail)
           {
            const query={PatientEmail:Patient};
            const booked=await bookingCollection.find(query).toArray();
            return res.send(booked);
           }
          else{
            return res.status(403).send({message:'Forbidden Access'})
          }
        })
         //send booking data from client to server
         app.post('/booking',async(req,res)=>{
              const booking=req.body;
              const query={treatment:booking.treatment,date:booking.date,PatientEmail:booking.PatientEmail}
              const have=await bookingCollection.findOne(query)
              if(have)
              {
                return res.send({success:false,booking:have})
              }
             else{
              const result=await bookingCollection.insertOne(booking);
              return res.send({success:true,result});
             }
         })
         //This is not proper way
         //aggregition pipeline use as an expert
         app.get('/available',async(req,res)=>{
           const date=req.query.date;
           //get all services
           const services=await serviceCollection.find().toArray();
           //get the booking of that date
           const query={date:date};
           const booking=await bookingCollection.find(query).toArray();
           services.forEach(service=>{
             const serviceBooking=booking.filter(b=>b.treatment==service.name)
             const booked=serviceBooking.map(s=>s.slot);
             const available=service.slots.filter(s=>!booked.includes(s))
             service.slots=available;
           })
           res.send(services)
         })
         //admin set up
         app.put('/users/admin/:email',verifyJWT,async(req,res)=>{
          const email=req.params.email;
          const requester=req.decoded.email;
          console.log(requester);
          const requesterAccount=await userCollection.findOne({email:requester})
          if(requesterAccount.role==='admin')
          {
            const filter={email:email}
            const updateDoc={
              $set:{role:'admin'},
            };
            const result= await userCollection.updateOne(filter,updateDoc);
            res.send(result);
          }
          else{
            res.status(403).send({message:'forbidden access'});
          }
        })
         app.put('/user/:email',async(req,res)=>{
           const email=req.params.email;
           const user=req.body;
           const filter={email:email}
           const options={upsert:true}
           const updateDoc={
             $set:user,
           };
           const result=await userCollection.updateOne(filter,updateDoc,options);
           const token=jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
           res.send({result,token});
         })
         //find which users are admin
         app.get('/admin/:email',async(req,res)=>{
           const email=req.params.email;
           const user=await userCollection.findOne({email:email})
           const isadmin=user.role==='admin';
           res.send({admin:isadmin})
         })
   }
   finally{

   }
 }
 run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Doctor Portal')
})

app.listen(port, () => {
  console.log(`doctor portal ${port}`)
})
