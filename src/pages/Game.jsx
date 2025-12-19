import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import api from '../services/api';

const COLS = "ABCDEFGHJKLMNOPQRST"; 

// --- CẤU HÌNH THỜI GIAN (Giây) ---
const TIME_CONFIG = {
    // ⚡️ BÀN 9x9: 10 giây suy nghĩ (Siêu tốc), Tổng 5 phút
    9:  { turn: 10, total: 300 },   
    
    // 🐢 BÀN 13x13: 30 giây suy nghĩ, Tổng 15 phút
    13: { turn: 30, total: 900 },  
    
    // 🧠 BÀN 19x19: 60 giây suy nghĩ, Tổng 45 phút
    19: { turn: 60, total: 2700 }   
};

const Game = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ws = useRef(null);

  const mode = params.get('mode'); 
  const size = parseInt(params.get('size')) || 9;
  const difficulty = params.get('diff') || 'medium';

  const [grid, setGrid] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [status, setStatus] = useState("Đang khởi tạo...");
  const [logs, setLogs] = useState([]);
  const [hint, setHint] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [myColor, setMyColor] = useState(1);
  const [turn, setTurn] = useState(1); // 1: Black, 2: White
  const [gameOver, setGameOver] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // --- STATE ĐỒNG HỒ ---
  const [blackTime, setBlackTime] = useState(TIME_CONFIG[size].total);
  const [whiteTime, setWhiteTime] = useState(TIME_CONFIG[size].total);
  const [turnTime, setTurnTime] = useState(TIME_CONFIG[size].turn);

  useEffect(() => {
    document.body.className = `theme-${mode==='online' ? 'online' : difficulty}`;
    return () => document.body.className = '';
  }, [difficulty, mode]);

  useEffect(() => {
    if(mode === 'online') {
        setGrid(Array(size).fill().map(()=>Array(size).fill(0)));
        connectSocket();
    } else {
        initLocalGame();
    }
    // eslint-disable-next-line
  }, []);

  // --- ĐỒNG HỒ CHẠY ---
  useEffect(() => {
    if (!gameId || gameOver || (mode === 'online' && !gameId)) return;

    const timer = setInterval(() => {
        // 1. Trừ thời gian nước đi hiện tại
        setTurnTime(prev => {
            if (prev <= 1) {
                handleTimeout(); // HẾT GIỜ NƯỚC ĐI
                return 0;
            }
            return prev - 1;
        });

        // 2. Trừ tổng thời gian của người đang đi
        if (turn === 1) {
            setBlackTime(prev => {
                if (prev <= 0) { handleTimeout(); return 0; }
                return prev - 1;
            });
        } else {
            setWhiteTime(prev => {
                if (prev <= 0) { handleTimeout(); return 0; }
                return prev - 1;
            });
        }
    }, 1000);

    return () => clearInterval(timer);
  }, [turn, gameId, gameOver, mode]);

  // HÀM XỬ LÝ KHI HẾT GIỜ -> THUA LUÔN
  const handleTimeout = async () => {
      if (gameOver) return;
      
      const winner = turn === 1 ? 2 : 1; 
      const reason = turnTime <= 1 ? "Hết giờ suy nghĩ!" : "Hết tổng thời gian!";
      
      await handleGameOver({ 
          score: { black: 0, white: 0 }, 
          winner_color: winner,
          msg: reason
      }, true); 
  };

  const initLocalGame = async () => {
    const res = await api.post(`/game/new/${size}`);
    setGameId(res.data.game_id);
    setGrid(Array(size).fill().map(()=>Array(size).fill(0)));
    setStatus(mode === 'pve' ? `Đối đầu AI - ${difficulty.toUpperCase()}` : "Giao hữu 2 Người");
    resetTimers();
  };

  const resetTimers = () => {
      setBlackTime(TIME_CONFIG[size].total);
      setWhiteTime(TIME_CONFIG[size].total);
      setTurnTime(TIME_CONFIG[size].turn);
  };

  const connectSocket = () => {
    setStatus("Đang kết nối máy chủ...");
    const u = localStorage.getItem('username') || 'guest';
    ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/${u}`);
    ws.current.onopen = () => {
        setStatus(`Đang tìm đối thủ...`);
        ws.current.send(JSON.stringify({type:'find_match', size, user:{username:u}}));
    };
    ws.current.onmessage = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.type === 'waiting') {
            setStatus(d.message); 
        } else if(d.type === 'start') {
            setGameId(d.game_id); setMyColor(d.color); 
            setGrid(Array(size).fill().map(()=>Array(size).fill(0)));
            setStatus(`Vào trận! Bạn là ${d.color===1?'Đen ⚫':'Trắng ⚪'}`);
            setTurn(1);
            resetTimers(); 
        } else if (d.type === 'move') {
            handleRemoteMove(d);
        }
    };
  };

  const handleCellClick = async (r, c) => {
    if (gameOver || loadingAI) return; 
    if (grid[r][c] !== 0) return; 
    if (mode === 'online' && turn !== myColor) return; 
    if (mode === 'pve' && turn !== 1) return; 

    if(mode !== 'online') {
        try {
            const res = await api.post(`/game/${gameId}/move`, {row:r, col:c, player:turn});
            updateBoard(res.data, r, c, turn);
            
            if(mode === 'pve' && !res.data.game_over) {
                setStatus("🤖 AI đang suy tính...");
                setLoadingAI(true);
                setTurn(2);
                setTimeout(() => triggerAI(), 600); 
            } else {
                setTurn(turn===1?2:1);
                setTurnTime(TIME_CONFIG[size].turn); // Reset thời gian suy nghĩ
                setStatus(`Lượt của quân ${turn===1?'Trắng ⚪':'Đen ⚫'}`);
            }
        } catch(e) { 
            alert(e.response?.data?.detail || "Nước đi không hợp lệ!"); 
        }
    } else {
        ws.current.send(JSON.stringify({type:'move', game_id:gameId, row:r, col:c, player:myColor}));
        const newGrid = [...grid]; newGrid[r][c] = myColor; setGrid(newGrid);
        setLastMove({row:r, col:c}); setTurn(myColor===1?2:1); addLog(myColor, r, c);
        setTurnTime(TIME_CONFIG[size].turn); // Reset timer của mình
        setStatus("Đợi đối thủ...");
    }
  };

  const handleRemoteMove = (d) => {
      const newGrid = [...grid]; newGrid[d.row][d.col] = d.player;
      setGrid(newGrid); addLog(d.player, d.row, d.col);
      setLastMove({row:d.row, col:d.col}); setTurn(d.player===1?2:1);
      setTurnTime(TIME_CONFIG[size].turn); 
      setStatus("Đến lượt bạn!");
  };

  const triggerAI = async () => {
      try {
        const res = await api.post(`/game/${gameId}/ai_move`, {difficulty});
        setLoadingAI(false);
        if(res.data.game_over) { handleGameOver(res.data); return; }

        if(res.data.move) {
            updateBoard(res.data, res.data.move.row, res.data.move.col, 2);
            setTurn(1); 
            setTurnTime(TIME_CONFIG[size].turn); 
            setStatus("🟢 Đến lượt bạn");
        } else { 
            setLogs(prev => [`⚪ AI (Bỏ lượt)`, ...prev]);
            setStatus("AI Bỏ lượt"); setTurn(1); setTurnTime(TIME_CONFIG[size].turn);
        }
      } catch (e) { setLoadingAI(false); setTurn(1); }
  };

  const handlePass = async () => {
      if(gameOver || loadingAI) return;
      if(!window.confirm("Bỏ lượt?")) return;

      try {
          const who = turn === 1 ? "Đen" : "Trắng";
          setLogs(prev => [`${who} (Bỏ lượt)`, ...prev]);
          const res = await api.post(`/game/${gameId}/pass`);
          if(res.data.game_over) { handleGameOver(res.data); return; }

          if(mode === 'pve') {
              setStatus("🤖 AI đang suy tính...");
              setLoadingAI(true);
              setTurn(2);
              setTimeout(() => triggerAI(), 600);
          } else {
              setTurn(turn===1?2:1);
              setTurnTime(TIME_CONFIG[size].turn);
              setStatus(`Lượt của quân ${turn===1?'Trắng ⚪':'Đen ⚫'}`);
          }
      } catch (e) { console.error(e); }
  };

  const updateBoard = (data, r, c, p) => {
      setGrid(data.grid); setLastMove({row:r, col:c}); setHint(null); addLog(p, r, c);
      if(data.game_over) handleGameOver(data);
  };

  const addLog = (p, r, c) => {
      const coord = `${COLS[c]}${size - r}`;
      const who = p===1?"Đen":"Trắng";
      setLogs(prev => [`${who} (${coord})`, ...prev]);
  };

  const getHint = async () => {
      const res = await api.post(`/game/${gameId}/hint`, {row:0, col:0, player:turn});
      if(res.data.move) setHint({row:res.data.move[0], col:res.data.move[1]});
      else alert("Không còn nước đi tốt!");
  };

  const handleGameOver = async (data, isTimeout=false) => {
      const info = { ...data, new_elo: null, delta: 0, isTimeout }; 
      
      let winner = 0;
      if (isTimeout) {
          winner = data.winner_color; 
      } else {
          winner = data.score.black > data.score.white ? 1 : 2;
      }
      
      if (isTimeout) {
          info.score = { black: winner===1?'Thắng':'Thua', white: winner===2?'Thắng':'Thua' };
      }

      if(localStorage.getItem('username')) {
          try {
            const res = await api.post(`/users/${localStorage.getItem('username')}/finish`, {
                winner_color: winner,
                difficulty: mode==='online'?'online':difficulty,
                opponent_elo: 1000 
            });
            localStorage.setItem('elo', res.data.new_elo);
            info.new_elo = res.data.new_elo; info.delta = res.data.delta;
          } catch(e) { console.error(e); }
      }
      setGameOver(info);
  };

  const handleSurrender = async () => {
    if (!window.confirm("🏳️ Chấp nhận thua và bị trừ điểm Elo?")) return;
    try {
        const u = localStorage.getItem('username');
        if (u) {
            const winner = myColor === 1 ? 2 : 1; 
            await api.post(`/users/${u}/finish`, {
                winner_color: winner, difficulty: mode === 'online' ? 'online' : difficulty, opponent_elo: 1000 
            });
        }
        if (ws.current) ws.current.close(); 
        navigate('/'); 
    } catch (e) { navigate('/'); }
  };

  const handleExit = () => {
    if (window.confirm("🏃 Thoát trận (Không bị trừ điểm Elo)?")) {
        if (ws.current) ws.current.close();
        navigate('/'); 
    }
  };

  const fmtTime = (s) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div style={{display:'flex', height:'100vh', padding:'20px', gap:'20px', alignItems:'center'}}>
      
      {/* BÀN CỜ */}
      <div className="glass-panel" style={{flex:3, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'90vh', position:'relative'}}>
         
         {/* THANH TRẠNG THÁI + ĐỒNG HỒ */}
         <div style={{
             display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '600px', 
             marginBottom: '15px', alignItems: 'center', background: 'rgba(0,0,0,0.3)', 
             padding: '10px 20px', borderRadius: '12px'
         }}>
             {/* ĐEN */}
             <div style={{display:'flex', alignItems:'center', gap:'10px', opacity: turn===1?1:0.5}}>
                 <div style={{width:30, height:30, borderRadius:'50%', background:'black', border:'2px solid white'}}></div>
                 <div>
                    <div style={{fontWeight:'bold', color:'white'}}>ĐEN (Bạn)</div>
                    <div style={{fontFamily:'monospace', fontSize:'1.2rem', color: turn===1?'#4CAF50':'#ccc'}}>
                        {fmtTime(blackTime)}
                    </div>
                 </div>
             </div>

             {/* ĐỒNG HỒ ĐẾM NGƯỢC NƯỚC ĐI */}
             <div style={{textAlign:'center'}}>
                 <div style={{fontSize:'0.8rem', color:'#aaa'}}>THỜI GIAN ĐI</div>
                 <div style={{
                     fontSize:'2.5rem', fontWeight:'bold', 
                     color: turnTime <= 5 ? '#ff1744' : 'white',
                     textShadow: turnTime <= 5 ? '0 0 10px red' : 'none',
                     animation: turnTime <= 5 ? 'pulse 0.2s infinite' : 'none'
                 }}>
                     {turnTime}
                 </div>
             </div>

             {/* TRẮNG */}
             <div style={{display:'flex', alignItems:'center', gap:'10px', opacity: turn===2?1:0.5}}>
                 <div style={{textAlign:'right'}}>
                    <div style={{fontWeight:'bold', color:'white'}}>TRẮNG</div>
                    <div style={{fontFamily:'monospace', fontSize:'1.2rem', color: turn===2?'#4CAF50':'#ccc'}}>
                        {fmtTime(whiteTime)}
                    </div>
                 </div>
                 <div style={{width:30, height:30, borderRadius:'50%', background:'white'}}></div>
             </div>
         </div>

         <Board boardSize={size} grid={grid} onCellClick={handleCellClick} lastMove={lastMove} hint={hint}/>

         {/* OVERLAY TÌM TRẬN */}
         {mode === 'online' && !gameId && (
             <div style={{
                 position:'absolute', top:0, left:0, right:0, bottom:0,
                 background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)',
                 display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:200,
                 borderRadius:'16px', color: 'white', textAlign: 'center'
             }}>
                 <div style={{fontSize: '4rem', marginBottom: '20px', animation: 'spin 2s linear infinite'}}>⏳</div>
                 <h1 style={{margin: '0 0 10px 0'}}>Đang Tìm Đối Thủ...</h1>
                 <p style={{opacity: 0.8, fontSize: '1.2rem', maxWidth: '80%'}}>Bàn {size}x{size} | Time: {TIME_CONFIG[size].turn}s/move</p>
                 <button onClick={() => { if(ws.current) ws.current.close(); navigate('/'); }} 
                    style={{marginTop:'30px', background: '#F44336', color: 'white', padding: '15px 30px'}}>Hủy</button>
                 <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
             </div>
         )}

         {/* OVERLAY GAME OVER */}
         {gameOver && (
             <div style={{
                 position:'absolute', top:0, left:0, right:0, bottom:0,
                 background:'rgba(0,0,0,0.85)', backdropFilter:'blur(5px)',
                 display:'flex', alignItems:'center', justifyContent:'center', zIndex:100,
                 borderRadius:'16px'
             }}>
                 <div className="modal-content">
                     {gameOver.isTimeout && <h3 style={{color:'#FF9800', margin:0}}>⏰ HẾT GIỜ!</h3>}
                     
                     <h1 style={{color: (gameOver.winner_color === 1 && myColor === 1) || (gameOver.winner_color === 2 && myColor === 2) ? '#4CAF50' : '#F44336', margin:'10px 0', fontSize:'2.5rem'}}>
                        {(() => {
                            if (gameOver.isTimeout) {
                                return (gameOver.winner_color === myColor) ? "🎉 BẠN THẮNG!" : "💀 BẠN THUA";
                            }
                            return gameOver.score.black > gameOver.score.white ? "🎉 ĐEN THẮNG!" : "🎉 TRẮNG THẮNG!";
                        })()}
                     </h1>

                     {gameOver.msg && <p style={{color:'#ccc'}}>{gameOver.msg}</p>}

                     {gameOver.new_elo !== null && (
                         <div style={{background: '#f5f5f5', padding: '15px', borderRadius: '10px', margin: '20px 0'}}>
                             <p style={{margin:0, color:'#555', fontSize:'0.9rem'}}>ELO MỚI</p>
                             <div style={{fontSize:'2rem', fontWeight:'800', color:'#333'}}>
                                 {gameOver.new_elo} 
                                 <span style={{fontSize:'1.2rem', marginLeft:'10px', color: gameOver.delta >= 0 ? '#4CAF50' : '#F44336'}}>
                                     ({gameOver.delta >= 0 ? '+' : ''}{gameOver.delta})
                                 </span>
                             </div>
                         </div>
                     )}
                     
                     {!gameOver.isTimeout && (
                        <div style={{display:'flex', justifyContent:'center', gap:'30px', margin:'20px 0', fontSize:'1.2rem'}}>
                            <div style={{color: '#333'}}>⚫ Đen: <b>{gameOver.score.black}</b></div>
                            <div style={{color: '#333'}}>⚪ Trắng: <b>{gameOver.score.white}</b></div>
                        </div>
                     )}

                     <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                         <button onClick={()=>window.location.reload()} style={{background:'#2196F3', color:'white'}}>Chơi lại</button>
                         <button onClick={()=>navigate('/')} style={{background:'#eee', color:'#333'}}>Về sảnh</button>
                     </div>
                 </div>
             </div>
         )}
        </div>

      {/* MENU BÊN PHẢI */}
      <div className="glass-panel" style={{flex:1, height:'90vh', display:'flex', flexDirection:'column', gap:'15px'}}>
         <button onClick={()=>navigate('/')} style={{background:'#fff', color:'#333'}}>🏠 Trang Chủ</button>
         
         <div style={{background:'rgba(0,0,0,0.3)', padding:'15px', borderRadius:'12px', flex:1, overflowY:'auto', color:'#fff'}}>
             <h4 style={{margin:'0 0 10px 0', borderBottom:'1px solid #aaa', paddingBottom:'5px'}}>📜 Lịch sử</h4>
             {logs.length === 0 && <p style={{fontSize:'0.9rem', opacity:0.7}}>Chưa có nước đi nào.</p>}
             {logs.map((l,i)=><div key={i} style={{fontSize:'14px', padding:'4px 0', borderBottom:'1px dashed rgba(255,255,255,0.1)'}}>{l}</div>)}
         </div>

         {mode!=='online' && !gameOver && (
             <>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                    <button onClick={getHint} style={{background:'#FF9800', color:'white'}}>💡 Gợi ý</button>
                    <button onClick={()=>api.post(`/game/${gameId}/undo`).then(r=>{setGrid(r.data.grid); setTurn(1)})} style={{background:'#2196F3', color:'white'}}>↩ Undo</button>
                </div>
                <button onClick={handlePass} style={{background: '#9C27B0', color: 'white', border: '2px solid rgba(255,255,255,0.3)', padding: '15px'}}>🛑 BỎ LƯỢT</button>
             </>
         )}
         
         <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {gameOver ? (
                 <button onClick={() => navigate('/')} style={{ background: '#4CAF50', color: 'white' }}>🏠 Về Sảnh Chính</button>
             ) : (
                 <>
                    <button onClick={handleSurrender} style={{ background: '#F44336', color: 'white' }}>🏳 Đầu hàng </button>
                    <button onClick={handleExit} style={{ background: '#607D8B', color: 'white' }}>🏃 Thoát </button>
                 </>
             )}
         </div>
      </div>
    </div>
  );
};
export default Game;