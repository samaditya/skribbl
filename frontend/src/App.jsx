import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';

// --- ICONS ---
const Icons = {
  Pencil: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Bucket: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  Undo: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>,
  Trash: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Send: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Clock: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Settings: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Trophy: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  X: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Globe: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Refresh: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  List: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  Puzzle: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>,
  Question: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Link: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
};

// --- COMPONENTS ---

const Avatar = ({ name }) => (
  <img 
    src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${name}&backgroundColor=transparent`} 
    alt={name} 
    className="w-10 h-10 rounded-full bg-white border-2 border-gray-300"
  />
);

const Leaderboard = ({ leaderboard }) => (
  <div className="flex-1 flex flex-col overflow-hidden bg-[#3B5BDB] text-white">
    <div className="flex-1 overflow-y-auto no-scrollbar">
      {leaderboard.map((player, i) => (
        <div key={i} className={`flex items-center gap-2 p-2 border-b border-blue-400/30 ${i % 2 === 0 ? 'bg-blue-600/10' : ''}`}>
          <div className="font-bold text-lg w-6">#{i+1}</div>
          <div className="flex-1 min-w-0 flex flex-col">
             <div className="font-bold text-sm truncate flex items-center gap-2">
                {player.name}
             </div>
             <div className="text-xs text-blue-200">{player.score} points</div>
          </div>
          <Avatar name={player.name} />
        </div>
      ))}
    </div>
  </div>
);

const ChatLog = ({ messages }) => {
  const reversedMessages = [...messages].reverse();
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative border-l border-gray-300">
      <div className="flex-1 overflow-y-auto flex flex-col-reverse p-1 space-y-1 space-y-reverse min-h-0 w-full text-sm font-sans">
          {reversedMessages.map((msg, i) => {
            const isSystem = msg.isSystem;
            const isCorrect = isSystem && msg.message.includes('guessed');
            const isLeft = isSystem && msg.message.includes('left');
            const isJoin = isSystem && msg.message.includes('joined');
            
            return (
              <div key={i} className={`px-2 py-0.5 break-words text-[13px] ${
                isCorrect ? 'bg-green-100 text-green-700 font-bold' : 
                isLeft ? 'text-red-500 font-bold' :
                isJoin ? 'text-blue-500 font-bold' :
                isSystem ? 'text-gray-500 font-bold' : 
                'text-black'
              }`}>
                  {!isSystem && <span className="font-bold text-black mr-1">{msg.message.split(':')[0]}:</span>}
                  <span>{isSystem ? msg.message : msg.message.split(':')[1]}</span>
              </div>
            )
          })}
      </div>
    </div>
  );
};

const Header = ({ timeLeft, wordHint, isWaiting }) => (
  <div className="bg-white border-b-4 border-gray-200 flex justify-between items-center px-2 py-1 shrink-0 h-14 z-20">
     {/* LEFT: Timer */}
     <div className="flex flex-col items-center w-16">
        <div className="relative flex items-center justify-center">
            <Icons.Clock />
            <span className="absolute text-xs font-bold pt-1">{timeLeft}</span>
        </div>
        <span className="text-[9px] text-gray-500 font-bold">Round 1 of 3</span>
     </div>
     
     {/* CENTER: Word/Waiting */}
     <div className="flex flex-col items-center flex-1 text-center">
        {isWaiting ? (
            <span className="font-bold text-gray-400 text-xs tracking-widest uppercase">WAITING FOR HOST</span>
        ) : (
            <>
                <span className="text-[10px] font-bold text-gray-400 tracking-widest">GUESS THIS</span>
                <div className="font-mono text-xl md:text-2xl font-bold text-black tracking-[0.3em] uppercase">
                    {wordHint}
                </div>
            </>
        )}
     </div>

     {/* RIGHT: Settings */}
     <div className="w-16 flex justify-end">
        <button className="text-gray-600 hover:text-gray-900"><Icons.Settings /></button>
     </div>
  </div>
);

const InputBar = ({ chatInput, setChatInput, sendChat, role, isWaiting }) => (
  <div className="flex-none bg-white border-t-2 border-gray-300 p-2 z-30 pb-safe w-full">
    {(role === 'guesser' || isWaiting) ? (
      <div className="relative flex items-center gap-2 max-w-2xl mx-auto">
        <input 
          type="text" 
          value={chatInput} 
          onChange={e => setChatInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && sendChat()} 
          placeholder="Type your guess here..." 
          className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-center font-medium" 
        />
        <button onClick={sendChat} className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all hover:bg-indigo-700">
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
  <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
    <div className="bg-white p-6 rounded-3xl shadow-2xl text-center w-full max-w-md animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)] border-4 border-indigo-100">
      <h2 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-wide">Choose a Word</h2>
      <div className="flex flex-col gap-3">
        {words.map((word) => (
          <button 
            key={word} 
            onClick={() => onSelect(word)}
            className="group relative overflow-hidden bg-slate-50 hover:bg-indigo-50 border-2 border-slate-100 hover:border-indigo-500 font-bold py-4 rounded-xl text-lg capitalize transition-all duration-200 text-slate-600 hover:text-indigo-700"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// --- SETTINGS PANEL (LOBBY STATE) ---
const SettingRow = ({ icon, label, children }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="text-gray-400 w-6 flex justify-center">{icon}</div>
    <div className="flex-1 text-left text-xs font-bold text-white/90 uppercase tracking-wide">{label}</div>
    <div className="w-24 md:w-32">{children}</div>
  </div>
);

const SettingsPanel = ({ onStart, onInvite }) => {
    return (
        <div className="absolute inset-0 bg-slate-700 flex flex-col p-4 overflow-y-auto z-10">
            <div className="max-w-2xl mx-auto w-full flex flex-col h-full">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4 flex-1 overflow-y-auto no-scrollbar">
                    <SettingRow icon={<Icons.Pencil />} label="Players">
                        <select className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded font-bold text-gray-800 focus:outline-none"><option>8</option><option>4</option><option>12</option></select>
                    </SettingRow>
                    <SettingRow icon={<Icons.Globe />} label="Language">
                        <select className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded font-bold text-gray-800 focus:outline-none"><option>English</option><option>Spanish</option></select>
                    </SettingRow>
                    <SettingRow icon={<Icons.Clock />} label="Drawtime">
                        <select className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded font-bold text-gray-800 focus:outline-none"><option>80</option><option>60</option><option>40</option></select>
                    </SettingRow>
                    <SettingRow icon={<Icons.Bucket />} label="Rounds">
                        <select className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded font-bold text-gray-800 focus:outline-none"><option>3</option><option>5</option><option>10</option></select>
                    </SettingRow>
                    <SettingRow icon={<Icons.List />} label="Words">
                        <select className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded font-bold text-gray-800 focus:outline-none"><option>3</option><option>2</option><option>4</option></select>
                    </SettingRow>
                    <SettingRow icon={<Icons.Question />} label="Hints">
                        <select className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded font-bold text-gray-800 focus:outline-none"><option>2</option><option>1</option><option>0</option></select>
                    </SettingRow>
                    
                    <div className="col-span-2 mt-2">
                        <div className="flex justify-between text-gray-300 text-xs font-bold mb-1 uppercase tracking-wide px-1">
                            <span>Custom words</span>
                            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                                <input type="checkbox" className="rounded text-indigo-500 focus:ring-0 border-slate-500 bg-slate-600" /> Custom only
                            </label>
                        </div>
                        <textarea 
                            className="w-full p-2 bg-white rounded border border-slate-200 resize-none text-xs text-black placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 transition-all h-20" 
                            placeholder="Type words separated by commas..." 
                        />
                    </div>
                </div>

                <div className="flex gap-3 h-12 shrink-0 mt-2">
                    <button onClick={onStart} className="flex-[2] bg-[#4ADE80] hover:bg-[#22c55e] text-white font-black text-lg rounded shadow-[0_4px_0_#15803d] active:shadow-none active:translate-y-1 transition-all uppercase tracking-wider">
                        Start!
                    </button>
                    <button onClick={onInvite} className="flex-1 bg-[#3B82F6] hover:bg-[#2563eb] text-white font-bold text-lg rounded shadow-[0_4px_0_#1d4ed8] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2">
                        <Icons.Link /> Invite
                    </button>
                </div>
            </div>
        </div>
    )
}

// --- MAIN PAGES ---

function Lobby() {
  const { roomId: urlRoomId } = useParams();
  const [room, setRoom] = useState(urlRoomId || "");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const handleJoin = () => { if (room && name) navigate(`/game/${room}/${name}`); };
  const createRoom = () => { setRoom(Math.random().toString(36).substring(2, 6).toUpperCase()); };
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${name || "placeholder"}`;

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#3B5BDB] p-4 relative overflow-hidden">
      <div className="bg-white p-8 rounded-lg shadow-[0_8px_0_rgba(0,0,0,0.2)] w-full max-w-sm text-center border-4 border-black relative z-10">
        <h1 className="font-sans text-5xl font-black text-[#3B5BDB] mb-6 tracking-tight">Skribbl Clone</h1>
        
        <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-white border-4 border-gray-200 overflow-hidden">
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        </div>

        <div className="space-y-4">
          <input type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} maxLength={12} className="w-full bg-gray-100 border-2 border-gray-300 rounded px-4 py-3 text-center font-bold text-lg focus:border-blue-500 outline-none" />
          <div className="flex gap-2">
              <input type="text" placeholder="CODE" value={room} onChange={e => setRoom(e.target.value.toUpperCase())} className="flex-[2] bg-gray-100 border-2 border-gray-300 rounded px-4 py-3 text-center font-bold text-lg tracking-widest uppercase focus:border-blue-500 outline-none" />
              <button onClick={createRoom} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded shadow-[0_4px_0_rgb(200,150,0)] active:shadow-none active:translate-y-1 transition-all">Random</button>
          </div>
          <button onClick={handleJoin} className="w-full bg-green-500 hover:bg-green-600 text-white font-black text-xl py-4 rounded shadow-[0_4px_0_rgb(20,150,50)] active:shadow-none active:translate-y-1 transition-all uppercase tracking-widest mt-2">
             Play!
          </button>
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
  const [wordHint, setWordHint] = useState("Loading...");
  const [timeLeft, setTimeLeft] = useState(60);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const lastPos = useRef({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedTool, setSelectedTool] = useState("pencil");
  const COLORS = ["#000000", "#ef4444", "#22c55e", "#3b82f6", "#eab308", "#a855f7", "#ec4899", "#ffffff"];
  const [wordChoices, setWordChoices] = useState([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const currentStrokeId = useRef(null);

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
    const BACKEND = "ws://192.168.29.52:8000";
    const socket = new WebSocket(BACKEND + `/ws/${roomId}/${name}`);
    socketRef.current = socket;

    const connect = () => {
        if (socket.readyState === 1) return;
        // Reconnection logic could go here
    }

    socket.onopen = () => console.log("Connected");
    socket.onclose = () => console.log("Disconnected");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
      switch (data.type) {
        case 'draw': if (ctx) drawOnCanvas(ctx, data.prevX, data.prevY, data.currX, data.currY, data.color); break;
        case 'fill': 
            const dpr = window.devicePixelRatio || 1;
            if (ctx) floodFill(ctx, Math.floor(data.x * dpr), Math.floor(data.y * dpr), data.color); 
            break;
        case 'clear': if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); break;
        case 'redraw': 
            if (ctx) { 
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); 
                data.history.forEach(a => {
                    if (a.type === 'draw') drawOnCanvas(ctx, a.prevX, a.prevY, a.currX, a.currY, a.color);
                    else if (a.type === 'fill') {
                        const dpr = window.devicePixelRatio || 1;
                        floodFill(ctx, Math.floor(a.x * dpr), Math.floor(a.y * dpr), a.color);
                    }
                }); 
            } break;
        case 'new_round': 
          setIsGameStarted(true);
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); 
          setRole(data.role); setWordHint(data.word); setWordChoices([]); 
          setMessages(p => [...p, { message: `New Round! Drawer: ${data.drawer_name || "?"}`, isSystem: true }]); if (data.role === 'drawer') playSound('turn'); 
          break;
        case 'choose_word': setWordChoices(data.words); setIsGameStarted(true); break;
        case 'choosing': setWordHint("Choosing..."); setIsGameStarted(true); setMessages(p => [...p, { message: data.message, isSystem: true }]); break;
        case 'timer': setTimeLeft(data.time); break;
        case 'hint_update': setWordHint(data.word); break;
        case 'chat': setMessages(p => [...p, data]); break;
        case 'correct_guess': setMessages(p => [...p, { message: data.message, isSystem: true }]); setLeaderboard(data.scores); playSound('win'); confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); break;
        case 'game_state': 
            setRole(data.role); 
            setWordHint(data.word); 
            setLeaderboard(data.scores);
            if (data.word && data.word !== "Waiting...") setIsGameStarted(true);
            break;
      }
    };
    
    return () => {
        if (socket.readyState === 1) socket.close();
        window.removeEventListener('resize', handleResize);
    };
  }, [roomId, name]);

  useLayoutEffect(() => {
    const resize = () => {
      if (containerRef.current && canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const rect = containerRef.current.getBoundingClientRect();
        
        // Only resize if actually changed to prevent mobile url bar jank
        if (canvasRef.current.width !== rect.width * dpr || canvasRef.current.height !== rect.height * dpr) {
            canvasRef.current.width = rect.width * dpr;
            canvasRef.current.height = rect.height * dpr;
            
            const ctx = canvasRef.current.getContext('2d');
            ctx.scale(dpr, dpr);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
      }
    };
    resize(); window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getCoordinates = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX; const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - r.left, y: cy - r.top };
  };
  
  const handleStart = (e) => {
    if (role === 'guesser') return;
    const { x, y } = getCoordinates(e);
    currentStrokeId.current = Date.now().toString() + Math.random().toString();

    if (selectedTool === 'bucket') {
      const dpr = window.devicePixelRatio || 1;
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      floodFill(ctx, Math.floor(x * dpr), Math.floor(y * dpr), selectedColor);
      if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'fill', x, y, color: selectedColor, strokeId: currentStrokeId.current }));
      }
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
    
    if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ 
            type: 'draw', 
            prevX: lastPos.current.x, 
            prevY: lastPos.current.y, 
            currX: x, 
            currY: y, 
            color: selectedColor,
            strokeId: currentStrokeId.current 
        }));
    }
    lastPos.current = { x, y };
  };

  const clearCanvas = () => socketRef.current?.send(JSON.stringify({ type: 'clear' }));
  const undoCanvas = () => socketRef.current?.send(JSON.stringify({ type: 'undo' }));
  const sendChat = () => { if (!chatInput) return; socketRef.current.send(JSON.stringify({ type: 'chat', message: chatInput })); setChatInput(""); };
  const selectWord = (word) => { socketRef.current.send(JSON.stringify({ type: 'word_select', word })); setWordChoices([]); }
  
  const handleInvite = () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      alert("Invite link copied!");
  }

  const handleStartGame = () => {
      setIsGameStarted(true); 
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 font-sans">
      <Header timeLeft={timeLeft} wordHint={wordHint} role={role} isWaiting={!isGameStarted} />

      <div className="flex-1 relative bg-white border-b-4 border-slate-200">
         
         {isGameStarted ? (
             <>
                <div ref={containerRef} className="absolute inset-0 m-2 bg-white cursor-crosshair touch-none">
                    <canvas ref={canvasRef} onMouseDown={handleStart} onMouseMove={handleMove} onTouchStart={handleStart} onTouchMove={handleMove} className="block w-full h-full" />
                </div>
                {role === 'drawer' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-3 py-2 rounded-2xl shadow-xl border border-slate-200 flex flex-col gap-2 items-center z-10 w-[95%] max-w-md">
                    <div className="flex flex-wrap gap-1.5 justify-center">
                        {COLORS.map(c => ( <div key={c} onClick={() => { setSelectedColor(c); setSelectedTool('pencil'); }} className={`w-6 h-6 rounded-full cursor-pointer ring-2 ring-offset-1 transition-all ${selectedColor === c ? 'ring-slate-800 scale-110' : 'ring-transparent hover:scale-105'}`} style={{ backgroundColor: c }} /> ))}
                    </div>
                    <div className="w-full h-px bg-slate-200"></div>
                    <div className="flex gap-4 text-slate-500">
                        <button onClick={() => setSelectedTool('pencil')} className={`p-2 rounded-xl transition-colors ${selectedTool === 'pencil' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50'}`}><Icons.Pencil /></button>
                        <button onClick={() => setSelectedTool('bucket')} className={`p-2 rounded-xl transition-colors ${selectedTool === 'bucket' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50'}`}><Icons.Bucket /></button>
                        <button onClick={undoCanvas} className="p-2 rounded-xl hover:bg-slate-50 hover:text-slate-700"><Icons.Undo /></button>
                        <button onClick={clearCanvas} className="p-2 rounded-xl hover:bg-rose-50 hover:text-rose-500"><Icons.Trash /></button>
                    </div>
                </div>
                )}
                {wordChoices.length > 0 && <WordSelector words={wordChoices} onSelect={selectWord} />}
             </>
         ) : (
             <SettingsPanel onStart={handleStartGame} onInvite={handleInvite} />
         )}
      </div>

      <div className="h-[35%] flex flex-row bg-white border-t border-slate-300">
         <div className="w-[30%] h-full border-r border-slate-300 bg-slate-50 flex flex-col"><Leaderboard leaderboard={leaderboard} /></div>
         <div className="flex-1 h-full flex flex-col min-w-0"><ChatLog messages={messages} /></div>
      </div>

      <InputBar chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} role={role} isWaiting={!isGameStarted} />
    </div>
  );
}

function App() { return <BrowserRouter><Routes><Route path="/" element={<Lobby />} /><Route path="/room/:roomId" element={<Lobby />} /><Route path="/game/:roomId/:name" element={<Game />} /></Routes></BrowserRouter>; }

export default App;