import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';

// --- SUB-COMPONENTS (Defined OUTSIDE to prevent re-renders) ---

const Avatar = ({ name, size = 40 }) => (
  <img 
    src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4`} 
    alt={name} 
    style={{ width: size, height: size, borderRadius: '50%', border: '2px solid white' }} 
  />
);

const Leaderboard = ({ leaderboard, isMobile }) => (
  <div className="scrollable" style={{ 
    background: 'white', 
    width: isMobile ? '30%' : '240px', 
    borderRight: '1px solid #e0e0e0',
    padding: '10px',
    overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: '8px'
  }}>
    {!isMobile && <h3 className="font-game" style={{color: '#b2bec3', fontSize: '14px', marginBottom: '5px'}}>LEADERBOARD</h3>}
    {leaderboard.map((player, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', background: i === 0 ? '#fff6ce' : 'transparent' }}>
        <div style={{ fontWeight: 'bold', color: '#b2bec3', width: '20px' }}>#{i+1}</div>
        <Avatar name={player.name} size={isMobile ? 30 : 36} />
        <div style={{ flex: 1, minWidth: 0 }}>
           <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</div>
           <div style={{ fontSize: '12px', color: '#636e72' }}>{player.score} pts</div>
        </div>
      </div>
    ))}
  </div>
);

const ChatArea = ({ messages, role, chatInput, setChatInput, sendChat }) => (
  <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#f8f9fa', 
      height: '100%', 
      overflow: 'hidden', 
      position: 'relative'
  }}>
    <div className="scrollable" style={{ 
        flex: 1, 
        padding: '10px', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column-reverse',
        minHeight: 0 
    }}>
      <div style={{display:'flex', flexDirection:'column'}}>
          {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.isSystem ? 'chat-system' : 'chat-user'}`}>
              {!msg.isSystem && <span style={{fontWeight:'bold', color: 'var(--primary)', marginRight:'5px'}}>{msg.message.split(':')[0]}:</span>}
              {msg.isSystem ? msg.message : msg.message.split(':')[1]}
          </div>
          ))}
      </div>
    </div>
    
    <div className="safe-bottom" style={{ 
        padding: '8px', 
        background: 'white', 
        borderTop: '1px solid #e0e0e0', 
        display: 'flex', 
        gap: '8px',
        flexShrink: 0 
    }}>
      {role === 'guesser' ? (
        <>
          <input 
              type="text" 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && sendChat()} 
              placeholder="Type guess..." 
              style={{ 
                  borderRadius: '24px', 
                  border: '1px solid #e0e0e0', 
                  background: '#f1f2f6',
                  fontSize: '16px' 
              }} 
          />
          <button onClick={sendChat} style={{ 
              background: 'var(--primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '50%', 
              width: '42px', 
              height: '42px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 4px 6px rgba(108, 92, 231, 0.3)',
              flexShrink: 0
          }}>➜</button>
        </>
      ) : (
          <div style={{width:'100%', textAlign:'center', color:'#b2bec3', fontSize:'13px', fontStyle:'italic', padding: '10px'}}>
              It is your turn to draw!
          </div>
      )}
    </div>
  </div>
);

const Header = ({ timeLeft, wordHint, role, isMobile }) => (
  <div className="card" style={{ margin: isMobile ? '0' : '10px', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: isMobile ? '0' : '16px', background: 'white' }}>
     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="font-game" style={{ fontSize: '20px', color: 'var(--primary)', fontWeight: 'bold' }}>⏳ {timeLeft}</div>
     </div>
     <div className="font-game" style={{ fontSize: isMobile ? '18px' : '24px', letterSpacing: '4px', fontWeight: 'bold', color: '#2d3436' }}>{wordHint.toUpperCase()}</div>
     <div style={{ padding: '6px 12px', borderRadius: '20px', background: role === 'drawer' ? 'var(--accent)' : 'var(--secondary)', color: 'white', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
       {role === 'drawer' ? '✏️ DRAW' : '🤔 GUESS'}
     </div>
  </div>
);

// --- MAIN COMPONENTS ---

function Lobby() {
  const { roomId: urlRoomId } = useParams();
  const [room, setRoom] = useState(urlRoomId || "");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => { if (room && name) navigate(`/game/${room}/${name}`); };
  const createRoom = () => { setRoom(Math.random().toString(36).substring(2, 6).toUpperCase()); };

  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${name || "placeholder"}&backgroundColor=b6e3f4`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px' }}>
      <div className="card animate-pop" style={{ padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 className="font-game" style={{ fontSize: '48px', color: 'var(--primary)', marginBottom: '10px', textShadow: '2px 2px 0px #eee' }}>
          Skribbl<span style={{color:'var(--secondary)'}}>.io</span>
        </h1>
        <p style={{ color: '#636e72', marginBottom: '30px' }}>Real-time multiplayer drawing game</p>
        
        <div style={{ width: '80px', height: '80px', margin: '0 auto 20px auto', borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <img src={avatarUrl} alt="Avatar" width="100%" height="100%" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="text" placeholder="Choose a Nickname" value={name} onChange={e => setName(e.target.value)} maxLength={12} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="Room Code" value={room} onChange={e => setRoom(e.target.value.toUpperCase())} style={{ flex: 2, textTransform: 'uppercase', letterSpacing: '1px' }} />
            <button className="btn-secondary" onClick={createRoom} style={{ flex: 1 }}>Random</button>
          </div>
          <button className="btn-primary" onClick={handleJoin} style={{ marginTop: '10px' }}>PLAY GAME ➔</button>
        </div>
      </div>
    </div>
  );
}

function Game() {
  const { roomId, name } = useParams();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const socketRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [role, setRole] = useState("guesser");
  const [wordHint, setWordHint] = useState("Waiting...");
  const [timeLeft, setTimeLeft] = useState(60);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const lastPos = useRef({ x: 0, y: 0 });

  // --- LOGIC ---
  const drawOnCanvas = (ctx, prevX, prevY, currX, currY) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#2d3436';
    ctx.beginPath(); ctx.moveTo(prevX, prevY); ctx.lineTo(currX, currY); ctx.stroke();
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    const BACKEND = import.meta.env.VITE_BACKEND_URL || "ws://192.168.29.173:8000";
    const socket = new WebSocket(`${BACKEND}/ws/${roomId}/${name}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const ctx = canvasRef.current?.getContext('2d');
      switch (data.type) {
        case 'draw': if (ctx) drawOnCanvas(ctx, data.prevX, data.prevY, data.currX, data.currY); break;
        case 'new_round': 
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          setRole(data.role); setWordHint(data.word);
          setMessages(prev => [...prev, { message: `Round started! Drawer: ${data.drawer_name || "Unknown"}`, isSystem: true }]);
          break;
        case 'timer': setTimeLeft(data.time); break;
        case 'hint_update': setWordHint(data.word); break;
        case 'chat': setMessages(prev => [...prev, data]); break;
        case 'correct_guess': setMessages(prev => [...prev, { message: data.message, isSystem: true }]); setLeaderboard(data.scores); break;
        case 'game_state': setRole(data.role); setWordHint(data.word); setLeaderboard(data.scores); break;
      }
    };
    return () => { socket.close(); window.removeEventListener('resize', handleResize); };
  }, [roomId, name]);

  useLayoutEffect(() => {
    const resize = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (canvasRef.current.width !== width || canvasRef.current.height !== height) {
           canvasRef.current.width = width; canvasRef.current.height = height;
        }
      }
    };
    resize(); window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };
  
  const startDrawing = (e) => {
    if (role === 'guesser') return;
    const { x, y } = getCoordinates(e);
    lastPos.current = { x, y };
  };

  const draw = (e) => {
    if (role === 'guesser') return;
    if (e.buttons !== 1 && !e.touches) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    drawOnCanvas(ctx, lastPos.current.x, lastPos.current.y, x, y);
    if (socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'draw', prevX: lastPos.current.x, prevY: lastPos.current.y, currX: x, currY: y }));
    }
    lastPos.current = { x, y };
  };

  const sendChat = () => {
    if (!chatInput) return;
    socketRef.current.send(JSON.stringify({ type: 'chat', message: chatInput }));
    setChatInput("");
  };

  // --- RENDER ---
  return (
    <div style={{ display: 'flex', height: '100%', width: '100vw', flexDirection: isMobile ? 'column' : 'row' }}>
      
      {!isMobile && <Leaderboard leaderboard={leaderboard} isMobile={isMobile} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        <Header timeLeft={timeLeft} wordHint={wordHint} role={role} isMobile={isMobile} />

        {/* CANVAS */}
        <div ref={containerRef} style={{ flex: isMobile ? 'none' : 1, height: isMobile ? '50%' : 'auto', position: 'relative', margin: isMobile ? '0' : '0 10px 10px 0', background: 'white', borderRadius: isMobile ? '0' : '16px', boxShadow: isMobile ? 'none' : 'var(--shadow-sm)', overflow: 'hidden' }}>
           <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onTouchStart={startDrawing} onTouchMove={draw} style={{ display: 'block', width: '100%', height: '100%', cursor: role === 'drawer' ? 'crosshair' : 'not-allowed' }} />
           {role === 'guesser' && <div className="font-game" style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', color:'rgba(0,0,0,0.05)', fontSize:'40px', fontWeight:'bold', pointerEvents:'none'}}>GUESSING</div>}
        </div>

        {/* BOTTOM SPLIT */}
        <div style={{ flex: isMobile ? 1 : 'none', height: isMobile ? '50%' : '30%', display: 'flex', flexDirection: 'row', background: 'white', borderTop: '1px solid #e0e0e0' }}>
           {isMobile && <Leaderboard leaderboard={leaderboard} isMobile={isMobile} />}
           <ChatArea messages={messages} role={role} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} />
        </div>
      </div>
    </div>
  );
}

function App() { return <BrowserRouter><Routes><Route path="/" element={<Lobby />} /><Route path="/room/:roomId" element={<Lobby />} /><Route path="/game/:roomId/:name" element={<Game />} /></Routes></BrowserRouter>; }

export default App;