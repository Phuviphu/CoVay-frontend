import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      alert("Đăng ký thành công! Hãy đăng nhập.");
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.detail || "Lỗi đăng ký");
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
      <h2>Đăng Ký Tài Khoản</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'inline-grid', gap: '10px', width: '300px' }}>
        <input 
          type="text" placeholder="Tên đăng nhập" required 
          onChange={(e) => setFormData({...formData, username: e.target.value})} 
          style={{ padding: '8px' }} 
        />
        
        <input 
          type="email" placeholder="Email" required 
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
          style={{ padding: '8px' }} 
        />
        
        <input 
          type="password" placeholder="Mật khẩu" required 
          onChange={(e) => setFormData({...formData, password: e.target.value})} 
          style={{ padding: '8px' }} 
        />
        
        <button type="submit" style={{ padding: '10px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}>
          Đăng Ký
        </button>
      </form>
      
      <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </div>
  );
};

export default Register;