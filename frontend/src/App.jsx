import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Activity, Scale, Dumbbell, Trash2, Plus, TrendingUp, LogOut, Lock } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [entries, setEntries] = useState([]);
  const [type, setType] = useState('Weight');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('Bodyweight');
  const [notes, setNotes] = useState('');

  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : 'https://ironlog-backend-ts0m.onrender.com';

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setAuthError(data.msg || 'Authentication failed');
        return;
      }
      
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError('Server error. Is the backend running?');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setEntries([]);
  };

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/api/entries`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          handleLogout();
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => setEntries(data))
      .catch(err => console.error("DB Error:", err));
  }, [token]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!value) return;

    const newEntry = { 
      type, 
      category: type === 'Weight' ? 'Bodyweight' : category, 
      value: parseFloat(value), 
      date: new Date().toISOString(), 
      notes 
    };

    const res = await fetch(`${API_URL}/api/entries`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newEntry)
    });

    if (res.ok) {
      const saved = await res.json();
      setEntries([...entries, saved]);
      setValue('');
      setNotes('');
    }
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/api/entries/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setEntries(entries.filter(e => e._id !== id));
  };

  const weightData = useMemo(() => {
    const weights = entries.filter(e => e.type === 'Weight');
    const dailyWeights = {};
    weights.forEach(e => {
      const dayString = new Date(e.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
      dailyWeights[dayString] = { displayDate: dayString, value: e.value, fullDate: e.date };
    });
    return Object.values(dailyWeights).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
  }, [entries]);

  const macroData = useMemo(() => {
    const macros = entries.filter(e => e.type === 'Macro');
    const totals = { Protein: 0, Carbs: 0, Fats: 0 };
    macros.forEach(m => {
      if (totals[m.category] !== undefined) totals[m.category] += m.value;
    });
    if (totals.Protein === 0 && totals.Carbs === 0 && totals.Fats === 0) return [];
    
    return [
      { name: 'Protein', value: totals.Protein, color: '#ef4444' },
      { name: 'Carbs', value: totals.Carbs, color: '#3b82f6' },
      { name: 'Fats', value: totals.Fats, color: '#eab308' },
    ];
  }, [entries]);

  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].value : '--';

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-white flex items-center justify-center gap-3 tracking-tight">
            <Activity className="text-red-500" size={40} />
            IRON<span className="text-red-500">LOG</span>
          </h1>
          <p className="text-slate-400 mt-2 tracking-widest uppercase text-sm">Secure Data Vault</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Lock className="text-red-500" size={24} />
            {isLoginMode ? 'Account Login' : 'Create Account'}
          </h2>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Email Address</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-red-500 transition-colors"
                placeholder="gymbro@ironlog.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Password</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-red-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-4 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              {isLoginMode ? 'Unlock Vault' : 'Register Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-slate-400 hover:text-white text-sm transition-colors">
              {isLoginMode ? "Don't have an account? Sign up here." : "Already have an account? Sign in."}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 selection:bg-red-500/30">
      
      <header className="mb-8 border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <Activity className="text-red-500" size={32} />
            IRON<span className="text-red-500">LOG</span>
          </h1>
          <p className="text-slate-500 text-sm tracking-widest uppercase mt-1">Strength & Macro Dashboard</p>
        </div>
        <div className="flex items-end gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-slate-500 text-sm uppercase tracking-widest">Current Weight</p>
            <p className="text-3xl font-mono font-bold text-white">{currentWeight} <span className="text-lg text-slate-500">kg</span></p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="text-red-500" size={20} />
              Log Data
            </h2>
            
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Metric Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Weight', 'Macro', 'Lift'].map(t => (
                    <button
                      key={t} type="button" onClick={() => { setType(t); setCategory(''); }}
                      className={`py-2 text-sm font-semibold rounded-lg border transition-colors ${
                        type === t 
                          ? 'bg-red-500/10 border-red-500 text-red-500' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {type !== 'Weight' && (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Category</label>
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value)} required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-red-500"
                  >
                    <option value="" disabled>Select {type}...</option>
                    {type === 'Macro' && ['Protein', 'Carbs', 'Fats'].map(c => <option key={c} value={c}>{c}</option>)}
                    {type === 'Lift' && ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Value</label>
                <input 
                  type="number" step="0.1" required value={value} onChange={(e) => setValue(e.target.value)}
                  placeholder={type === 'Weight' ? 'kg' : type === 'Lift' ? 'kg' : 'grams'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Notes (Optional)</label>
                <input 
                  type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did you feel?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-red-500"
                />
              </div>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-4 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                Save Entry
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-80">
              <h3 className="text-sm uppercase tracking-widest text-slate-500 font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={16} /> Bodyweight Trend
              </h3>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#64748b" fontSize={12} />
                  <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={12} width={40} tickFormatter={(val) => `${val}kg`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ color: '#ef4444' }} />
                  <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#0f172a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-80 flex flex-col">
              <h3 className="text-sm uppercase tracking-widest text-slate-500 font-semibold mb-4 flex items-center gap-2">
                <Scale size={16} /> Total Macro Split
              </h3>
              {macroData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-600 text-sm italic">No macro data logged yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie data={macroData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {macroData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-sm uppercase tracking-widest text-slate-500 font-semibold flex items-center gap-2">
                <Dumbbell size={16} /> Recent Activity
              </h3>
            </div>
            <div className="divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto">
              {entries.slice().reverse().map(entry => (
                <div key={entry._id} className="p-4 hover:bg-slate-800/30 flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      entry.type === 'Weight' ? 'bg-red-500/20 text-red-400' :
                      entry.type === 'Lift' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {entry.type[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {entry.category}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {new Date(entry.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                        {entry.notes && ` • ${entry.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="font-mono font-bold text-lg text-white">
                      {entry.value} <span className="text-xs text-slate-500">{entry.type === 'Macro' ? 'g' : 'kg'}</span>
                    </p>
                    <button onClick={() => handleDelete(entry._id)} className="text-slate-600 hover:text-red-500 transition-colors" title="Delete Entry">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {entries.length === 0 && (
                <div className="p-8 text-center text-slate-500 font-mono text-sm">
                  Welcome to IronLog. Add your first entry to generate your dashboard.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}