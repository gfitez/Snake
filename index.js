var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
function randomSnake(){
  return  {
    body:[{x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*20)}],
    length:3,
    direction:[0,1],
    ready:false,
    color:'#'+Math.random().toString(16).substr(-6)
  }
}
var players = {};
runGame=false;
io.on('connection', function (socket) {
  console.log('a user connected');
  // create a new player and add it to our players object
  if(runGame==false){
    players[socket.id] = randomSnake();
  }

  // send the players object to the new player
  socket.emit('currentPlayers', players);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    console.log('user disconnected');
    // remove this player from our players object
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });

  socket.on("ready", function(){
    console.log(socket.id+" readied")
    players[socket.id].ready=true;
    var allReady=true;
    for(player of Object.entries(players)){
      if(player.ready=false)allReady=false;
    }
    if(allReady){
      console.log("starting game")
      runGame=true
      startGame();
    }
  })
  socket.on("turn",function(data){
    players[socket.id].direction=data
  })
});
function spawnFood(){
  food={x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*20)}
}
function startGame(){
  spawnFood()
  for(player of Object.entries(players)){
    player= randomSnake()
  }
}
function broadcastGame(){
  io.emit("gameState",{players:players,food:food})
}


function run(){
  for(player of Object.entries(players)){
    snake=player[1]


    tail=snake.body[0]
    newBlock={x:(tail.x+snake.direction[0])%20,y:(tail.y+snake.direction[1])%20}
    if(newBlock.x<0)newBlock.x=19
    if(newBlock.y<0)newBlock.y=19
    if(newBlock.x==food.x && newBlock.y==food.y){
      snake.body.length+=3
      spawnFood()
    }
    if(newBlock==null){
      throw error
    }
    snake.body.unshift(newBlock)
    if(snake.body.length>snake.length){
      snake.body.pop()
      
    }
  }
}
function main(){
  run()
  broadcastGame()
}
spawnFood()
setInterval(main,100)

http.listen(port, function(){
  console.log('listening on *:' + port);
});
