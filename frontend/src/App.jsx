// frontend/src/App.jsx
import { useEffect, useRef, useState, useLayoutEffect } from 'react';

function App() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const socketRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Note: If your IP changes, update this line!
    const socket = new WebSocket("ws://192.168.29.173:8000/ws");
    socketRef.current = socket;

    // Initial Canvas Setup
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // 1. HANDLE DRAWING
        if (data.type === 'draw') {
          drawOnCanvas(ctx, data.prevX, data.prevY, data.currX, data.currY);
        } 
        // 2. HANDLE NEW ROUND (Clear Board)
        else if (data.type === 'new_round') {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setMessages((prev) => [...prev, { message: data.message, isSystem: true }]);
        }
        // 3. HANDLE CHAT
        else if (data.type === 'chat') {
           setMessages((prev) => [...prev, data]);
        }
      } catch (e) { console.error(e); }
    };

    const preventScroll = (e) => {
      if (e.target === canvas) e.preventDefault();
    };
    document.body.addEventListener('touchstart', preventScroll, { passive: false });
    document.body.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      socket.close();
      document.body.removeEventListener('touchstart', preventScroll);
      document.body.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  // --- RESIZER (Runs once on mount) ---
  useLayoutEffect(() => {
    if (containerRef.current && canvasRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      
      // Re-apply styles after resize
      const ctx = canvasRef.current.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
    }
  }, []);

  // --- DRAWING LOGIC ---
  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const drawOnCanvas = (ctx, prevX, prevY, currX, currY) => {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.stroke();
  };

  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e);
    lastPos.current = { x, y };
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    
    // Draw locally
    const ctx = canvasRef.current.getContext('2d');
    drawOnCanvas(ctx, lastPos.current.x, lastPos.current.y, x, y);

    // Send to Server
    if (socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'draw',
        prevX: lastPos.current.x,
        prevY: lastPos.current.y,
        currX: x,
        currY: y
      }));
    }
    lastPos.current = { x, y };
  };

  const stopDrawing = () => setIsDrawing(false);

  const sendChat = () => {
    if (!chatInput) return;
    socketRef.current.send(JSON.stringify({ type: 'chat', message: chatInput }));
    setChatInput("");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: '#f5f5f5' }}>
      
      {/* HEADER */}
      <div style={{ padding: '10px', background: '#6200ea', color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
        Skribbl Clone
      </div>

      {/* CANVAS CONTAINER */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', background: 'white', borderBottom: '2px solid #ccc', touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          style={{ display: 'block' }} 
        />
      </div>

      {/* CHAT SECTION */}
      <div style={{ height: '35%', display: 'flex', flexDirection: 'column', background: 'white' }}>
        <div style={{ flex: 1, padding: '10px', overflowY: 'auto', fontSize: '14px' }}>
          {messages.map((msg, i) => {
             const text = typeof msg === 'string' ? msg : msg.message;
             const isSystem = typeof msg === 'object' && msg.isSystem;
             
             return (
              <div key={i} style={{ 
                marginBottom: '4px', 
                padding: '4px 8px', 
                background: isSystem ? '#d4edda' : '#eee', 
                borderRadius: '4px', 
                width: 'fit-content',
                color: isSystem ? '#155724' : 'black',
                fontWeight: isSystem ? 'bold' : 'normal'
              }}>
                {text}
              </div>
             )
          })}
        </div>
        
        <div style={{ padding: '10px', display: 'flex', gap: '5px', borderTop: '1px solid #ddd' }}>
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none', fontSize: '16px' }}
            placeholder="Guess here..."
          />
          <button 
            onClick={sendChat}
            style={{ background: '#6200ea', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontWeight: 'bold' }}
          >
            &uarr;
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;