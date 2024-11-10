import { useContext } from "react"
import { RoomContext } from "../context/RoomContext"

export default function JoinButton(){
    const {ws} = useContext(RoomContext)
    const createRoom = ()=>{
        ws.emit("create-room")
    }
    return(
        <>
          <button className="btn btn-danger" onClick={createRoom}>Send</button>
        </>
    )
}