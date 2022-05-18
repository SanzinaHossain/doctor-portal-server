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
         console.log("database connected")

         //get all data from services
         app.get('/services',async(req,res)=>{
           const query={};
           const cursor=serviceCollection.find(query);
           const services=await cursor.toArray()
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
