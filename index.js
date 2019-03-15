var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 420;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

boardWidth=20;
boardHeight=20;
gameRunning=false;

function randomSnake(){
  return  {
    body:[{x:Math.floor(Math.random()*boardWidth),y:Math.floor(Math.random()*boardHeight)}],
    length:3,
    direction:[0,1],
    ready:false,
    color:'#'+Math.random().toString(16).substr(-6),
    isDead:true,
  }
}
function kill(snake){
  snake.isDead=true;
  snake.ready=false
  snake.color="#ffffff"
  return snake
}
var players = {};
runGame=false;
io.on('connection', function (socket) {

  console.log('a user connected');
  // create a new player and add it to our players object
  if(runGame==false){
    players[socket.id] = randomSnake();
    players[socket.id].color="#ffffff"
  }
  if(players[socket.id]==undefined){
    delete players[socket.id]
    return;
  }
  socket.emit("playerID",socket.id)



  if(!gameRunning)io.emit("boardSize",{x:boardWidth,y:boardHeight})
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
    if(gameRunning)return;
    console.log(socket.id+" readied")
    players[socket.id].ready=true;

    var allReady=true;
    for(player of Object.keys(players)){
      if(players[player].ready== false)allReady=false;

    }
    if(allReady && (Object.keys(players)).length>1){
      console.log("starting game")
      startGame();

    }
  })
  socket.on("turn",function(data){
    // if((players[socket.id].direction!=[0,-1] && data==[0,1]) || (players[socket.id].direction!=[0,1] && data==[0,-1]) || (players[socket.id].direction!=[1,0] && data==[-1, 0]) || (players[socket.id].direction!=[-1,0] && data==[1, 0])){

    // }
    strData = JSON.stringify(data);
    strDir = JSON.stringify(players[socket.id].direction);
    if(strData == "[0,-1]" && strDir=="[0,1]" || strData == "[0,1]" && strDir=="[0,-1]" || strData == "[1,0]" && strDir=="[-1,0]" || strData == "[-1,0]" && strDir=="[1,0]"){

    }
    else players[socket.id].direction=data;

  })


});
function spawnFood(){
  food={x:Math.floor(Math.random()*boardWidth),y:Math.floor(Math.random()*boardHeight)}
}
function startGame(){
  boardWidth=Object.entries(players).length*10
  boardHeight=Math.floor(boardWidth*3/5)
  spawnFood()

  gameRunning=true;


  for(id of Object.keys(players)){
    players[id]=randomSnake()
    players[id].isDead=false;
    players[id].ready=false;
  }

}
function broadcastGame(){
  io.emit("boardSize",{x:boardWidth,y:boardHeight})
  io.emit("gameState",{players:players,food:food})
}


function run(){
  if(!gameRunning)return;
  for(player of Object.entries(players)){

    snake=player[1]
    if(snake.isDead)continue;

    tail=snake.body[0]
    newBlock={x:(tail.x+snake.direction[0])%boardWidth,y:(tail.y+snake.direction[1])%boardHeight}
    if(newBlock.x<0)newBlock.x=boardWidth-1;
    if(newBlock.y<0)newBlock.y=boardHeight-1;
    if(newBlock.x==food.x && newBlock.y==food.y){
      snake.length+=5
      spawnFood()
    }
    if(newBlock==null){
      throw error
    }
    snake.body.unshift(newBlock)
    if(snake.body.length>snake.length){
      snake.body.pop()
    }

    snake.body=snake.body.filter(Object)//remove empty items


    var head=snake.body[0]
    //check if they've run into themselves
    for(var i=1;i<snake.body.length;i++){
      if(snake.body[i].x==head.x && snake.body[i].y==head.y)kill(snake)
    }
  }

  for(player of Object.entries(players)){
    snake=player[1]
    var head=snake.body[0]
    //check if they've run into other snakes
    for(other of Object.entries(players)){
      if(other[0]==player[0] || other[1].body==undefined || other[1].isDead || snake.isDead){}
      else{
        for(tile of other[1].body){
          if(head.x==tile.x && head.y==tile.y){
            player[1]=kill(player[1])
            other[1].length+=player[1].length;

            console.log(player[0]+" died")
          }
        }
      }//skip itself


    }
  }





  aliveCount=0;
  for(player of Object.entries(players)){
    if(!player[1].isDead)aliveCount++;
  }
  if(aliveCount==0)gameRunning=false;



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
