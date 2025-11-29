// frontend/src/App.jsx
import { useEffect, useRef, useState } from 'react';

function App() {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // We need to keep track of where the mouse WAS to draw a line to where it IS
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // 1. Connect to Backend
    const socket = new WebSocket("ws://localhost:8000/ws");
    socketRef.current = socket;

    // 2. Setup the Canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Make lines look nice
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'black';

    // 3. Listen for Drawing Events from OTHER players
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // If the message contains drawing coordinates, draw them!
        if (data.type === 'draw') {
          drawOnCanvas(ctx, data.prevX, data.prevY, data.currX, data.currY);
        }
      } catch (e) {
        // Ignore non-JSON messages (like "User joined")
        console.log("Received non-drawing message:", event.data);
      }
    };

    return () => socket.close();
  }, []);

  // Helper function: Draws a line from A to B
  const drawOnCanvas = (ctx, prevX, prevY, currX, currY) => {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.stroke();
  };

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    // Save starting point
    lastPos.current = { x: offsetX, y: offsetY };
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = nativeEvent;
    const currX = offsetX;
    const currY = offsetY;
    const prevX = lastPos.current.x;
    const prevY = lastPos.current.y;

    // 1. Draw locally (so it feels instant for YOU)
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    drawOnCanvas(ctx, prevX, prevY, currX, currY);

    // 2. Send the coordinates to the Server
    if (socketRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type: 'draw',
        prevX,
        prevY,
        currX,
        currY
      });
      socketRef.current.send(message);
    }

    // 3. Update last position for the next loop
    lastPos.current = { x: currX, y: currY };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h1>Skribbl Clone: Drawing Board</h1>
      <p>Open this URL in a second tab to see magic.</p>
      
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '2px solid #000', cursor: 'crosshair', background: '#fff' }}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onMouseLeave={stopDrawing} // Stop drawing if mouse leaves the box
      />
    </div>
  );
}

export default App;