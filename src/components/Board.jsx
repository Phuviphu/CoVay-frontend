import React from 'react';

const CELL_SIZE = 40; 
const STONE_SIZE = 34;
const COLS = "ABCDEFGHJKLMNOPQRST"; 

const Board = ({ boardSize, grid, onCellClick, lastMove, hint }) => {
  const boardPixelSize = boardSize * CELL_SIZE;
  const PADDING = 35; // Tăng padding một chút cho thoáng

  return (
    <div style={{
      position: 'relative',
      width: `${boardPixelSize + PADDING * 2}px`,
      height: `${boardPixelSize + PADDING * 2}px`,
      background: '#B27A3E url("https://www.transparenttextures.com/patterns/wood-pattern.png")',
      borderRadius: '8px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
      userSelect: 'none',
      border: '12px solid #5C3A21',
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      
      {/* TỌA ĐỘ - Đã căn chỉnh chính xác */}
      {Array.from({length: boardSize}).map((_, i) => (
        <React.Fragment key={i}>
          {/* Chữ cái (Trên/Dưới) - Căn giữa theo chiều ngang */}
          <span style={{
              position:'absolute', top: 8, 
              left: PADDING + i*CELL_SIZE + CELL_SIZE/2, 
              transform: 'translateX(-50%)', // Căn giữa chuẩn
              fontSize: '14px', fontWeight:'800', color:'#3E2723'
          }}>{COLS[i]}</span>
          
          <span style={{
              position:'absolute', bottom: 8, 
              left: PADDING + i*CELL_SIZE + CELL_SIZE/2, 
              transform: 'translateX(-50%)',
              fontSize: '14px', fontWeight:'800', color:'#3E2723'
          }}>{COLS[i]}</span>
          
          {/* Số (Trái/Phải) - Căn giữa theo chiều dọc */}
          <span style={{
              position:'absolute', left: 8, 
              top: PADDING + i*CELL_SIZE + CELL_SIZE/2, 
              transform: 'translateY(-50%)', // Căn giữa chuẩn, không bao giờ lệch
              fontSize: '14px', fontWeight:'800', color:'#3E2723'
          }}>{boardSize - i}</span>
          
          <span style={{
              position:'absolute', right: 8, 
              top: PADDING + i*CELL_SIZE + CELL_SIZE/2, 
              transform: 'translateY(-50%)',
              fontSize: '14px', fontWeight:'800', color:'#3E2723'
          }}>{boardSize - i}</span>
        </React.Fragment>
      ))}

      {/* VÙNG CHƠI */}
      <div style={{ position: 'relative', width: `${boardPixelSize}px`, height: `${boardPixelSize}px` }}>
        
        {/* Lưới */}
        {Array.from({length: boardSize}).map((_, i) => (
          <React.Fragment key={i}>
            <div style={{position:'absolute', top: i*CELL_SIZE + CELL_SIZE/2, left: CELL_SIZE/2, width: boardPixelSize-CELL_SIZE, height: 1, background:'#3E2723'}}/>
            <div style={{position:'absolute', left: i*CELL_SIZE + CELL_SIZE/2, top: CELL_SIZE/2, height: boardPixelSize-CELL_SIZE, width: 1, background:'#3E2723'}}/>
          </React.Fragment>
        ))}
        
        <StarPoints size={boardSize} />

        {/* Quân cờ & Click */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${boardSize}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${boardSize}, ${CELL_SIZE}px)`,
          width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 10
        }}>
          {grid.map((row, r) => row.map((val, c) => (
            <div 
              key={`${r}-${c}`} 
              onClick={(e) => { e.stopPropagation(); onCellClick(r, c); }} 
              style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative'}}
            >
              {val === 1 && <Stone color="black" />}
              {val === 2 && <Stone color="white" />}
              {val === 3 && <Stone color="black" ghost />}
              {val === 4 && <Stone color="white" ghost />}
              
              {lastMove?.row === r && lastMove?.col === c && val !== 0 && 
                <div style={{width: 8, height: 8, borderRadius: '50%', background: '#ff1744', position: 'absolute', zIndex: 20, boxShadow: '0 0 8px red'}}/>
              }
              {hint?.row === r && hint?.col === c && 
                <div style={{width: 20, height: 20, borderRadius: '50%', border: '3px solid #00e676', position: 'absolute', zIndex: 15, animation: 'pulse 1s infinite'}}/>
              }
            </div>
          )))}
        </div>
      </div>
    </div>
  );
};

const Stone = ({color, ghost}) => {
  const isBlack = color === 'black';
  return (
    <div style={{
      width: STONE_SIZE, height: STONE_SIZE, borderRadius: '50%',
      background: isBlack ? 'radial-gradient(circle at 30% 30%, #666, #000 80%)' : 'radial-gradient(circle at 30% 30%, #fff, #ddd 80%)',
      boxShadow: ghost ? 'none' : '2px 4px 6px rgba(0,0,0,0.5)',
      opacity: ghost ? 0.4 : 1, transform: ghost ? 'scale(0.8)' : 'scale(1)',
      zIndex: 10, position: 'relative'
    }}>
      {!ghost && <div style={{position: 'absolute', top: '15%', left: '15%', width: '20%', height: '10%', borderRadius: '50%', background: 'rgba(255,255,255,0.6)', transform: 'rotate(-45deg)', filter: 'blur(1px)'}}/>}
    </div>
  );
};

const StarPoints = ({size}) => {
    let pts = [];
    if(size===9) pts=[[2,2],[2,6],[4,4],[6,2],[6,6]];
    if(size===13) pts=[[3,3],[3,9],[6,6],[9,3],[9,9]];
    if(size===19) pts=[[3,3],[3,9],[3,15],[9,3],[9,9],[9,15],[15,3],[15,9],[15,15]];
    return pts.map(([r,c],i) => <div key={i} style={{position:'absolute', width:8, height:8, borderRadius:'50%', background:'#3E2723', top:r*CELL_SIZE+CELL_SIZE/2-4, left:c*CELL_SIZE+CELL_SIZE/2-4}}/>)
};

export default Board;