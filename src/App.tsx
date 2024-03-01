import { FormEvent, useEffect, useState } from 'react'

import './App.css'

const ws = new WebSocket("ws://localhost:3000/cable");

function App() {
  const [messages, setMessages] = useState<any[]>([])
  const [guid, setGuid] = useState("");
  const messagesContainer = document.getElementById("messages")
  ws.onopen = () => {
    console.log("Connected to websocket server");
    setGuid(Math.random().toString(36).substring(2, 15))

    ws.send(
      JSON.stringify({
        command: "subscribe",
        identifier: JSON.stringify({
          id: guid,
          channel: "MessagesChannel"
        })
      })
    )
  }

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);

    if(data.type === "ping") return;
    if(data.type === "welcome") return;
    if(data.type === "confirm_subscription") return;

    setMessagesAndScrollDown([...messages,data.message])
  }

  const setMessagesAndScrollDown = (data: any) => {
    setMessages(data);
    if(messagesContainer != null) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }

  const fetchMessages = async () => {
    const response = await fetch("http://localhost:3000/messages");
    const data = await response.json();

    setMessagesAndScrollDown(data)
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const body = e.target.message.value;
    e.target.message.value = "";

    await fetch("http://localhost:3000/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body })
    })
  }
  
  return (
    <>
      <div className='App'>
        <div className="messageHeader">
          <h1>Messages</h1>
          <p>Guid: {guid}</p>
        </div>
        <div className="messages" id="messages">
          {messages.map((message) => (
            <div className="message" key={message.id}>
              <p>{message.body}</p>
            </div>
          ))}
        </div>
        <div className="messagesForm">
          <form onSubmit={(e) => handleSubmit(e)}>
            <input type="text" 
            className="messagesInput" 
            name='message'
            />
            <button type="submit" className='messagesButton'>Send</button>
          </form>
        </div>
      </div>
    </>
  )
}

export default App
