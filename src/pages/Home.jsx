import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import "../index.css"; 

const Home = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  
  // State hiển thị
  const [elo, setElo] = useState(localStorage.getItem('elo') || 1000);
  const [rank, setRank] = useState(localStorage.getItem('rank') || 'Iron');
  const [selectedMode, setSelectedMode] = useState(null); 

  // --- TỰ ĐỘNG ĐỒNG BỘ DỮ LIỆU ---
  useEffect(() => {
    if (!username) { navigate('/login'); return; }
    const fetchLatestData = async () => {
        try {
            const res = await api.get(`/users/${username}`);
            setElo(res.data.elo);
            
            let newRank = 'Iron';
            if (res.data.elo >= 1800) newRank = 'Platinum';
            else if (res.data.elo >= 1500) newRank = 'Gold';
            else if (res.data.elo >= 1200) newRank = 'Silver';
            else if (res.data.elo >= 1000) newRank = 'Bronze';
            setRank(newRank);

            localStorage.setItem('elo', res.data.elo);
            localStorage.setItem('rank', newRank);
        } catch (error) { console.error("Lỗi sync data"); }
    };
    fetchLatestData();
  }, [username, navigate]);

  // --- HÀM LỌC KÍCH THƯỚC THEO CHẾ ĐỘ ---
  const getAllowedSizes = (mode) => {
      if (mode === 'easy') return [9];                // Dễ: Chỉ 9x9
      if (mode === 'medium') return [9, 13];          // Trung: 9x9 và 13x13
      if (mode === 'hard') return [9, 13, 19];        // Khó: Full option
      if (mode === 'local' || mode === 'online') return [9, 13, 19]; // Local/Online: Full
      return [];
  };

  const handleStartGame = (size) => {
    if (!selectedMode) return;
    
    let modeParam = 'pve';
    let diffParam = selectedMode; // 'easy', 'medium', 'hard'

    // Xử lý ngoại lệ cho Local/Online (mặc định medium cho cân bằng)
    if (selectedMode === 'local') {
        modeParam = 'local';
        diffParam = 'medium'; 
    } else if (selectedMode === 'online') {
        modeParam = 'online';
        diffParam = 'medium';
    }

    setSelectedMode(null);
    navigate(`/game?mode=${modeParam}&size=${size}&diff=${diffParam}`);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', padding: '40px'
    }}>
      
      {/* HEADER */}
      <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>🏯 Cờ Vây Online</h1>
          <div style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
             Xin chào, <b>{username}</b> | Elo: <b>{elo}</b> | Rank: <b className={`rank-${rank}`}>{rank}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
             <button onClick={() => navigate('/profile')} style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>👤 Hồ sơ</button>
             <button onClick={() => navigate('/leaderboard')} style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>🏆 Xếp hạng</button>
             <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ background: '#ff4757', color: 'white' }}>🚪 Đăng xuất</button>
          </div>
      </div>

      {/* DANH SÁCH CARD CHẾ ĐỘ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', width: '100%', maxWidth: '1000px' }}>
          <ModeCard title="🐣 DỄ" desc="Tập chơi (Chỉ 9x9)" color="linear-gradient(135deg, #a8e063, #56ab2f)" onClick={() => setSelectedMode('easy')} />
          <ModeCard title="🦅 TRUNG BÌNH" desc="AI Khá (9x9, 13x13)" color="linear-gradient(135deg, #ffd200, #f7971e)" onClick={() => setSelectedMode('medium')} />
          <ModeCard title="🐉 KHÓ" desc="AI Khủng (Đủ bàn)" color="linear-gradient(135deg, #ff416c, #ff4b2b)" onClick={() => setSelectedMode('hard')} />
          <ModeCard title="👥 2 NGƯỜI (LOCAL)" desc="Chơi chung 1 máy" color="linear-gradient(135deg, #11998e, #38ef7d)" onClick={() => setSelectedMode('local')} />
          <ModeCard title="🌍 ĐẤU ONLINE" desc="Leo Rank thời gian thực" color="linear-gradient(135deg, #00c6ff, #0072ff)" onClick={() => setSelectedMode('online')} isSpecial={true} />
      </div>

      {/* --- MODAL CHỌN BÀN CỜ  */}
      {selectedMode && (
        <div className="modal-overlay" onClick={() => setSelectedMode(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>Chọn Bàn Cờ</h2>
            <p style={{ color: '#666', marginBottom: '25px' }}>
              Chế độ: <b style={{textTransform:'uppercase', color: '#2196F3'}}>{selectedMode}</b>
            </p>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              {/* CHỈ RENDER NHỮNG SIZE ĐƯỢC PHÉP */}
              {getAllowedSizes(selectedMode).map(size => (
                  <SizeButton 
                    key={size} 
                    size={size} 
                    desc={size === 9 ? "Nhanh gọn" : size === 13 ? "Tiêu chuẩn" : "Chuyên nghiệp"} 
                    onClick={() => handleStartGame(size)} 
                  />
              ))}
            </div>

            <button onClick={() => setSelectedMode(null)} style={{ marginTop: '20px', background: '#eee', color: '#555', width: '100%' }}>Hủy bỏ</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Components con
const ModeCard = ({ title, desc, color, onClick, isSpecial }) => (
  <div onClick={onClick} className="glass-panel" style={{ 
      background: isSpecial ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.15)', cursor: 'pointer', textAlign: 'center', minHeight: '150px',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderBottom: `6px solid transparent`, borderImage: `${color} 1`
    }}>
    <div style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '15px', background: color, boxShadow: '0 5px 15px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
      {title.includes('DỄ') ? '🐣' : title.includes('TRUNG') ? '🦅' : title.includes('KHÓ') ? '🐉' : title.includes('LOCAL') ? '👥' : '🌍'}
    </div>
    <h2 style={{ margin: '0 0 5px 0', fontSize: '1.4rem' }}>{title}</h2>
    <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>{desc}</p>
  </div>
);

const SizeButton = ({ size, desc, onClick }) => (
  <button onClick={onClick} style={{ background: 'white', border: '2px solid #eee', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderRadius: '10px' }}>
    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{size} x {size}</span>
    <span style={{ fontSize: '0.9rem', color: '#888' }}>{desc}</span>
  </button>
);

export default Home;