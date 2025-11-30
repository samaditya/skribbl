import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';

// --- ICONS (Minimalist & Rounded) ---
const Icons = {
  Pencil: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Bucket: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  Undo: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>,
  Trash: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Send: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Clock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Trophy: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
};

// --- UI COMPONENTS ---

const Avatar = ({ name, className }) => (
  <div className={`relative rounded-2xl overflow-hidden bg-indigo-100 shadow-inner ${className}`}>
    <img 
      src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${name}&backgroundColor=transparent`} 
      alt={name} 
      className="w-full h-full object-cover"
    />
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-xl border border-slate-200 ${className}`}>
    {children}
  </div>
);

// --- GAME SECTIONS ---

const Leaderboard = ({ leaderboard }) => (
  <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 border-r border-slate-200">
    <div className="p-3 bg-white border-b border-slate-100">
      <h3 className="font-sans font-bold text-xs text-slate-400 uppercase tracking-widest text-center">Rankings</h3>
    </div>
    <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
      {leaderboard.map((player, i) => (
        <div key={i} className={`flex items-center gap-3 p-2 rounded-xl transition-all ${i === 0 ? 'bg-yellow-50 border border-yellow-100 shadow-sm' : 'hover:bg-white'}`}>
          <div className={`font-sans font-bold text-sm w-6 text-center ${i === 0 ? 'text-yellow-600' : 'text-slate-400'}`}>#{i+1}</div>
          <Avatar name={player.name} className="w-8 h-8" />
          <div className="flex-1 min-w-0">
             <div className="font-bold text-sm text-slate-700 truncate">{player.name}</div>
             <div className="text-[10px] font-medium text-slate-400">{player.score} pts</div>
          </div>
          {i === 0 && <span className="text-yellow-400"><Icons.Trophy /></span>}
        </div>
      ))}
    </div>
  </div>
);

const ChatLog = ({ messages }) => {
  const reversedMessages = [...messages].reverse();
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
      <div className="flex-1 overflow-y-auto flex flex-col-reverse p-4 space-y-3 space-y-reverse min-h-0 w-full">
          {reversedMessages.map((msg, i) => {
            const isSystem = msg.isSystem;
            const isCorrect = isSystem && msg.message.includes('guessed');
            
            if (isSystem) {
              return (
                <div key={i} className={`text-center text-xs font-bold py-1 px-3 rounded-full self-center animate-fade-in-up ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {msg.message}
                </div>
              )
            }

            const [author, ...textParts] = msg.message.split(':');
            const text = textParts.join(':');

            return (
              <div key={i} className="flex flex-col animate-fade-in-up">
                 <span className="text-[10px] font-bold text-slate-400 ml-1 mb-0.5">{author}</span>
                 <div className="bg-slate-50 px-3 py-2 rounded-2xl rounded-tl-none text-sm text-slate-700 break-words shadow-sm border border-slate-100">
                    {text}
                 </div>
              </div>
            )
          })}
      </div>
    </div>
  );
};

const Header = ({ timeLeft, wordHint, role }) => (
  <div className="flex justify-between items-center px-4 py-3 shrink-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
     {/* Timer */}
     <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100">
        <Icons.Clock />
        <span className="font-sans font-bold text-lg tabular-nums">{timeLeft}</span>
     </div>
     
     {/* Word Hint */}
     <div className="flex flex-col items-center flex-1 mx-4">
        <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-1">Guess This</span>
        <div className="font-mono text-xl md:text-2xl font-bold text-slate-900 tracking-[0.3em] bg-slate-100 px-4 py-1 rounded-lg border border-slate-200 shadow-inner">
            {wordHint}
        </div>
     </div>

     {/* Role Badge */}
     <div className={`px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md tracking-wider ${role === 'drawer' ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-slate-400'}`}>
       {role === 'drawer' ? 'DRAWING' : 'GUESSING'}
     </div>
  </div>
);

const InputBar = ({ chatInput, setChatInput, sendChat, role }) => (
  <div className="flex-none bg-white border-t border-slate-200 p-3 z-30 pb-safe w-full shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
    {role === 'guesser' ? (
      <div className="relative flex items-center gap-2 max-w-2xl mx-auto">
        <input 
          type="text" 
          value={chatInput} 
          onChange={e => setChatInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && sendChat()} 
          placeholder="Type your guess here..." 
          className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400" 
        />
        <button onClick={sendChat} className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all">
          <Icons.Send />
        </button>
      </div>
    ) : (
        <div className="w-full text-center p-3 text-sm font-bold text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 select-none">
            It's your turn to draw! Check the canvas.
        </div>
    )}
  </div>
);

const WordSelector = ({ words, onSelect }) => (
  <div className="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
    <Card className="p-6 w-full max-w-md text-center border-4 border-indigo-100">
      <h2 className="font-sans text-2xl font-bold text-slate-800 mb-6">Choose a Word</h2>
      <div className="grid grid-cols-1 gap-3">
        {words.map((word) => (
          <button 
            key={word} 
            onClick={() => onSelect(word)}
            className="group relative overflow-hidden bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-500 font-bold py-4 rounded-xl text-lg capitalize transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <span className="relative z-10 text-slate-600 group-hover:text-indigo-700">{word}</span>
          </button>
        ))}
      </div>
    </Card>
  </div>
);

// --- PAGES ---

function Lobby() {
  const { roomId: urlRoomId } = useParams();
  const [room, setRoom] = useState(urlRoomId || "");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const handleJoin = () => { if (room && name) navigate(`/game/${room}/${name}`); };
  const createRoom = () => { setRoom(Math.random().toString(36).substring(2, 6).toUpperCase()); };
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${name || "placeholder"}`;

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6 relative overflow-hidden">
      {/* Abstract Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>

      <Card className="p-8 w-full max-w-sm text-center relative z-10 border-t-4 border-t-indigo-500">
        <div className="mb-8">
          <h1 className="font-sans text-5xl font-black text-slate-900 tracking-tight mb-2">Skribbl<span className="text-indigo-600">.io</span></h1>
          <p className="text-slate-400 font-medium text-sm uppercase tracking-widest">Reimagined</p>
        </div>
        
        <div className="mx-auto w-24 h-24 mb-6 relative group">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <img src={avatarUrl} alt="Avatar" className="relative w-full h-full rounded-full border-4 border-white shadow-xl object-cover bg-indigo-50" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nickname</label>
            <input type="text" placeholder="e.g. Picasso" value={name} onChange={e => setName(e.target.value)} maxLength={12} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all placeholder:font-normal" />
          </div>
          
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Room Code</label>
            <div className="flex gap-2">
              <input type="text" placeholder="CODE" value={room} onChange={e => setRoom(e.target.value.toUpperCase())} className="flex-[2] bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-800 tracking-widest uppercase focus:border-indigo-500 outline-none transition-all" />
              <button onClick={createRoom} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all active:scale-95 border-2 border-transparent hover:border-slate-300">🎲</button>
            </div>
          </div>

          <button onClick={handleJoin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-all uppercase tracking-wider text-sm mt-4">
            Enter Game
          </button>
        </div>
      </Card>
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
  const [wordHint, setWordHint] = useState("Loading...");
  const [timeLeft, setTimeLeft] = useState(60);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const lastPos = useRef({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedTool, setSelectedTool] = useState("pencil");
  const COLORS = ["#000000", "#ef4444", "#22c55e", "#3b82f6", "#eab308", "#a855f7", "#ec4899", "#ffffff"];
  const [wordChoices, setWordChoices] = useState([]);

  const playSound = (type) => {
    const sounds = { win: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', turn: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3' };
    const audio = new Audio(sounds[type]); audio.volume = 0.5; audio.play().catch(() => {});
  };

  const drawOnCanvas = (ctx, prevX, prevY, currX, currY, color) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(prevX, prevY); ctx.lineTo(currX, currY); ctx.stroke();
  };

  const floodFill = (ctx, startX, startY, fillColor) => {
    const w = ctx.canvas.width; const h = ctx.canvas.height;
    const img = ctx.getImageData(0, 0, w, h); const data = img.data;
    const rFill = parseInt(fillColor.slice(1, 3), 16); const gFill = parseInt(fillColor.slice(3, 5), 16); const bFill = parseInt(fillColor.slice(5, 7), 16);
    const startPos = (startY * w + startX) * 4;
    const rT = data[startPos]; const gT = data[startPos+1]; const bT = data[startPos+2];
    if (rT === rFill && gT === gFill && bT === bFill) return;
    const q = [[startX, startY]];
    const match = (pos) => data[pos] === rT && data[pos+1] === gT && data[pos+2] === bT;
    const color = (pos) => { data[pos] = rFill; data[pos+1] = gFill; data[pos+2] = bFill; data[pos+3] = 255; };
    while (q.length) {
      const [x, y] = q.shift(); const pos = (y * w + x) * 4;
      if (match(pos)) { color(pos); if (x>0) q.push([x-1, y]); if (x<w-1) q.push([x+1, y]); if (y>0) q.push([x, y-1]); if (y<h-1) q.push([x, y+1]); }
    }
    ctx.putImageData(img, 0, 0);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    // FIXED: Removed import.meta to prevent build errors
    const BACKEND = "ws://192.168.29.52:8000"; 
    const socket = new WebSocket(`${BACKEND}/ws/${roomId}/${name}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
      switch (data.type) {
        case 'draw': if (ctx) drawOnCanvas(ctx, data.prevX, data.prevY, data.currX, data.currY, data.color); break;
        case 'fill': if (ctx) floodFill(ctx, Math.floor(data.x), Math.floor(data.y), data.color); break;
        case 'clear': if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); break;
        case 'redraw': if (ctx) { ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); data.history.forEach(a => a.type === 'draw' ? drawOnCanvas(ctx, a.prevX, a.prevY, a.currX, a.currY, a.color) : floodFill(ctx, Math.floor(a.x), Math.floor(a.y), a.color)); } break;
        case 'new_round': 
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); 
          setRole(data.role); setWordHint(data.word); setWordChoices([]); 
          setMessages(p => [...p, { message: `New Round! Drawer: ${data.drawer_name || "?"}`, isSystem: true }]); if (data.role === 'drawer') playSound('turn'); 
          break;
        case 'choose_word': setWordChoices(data.words); break;
        case 'choosing': setWordHint("Choosing..."); setMessages(p => [...p, { message: data.message, isSystem: true }]); break;
        case 'timer': setTimeLeft(data.time); break;
        case 'hint_update': setWordHint(data.word); break;
        case 'chat': setMessages(p => [...p, data]); break;
        case 'correct_guess': setMessages(p => [...p, { message: data.message, isSystem: true }]); setLeaderboard(data.scores); playSound('win'); confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); break;
        case 'game_state': setRole(data.role); setWordHint(data.word); setLeaderboard(data.scores); break;
      }
    };
    return () => { socket.close(); window.removeEventListener('resize', handleResize); };
  }, [roomId, name]);

  useLayoutEffect(() => {
    const resize = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (Math.abs(canvasRef.current.width - width) > 5 || Math.abs(canvasRef.current.height - height) > 5) {
           canvasRef.current.width = width; canvasRef.current.height = height;
        }
      }
    };
    resize(); window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getCoordinates = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const sx = canvasRef.current.width / r.width; const sy = canvasRef.current.height / r.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX; const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - r.left) * sx, y: (cy - r.top) * sy };
  };
  
  const handleStart = (e) => {
    if (role === 'guesser') return;
    const { x, y } = getCoordinates(e);
    if (selectedTool === 'bucket') {
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      floodFill(ctx, Math.floor(x), Math.floor(y), selectedColor);
      if (socketRef.current.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: 'fill', x, y, color: selectedColor }));
      return;
    }
    lastPos.current = { x, y };
  };

  const handleMove = (e) => {
    if (role === 'guesser' || selectedTool === 'bucket') return;
    if (e.buttons !== 1 && !e.touches) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    drawOnCanvas(ctx, lastPos.current.x, lastPos.current.y, x, y, selectedColor);
    if (socketRef.current.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: 'draw', prevX: lastPos.current.x, prevY: lastPos.current.y, currX: x, currY: y, color: selectedColor }));
    lastPos.current = { x, y };
  };

  const clearCanvas = () => socketRef.current?.send(JSON.stringify({ type: 'clear' }));
  const undoCanvas = () => socketRef.current?.send(JSON.stringify({ type: 'undo' }));
  const sendChat = () => { if (!chatInput) return; socketRef.current.send(JSON.stringify({ type: 'chat', message: chatInput })); setChatInput(""); };
  const selectWord = (word) => { socketRef.current.send(JSON.stringify({ type: 'word_select', word })); setWordChoices([]); }

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 font-sans">
      <Header timeLeft={timeLeft} wordHint={wordHint} role={role} />

      <div className="flex-1 relative bg-white m-2 md:m-4 rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
         <div ref={containerRef} className="absolute inset-0 bg-white cursor-crosshair touch-none">
            <canvas ref={canvasRef} onMouseDown={handleStart} onMouseMove={handleMove} onTouchStart={handleStart} onTouchMove={handleMove} className="block w-full h-full" />
         </div>
         {role === 'drawer' && (
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-3 py-2 rounded-2xl shadow-xl border border-slate-100 flex gap-4 items-center overflow-x-auto max-w-[90%] no-scrollbar z-10">
              <div className="flex gap-2">
                {COLORS.map(c => ( <div key={c} onClick={() => { setSelectedColor(c); setSelectedTool('pencil'); }} className={`w-6 h-6 rounded-full cursor-pointer ring-2 ring-offset-1 transition-all ${selectedColor === c ? 'ring-slate-800 scale-110' : 'ring-transparent hover:scale-105'}`} style={{ backgroundColor: c }} /> ))}
              </div>
              <div className="w-px h-6 bg-slate-200"></div>
              <div className="flex gap-1 text-slate-500">
                <button onClick={() => setSelectedTool('pencil')} className={`p-2 rounded-xl transition-colors ${selectedTool === 'pencil' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50'}`}><Icons.Pencil /></button>
                <button onClick={() => setSelectedTool('bucket')} className={`p-2 rounded-xl transition-colors ${selectedTool === 'bucket' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50'}`}><Icons.Bucket /></button>
                <button onClick={undoCanvas} className="p-2 rounded-xl hover:bg-slate-50 hover:text-slate-700"><Icons.Undo /></button>
                <button onClick={clearCanvas} className="p-2 rounded-xl hover:bg-rose-50 hover:text-rose-500"><Icons.Trash /></button>
              </div>
           </div>
         )}
         {wordChoices.length > 0 && <WordSelector words={wordChoices} onSelect={selectWord} />}
      </div>

      <div className="h-[35%] flex flex-row gap-2 md:gap-4 px-2 md:px-4 mb-0">
         <div className="w-[30%] h-full rounded-t-2xl overflow-hidden shadow-sm"><Leaderboard leaderboard={leaderboard} /></div>
         <div className="flex-1 h-full rounded-t-2xl overflow-hidden shadow-sm"><ChatLog messages={messages} /></div>
      </div>

      <InputBar chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} role={role} />
    </div>
  );
}

function App() { return <BrowserRouter><Routes><Route path="/" element={<Lobby />} /><Route path="/room/:roomId" element={<Lobby />} /><Route path="/game/:roomId/:name" element={<Game />} /></Routes></BrowserRouter>; }

export default App;