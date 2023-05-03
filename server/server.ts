import { Socket } from "socket.io";
import { nanoid } from "nanoid";

const web3 = require("@solana/web3.js")
const express = require("express");
const app = express();
const cors = require("cors");
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());

interface roomInterface{
  wallet1: string,
  socket1?: string,
  wallet2?: string,
  socket2?: string,
  amount: number,
  ongoing: boolean
}

interface playerInterface{
  wallet: string,
  room: string
}

const rooms: Map<string, roomInterface> = new Map() // Map of roomid -> {socket1, wallet1, ...}
const playersToReconnect: Map<string, string> = new Map() // Map of wallet -> room
const activePlayers: Map<string, string> = new Map() // Map of wallet -> roomID, players that are currently searching or in game.

io.on("connect", (socket: Socket) => {
  console.log("Socket Connected", socket.id)

  socket.on("check-online", (wallet: string) => {
    if(activePlayers.has(wallet)){
      socket.emit("not-online")
    }
  })

  socket.on("check-reconnect", (wallet: string) => {
    console.log("Checking reconnect")
    let roomID;
    if(activePlayers.has(wallet)){

      console.log("Active user found.")
      socket.emit("already-online")

    } else if(playersToReconnect.has(wallet)){
      console.log(playersToReconnect)
      console.log("Found reconnection! Reconnecting socket ", socket.id)

      roomID = playersToReconnect.get(wallet)

      socket.emit("rejoin-room", roomID)

      const room = roomID ? rooms.get(roomID) : null

      if(room){
        if(wallet===room.wallet1) room.socket1 = socket.id
        else room.socket2 = socket.id
      }

      activePlayers.set(wallet, roomID ? roomID : "")
      playersToReconnect.delete(wallet)

      room && roomID && listen_for_disconnect(socket, room, roomID, wallet)
    }
  })

  socket.on("find-room", (wallet:string, amount:number) => {
    let userAlreadySearching=false;
    const availableRooms = [...rooms].filter(([k,v])=>{
      if(v.wallet1 == wallet){
        socket.emit("already-searching")
        userAlreadySearching=true;
      }
      return !v.wallet2 && v.amount === amount
    })

    if(!userAlreadySearching){
      let room: roomInterface;
      let roomID: string;
      
      if(availableRooms.length === 0) {
        room = {
          wallet1: wallet,
          socket1: socket.id,
          amount: amount,
          ongoing: false
        }

        console.log("Room Created By", wallet, "with amount", amount)

        roomID = nanoid()
        rooms.set(roomID, room)

        socket.on("cancel-search", () => {
          activePlayers.delete(wallet)
          rooms.delete(roomID)
          send_to_wallet(wallet, amount)
        })

        const DELAY_MS = 2000; // 10 seconds
        setTimeout(() => {
          console.log("User can cancel")
          socket.emit("can-cancel");
        }, DELAY_MS);
      } else {
        let roomToJoin = availableRooms[0];

        [roomID, room] = roomToJoin;
        room.socket2 = socket.id
        room.wallet2 = wallet
        room.ongoing = true

        console.log("Room found by", wallet, "with amount", amount)

        room.socket1 && socket.to(room.socket1).emit("room-found", roomID)
        socket.emit("room-found", roomID)

        const DELAY_MS = 10000; // 10 seconds
        setTimeout(() => {
          end_game(roomID, socket)
        }, DELAY_MS);
      }

      activePlayers.set(wallet, roomID)

      listen_for_disconnect(socket, room, roomID, wallet)
    }
  })

  // messages

  socket.on("new-message", (message: { wallet: string; message: string; id: string }, roomID: string) => {
    let room = rooms.get(roomID)
    let send_to = message.wallet === room?.wallet1 ? room?.socket2 : room?.socket1 // Socket the message is sent too
    send_to = send_to ? send_to : ""

    socket.to(send_to).emit("new-message", { ...message });
  });

  socket.on("clear-messages", (roomID: string) => {
    socket.to(roomID).emit("clear-messages");
  });

  // audio && video

  socket.on("unmute-mic", (roomID: string) => {
    socket.to(roomID).emit("unmute-mic");
  });

  socket.on("mute-mic", (roomID: string) => {
    socket.to(roomID).emit("mute-mic");
  });

  socket.on("disconnect", () => {
    console.log("Socket Disconnected", socket.id)
  })
});

function listen_for_disconnect(socket: Socket, room: roomInterface, roomID: string, wallet: string){
  socket.on("disconnect", () => {
    activePlayers.delete(wallet)

    if(room.socket1 === socket.id) room.socket1=undefined
    else if(room.socket2 === socket.id) room.socket2=undefined

    if(!room.socket1 && !room.socket2) { // If both users disconnected end the game prematurely
      console.log("Room ended by", room.wallet1)
      end_game(roomID, socket)
      // endMatch() To Be Done - create function endMatch that ends the game at any point
    } else {
      playersToReconnect.set(wallet, roomID)
    }
  })
}

server.listen(process.env.PORT || 4000, () => {
  console.log("Listening on port 4000...");
});

function end_game(roomID: string, socket: Socket){
  let room = rooms.get(roomID)

  if(room && room.wallet2){
    
    room.ongoing=false

    let winner = Math.floor(Math.random() * 2) + 1;

    console.log("Game ended between", room.wallet1, "and", room.wallet2, "winner", winner)
    console.log(room.socket1, room.socket2)

    if(winner === 1){
      room.socket1 && socket.to(room.socket1).emit("winner")
      room.socket2 !== socket.id && room.socket2 && socket.to(room.socket2).emit("loser")
      socket.emit("loser")

      send_to_wallet(room.wallet1, room.amount * 1.97)
    } else if(winner === 2 && room.socket2) {
      room.socket1 && socket.to(room.socket1).emit("loser")
      room.socket2 !== socket.id && socket.to(room.socket2).emit("winner")
      console.log("aiojsdiajfsoiasjfopasd",room.socket2, socket.id)
      socket.emit("winner")

      send_to_wallet(room.wallet2, room.amount * 1.97)
    } 
    // Add Game History to DB

    delete_room(roomID)
  } else if (room) {
    !room.wallet2 && send_to_wallet(room.wallet1, room.amount)
    delete_room(roomID)
  }
}

function delete_room(roomID: string){
  let room = rooms.get(roomID)
  console.log(room)
  // Remove both users from the reconnect queue and active users 
  if(room){
    activePlayers.delete(room.wallet1)
    playersToReconnect.delete(room.wallet1)

    room.wallet2 && activePlayers.delete(room.wallet2)
    room.wallet2 && playersToReconnect.delete(room.wallet2)
  }
  

  rooms.delete(roomID)

  console.log(activePlayers, playersToReconnect)

}

async function send_to_wallet(wallet: string, amount: number){
  const bs58 = require('bs58');

  //const LongKey = 
  const privateKey = bs58.decode(LongKey)
  const secretKey = new Uint8Array(privateKey.buffer, privateKey.byteOffset, privateKey.byteLength / Uint8Array.BYTES_PER_ELEMENT);

  const fromWallet = web3.Keypair.fromSecretKey(secretKey)

  // Connect to the Solana network
  const connection = new web3.Connection("https://api.devnet.solana.com");

  // Create a transaction instruction to transfer Solana to the recipient
  const transaction = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: wallet,
      lamports: web3.LAMPORTS_PER_SOL * amount,
    }),
  );

  // Sign the transaction with your wallet's keypair
  transaction.feePayer = fromWallet.publicKey;
  const signature = await web3.sendAndConfirmTransaction(connection, transaction, [fromWallet]);

  console.log(`Sent ${amount} Solana from ${fromWallet.publicKey.toBase58()} to ${wallet} with signature ${signature}`);
}
