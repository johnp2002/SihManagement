const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server, Socket } = require('socket.io');

const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

// firebase configs
const { collection, getDocs } = require("firebase/firestore");
const { doc, setDoc } = require("firebase/firestore");

const db = require('./config/firebase');

var data = []
async function getJson(){
    const citiesRef = collection(db, 'teams2');
    const snapshot = await getDocs(citiesRef);
    snapshot.forEach(doc => {
    // console.log(doc.id, '=>', doc.data());
    if(doc.data().status != 'completed'){

      data.push(doc.data())
    }
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

var cList = []
const app = express();
const server = createServer(app);
const io = new Server(server);

// for serving static files to client
app.use(express.static('public'))
// cokkie parser to read cookies of client
app.use(cookieParser())
// body parser for post requests
app.use(bodyParser.urlencoded({ extended: false }))

// student dashboard
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

// volunteer login page request
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

app.get('/evaluator',(req,res)=>{

  try{
    if(sha256(req.cookies.auth) === 'e4545e80bf167d4b592abdf0b63c61c3a6a7b3e57d408ae057028edf4337293c'){
      res.sendFile(join(__dirname, 'pages/evaluator.html'));
    }
    else if(sha256(req.cookies.auth) === '9aded2fa55d675be7430e1884f8ab180799bd115a5fc1008c782a36189b4852f'){
      res.sendFile(join(__dirname, 'pages/evaluator2.html'));
    }
    else if(sha256(req.cookies.auth) === '9940272de041fc30359216a0e97bbc8353046a7dd11c733044cffbb4e637d91c'){
      res.sendFile(join(__dirname, 'pages/evaluator3.html'));
    }
    else if(sha256(req.cookies.auth) === '088730471503a8c174d9cbf6a20b27b8a63b548a58a425d8dd2a9641c2e1efe9'){
      res.sendFile(join(__dirname, 'pages/evaluator4.html'));
    }
    else{
      res.sendFile(join(__dirname, 'pages/auth.html'))
    }
  }catch(err){
    res.sendFile(join(__dirname, 'pages/auth.html'))
  }

})

app.get('/webcam',(req,res)=>{
  res.sendFile(join(__dirname, 'pages/cam.html'));
})


app.get('/admin',(req,res)=>{
  res.sendFile(join(__dirname, 'pages/admin.html'));
})


io.on('connection', (socket) => {
  io.emit('clists',cList)
  // console.log(socket.id)
  socket.on('camData',(data)=>{
    io.emit('camData',data)
  })
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
  io.of("/volunteer").emit('queue',queue)
  socket.on('queue',(meg)=>{
    console.log('emitted from volunteer')
    // console.log(meg)
    queue = meg;
    io.emit('queue',queue)
    io.of("/evaluator").emit('currTeam',queue.status.curr)
  })
  socket.on('updateStudent',(m)=>{
    data = m;
    io.of("/evaluator").emit('currTeam',queue.status.curr)
  })
  socket.on('completeTeam',(m)=>{
    console.log('team Complete emition')
    console.log(m)
    // let searching_index = fruits_array.findIndex(fruit => fruit === "mango");
    cList.push(m)
    
    setDoc(doc(db, "teams", m.team_id), {
      ...m, status:'completed'
    });
    io.emit('clists',cList)
  })


});


// evaluator socket
io.of("/evaluator").on("connection",(socket)=>{
  console.log(socket.connected)
  console.log('Evaluators connected')
  io.of("/evaluator").emit('currTeam',queue.status.curr)
  
  socket.on('novelity',(val)=>{
    socket.broadcast.emit('novelity',val)
    console.log('novelity value emitted '+ val+` for team ${queue.status.curr[0].team_id}`)
    queue.status.curr[0].novelity=val;
    io.emit('queue',queue)
    io.of("/evaluator").emit('currTeam',queue.status.curr)
    setDoc(doc(db, "teams", queue.status.curr[0].team_id), {
      ...queue.status.curr[0],'novelity':val
    });
  })
  socket.on('Apporiateness',(val)=>{
    socket.broadcast.emit('Apporiateness',val)
    console.log('Apporiateness value emitted '+ val+` for team ${queue.status.curr[0].team_id}`)
    queue.status.curr[0].Apporiateness=val;
    io.emit('queue',queue)
    io.of("/evaluator").emit('currTeam',queue.status.curr)
    setDoc(doc(db, "teams", queue.status.curr[0].team_id), {
      ...queue.status.curr[0],'Apporiateness':val
    });
  })
  socket.on('Technical',(val)=>{
    socket.broadcast.emit('Technical',val)
    console.log('Technical value emitted '+ val+` for team ${queue.status.curr[0].team_id}`)
    queue.status.curr[0].Technical=val;
    io.emit('queue',queue)
    io.of("/evaluator").emit('currTeam',queue.status.curr)
    setDoc(doc(db, "teams", queue.status.curr[0].team_id), {
      ...queue.status.curr[0],'Technical':val
    });
  })
  socket.on('Impact',(val)=>{
    socket.broadcast.emit('Impact',val)
    console.log('Impact value emitted '+ val+` for team ${queue.status.curr[0].team_id}`)
    queue.status.curr[0].Impact=val;
    io.emit('queue',queue)
    io.of("/evaluator").emit('currTeam',queue.status.curr)
    setDoc(doc(db, "teams", queue.status.curr[0].team_id), {
      ...queue.status.curr[0],'Impact':val
    });
  })
  
})

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});