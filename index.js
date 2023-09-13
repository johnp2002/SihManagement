const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server, Socket } = require('socket.io');

const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

// firebase configs
const { collection, getDocs } = require("firebase/firestore");

const db = require('./config/firebase');

const data = []
async function getJson(){
    const citiesRef = collection(db, 'teams');
    const snapshot = await getDocs(citiesRef);
    snapshot.forEach(doc => {
    // console.log(doc.id, '=>', doc.data());
    data.push(doc.data())
    });

}
getJson()

// constants values
let queue = {
  status:{
    curr:[],
    next:[]
  },
  queue : []
}
const auth = "be9e67d392e013f183273dd240734f62a67a4d8865cab185aeb0bf0ee821d82d";
const { sha256 } = require('js-sha256');

const app = express();
const server = createServer(app);
const io = new Server(server);

// for serving static files to client
app.use(express.static('public'))
// cokkie parser to read cookies of client
app.use(cookieParser())
// body parser for post requests
app.use(bodyParser.urlencoded({ extended: false }))


app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'pages/main.html'));
});

app.post('/querypost',(req,res)=>{
  queue.queue=[]
  if(sha256(req.cookies.auth) != auth){
    res.send('<h1>Un-Authorised Access</h1>')
  } 
  console.log(`post requested userr ${req.cookies}`)
  // console.log(req.body)
  for(let i in req.body){
    // console.log(i)
    let tmp = {'queue': req.body[i] }
    if(req.body[i] != ''){

      queue.queue.push(tmp)
    }
  }
  // queue = req.body
  console.log(queue.queue)

  res.redirect('back')
  io.emit('queue',queue)
});

app.post('/statuspost',(req,res)=>{
  if(sha256(req.cookies.auth) != auth){
    res.send('<h1>Un-Authorised Access</h1>')
  } 
  console.log('status post blackkkk')
  console.log(req.body)
  // queue.status.curr=[]
  // queue.status.next=[]
  // queue.status.curr.push( req.body.curr);
  // queue.status.curr.push( req.body.currID);
  // queue.status.next.push(req.body.next)
  // queue.status.next.push(req.body.nextID)
  // for(let i in req.body){
  //   // console.log(i)
  //   let tmp = {'queue': req.body[i] }
  //   if(req.body[i] != ''){

  //     queue.queue.push(tmp)
  //   }
  // }
  // queue = req.body

  // res.redirect('back')
  // io.emit('queue',queue)
});

app.get('/volunteer',(req,res)=>{
  
  // console.log(req.cookies.auth)
  // try{
  //   console.log(sha256( req.cookies.auth))
  // }catch(err){
  //   console.log(`cathed err ${err}`)
  // }
  // res.sendFile(join(__dirname, 'pages/volunteer.html'));  
  try{
    if(sha256(req.cookies.auth) === auth){
      res.sendFile(join(__dirname, 'pages/volunteer.html'));
    }
    else{
      res.sendFile(join(__dirname, 'pages/auth.html'))
    }
  }catch(err){
    res.sendFile(join(__dirname, 'pages/auth.html'))
  } 
  
  
})



io.on('connection', (socket) => {
  
  // console.log(socket.id)
  console.log(queue)
  io.emit('queue',queue)
  socket.on('chat message', (msg) => {
    console.log(socket.id)
    socket.broadcast.emit('chat message', msg);
  });

  socket.on('queue',(msg)=>{
    console.log(msg)
    queue = msg;
    io.emit('queue',queue)
  });


});

// volunteers socket 

io.of("/volunteer").on("connection", (socket) => {
  console.log(socket.connected)
  console.log('volunteers connected')
  io.of("/volunteer").emit('stuData',data)
});


server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});