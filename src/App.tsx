import React, { useEffect, useState } from 'react';
import useActionCable from './hooks/useActionCable';
import useChannel from './hooks/useChannel';

export default function App() {
  const { actionCable } = useActionCable('ws://localhost:3000/cable')
  const { subscribe, unsubscribe } = useChannel(actionCable)
  const [messageData, setMessageData] = useState<{ id: string, body: string }[]>([])
  const [message, setMessage] = useState("")

  const fetchMessages = async () => {
    try {
      const response = await fetch("http://localhost:3000/messages");
      const responseJson = await response.json();

      console.log(responseJson, "Response Json")
      setMessageData(responseJson)

    }
    catch (err) {
      alert(err)
    }
    finally {
      console.log("Fetched")
    }
  }

  const ActionCableSubscribe = () => {
    subscribe({ channel: 'MessagesChannel' }, {
      received: (x) => {
        console.log(x, "Received From Websocket")
        if (x.action === 'delete') {
          const receivedData = x.data;

          console.log(messageData, 'existingData')
          console.log(receivedData, 'receivedData')
          const filteredData = messageData.filter((item) => receivedData.id !== item.id)

          setMessageData(filteredData)
          console.log(filteredData, 'filteredData')
        }
        else if (x.action === 'create') {
          const receivedData = x.data;
          console.log(messageData, "EXisting")
          setMessageData([...messageData, receivedData])
          setTimeout(() => {
            console.log(messageData, "Received")
          }, 1000)
        }
        else {
          console.log(x, "Some other data received")
        }
      },
      initialized: function (): void {
        console.log("Init")
      },
      connected: function (): void {
        console.log("Connection established")
      },
      disconnected: function (): void {
        console.log("Connection Disconnected")
      }
    })
  }

  useEffect(() => {
    fetchMessages()
    ActionCableSubscribe()

    return () => {
      unsubscribe()
    }
  }, [])

  const deleteMessages = async (id: string) => {
    try {
      await fetch("http://localhost:3000/messages/" + id, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      })
    }
    catch (err) {
      alert(JSON.stringify(err))
    }
    finally {
      console.log("Deleted")
    }

  }

  return (
    <>
      <div>
        {messageData.map((item) => (
          <div key={item.id}>
            <p>{item.id}: {item.body}</p>
            <button type="button" onClick={() => deleteMessages(item.id)}>Delete Message</button>
          </div>
        ))}
      </div>
      <div>
        <input type="text" id="message"
          value={message} onChange={(e) => {
            setMessage(e.target.value)
          }} />
        <button className='messagesButton' onClick={async () => {
          if (message.trim() === "") {
            return console.log("Returned")
          }
          const body = message;
          await fetch("http://localhost:3000/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ body })
          })
          setMessage("")
        }} >Sendeee</button>
      </div>
    </>
  );
}
