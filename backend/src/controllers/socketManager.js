import {Server} from 'socket.io';

let connections={} //how many are connected
let messages= {}
let timeOnline={}

const connectToSocket = (server) => {
    const io = new Server(server,{
        
        cors:{
            origin:'*',
            methods:['GET','POST'],
            allowedHeaders:['*'],
            credentials:true
        }
    });
    
    io.on("connection",(socket) => { //this socket refers to the client
        console.log("a user has been connected",socket.id)
        //socket.id is a unique id for a client 
        // to catch the message from the client to server and to other clients .client side emited
        socket.on("join-call",(path ) => {
            if(connections[path] === undefined){ //refers to the window href
                connections[path]=[]
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            for(let a=0;a<connections[path].length;a++){
                io.to(connections[path][a]).emit('user-joined',socket.id,connections[path])
            }

            if(messages[path] != undefined){
                for(let a = 0; a < messages[path].length;++a){
                    io.to(socket.id).emit("chat-message",messages[path][a]['data'],messages[path][a]['sender'],messages[path][a]['socket-id-sender'])
                }
            }
        })

        socket.on("signal",(toId,message) => {
            io.to(toId).emit("signal",socket.id,message)
        })

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections).reduce(([room, isFound], [roomKey, roomValue]) => {
                if (!isFound && roomValue.includes(socket.id)) {
                    return [roomKey, true];
                }
                return [room, isFound];
            }, ['', false]);
        
            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }
                messages[matchingRoom].push({
                    'sender': sender,
                    'data': data,
                    'socket-id-sender': socket.id
                });
                console.log("message",matchingRoom,":",sender,data)
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id);
                });
            }
        });
        

        // to disconnect the call

        socket.on("disconnect",() => {
            let diffTime = Math.abs(timeOnline[socket.id] - new Date())
            let key
            // k is for room and v is for person
            for(const[k,v] of JSON.parse(JSON.stringify(Object.entries(connections)))){
                for (let a = 0;a<v.length;a++){
                    if (v[a] === socket.id){
                        key = k
                        for(let a=0;a<connections[key].length;++a){
                            io.to(connections[key][a]).emit('user-left',socket.id)
                        }
                        let index = connections[key].indexOf(socket.id);

                        connections[key].splice(index,1)

                        if(connections[key].length ===0){
                            delete connections[key]
                        }
                    }
                }
            }
        })
    })
}

export default connectToSocket;