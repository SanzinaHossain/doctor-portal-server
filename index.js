const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors=require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000
//middle wire for cors
app.use(cors())
app.use(express.json())

//database connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bnwni.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
 async function run(){
   try{
         await client.connect();
         const serviceCollection=client.db('doctor-portal').collection('services');
         const bookingCollection=client.db('doctor-portal').collection('booking');
         console.log("database connected")

         //get all data from services
         app.get('/services',async(req,res)=>{
           const query={};
           const cursor=serviceCollection.find(query);
           const services=await cursor.toArray()
           res.send(services)
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
