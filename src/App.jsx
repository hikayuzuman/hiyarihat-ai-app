import React, { useState, useEffect, useRef } from 'react';
import ShiftAssistant from './components/ShiftAssistant';
import Chart from 'chart.js/auto';
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

// --- Firebaseの初期設定 ---
// 実際のプロジェクトでは、これらの設定を環境変数など安全な場所に保管してください。
const firebaseConfig = {
  apiKey: "AIzaSyD5OeUEJY9StON6iZfqTD02B19ZnC7cwRI",
  authDomain: "hiyarihat-app.firebaseapp.com",
  projectId: "hiyarihat-app",
  storageBucket: "hiyarihat-app.firebasestorage.app",
  messagingSenderId: "74780793730",
  appId: "1:74780793730:web:b388cbb5435f8f5eaecd9b",
  measurementId: "G-V1DKQMK6SF"
};

// Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = 'hiyarihat-ai-app';


// --- 定数定義 ---
const HiyarihatType = { FALL: '転倒・転落', MEDICATION_ERROR: '誤薬・服薬', MEAL_ASPIRATION: '食事・誤嚥', INCIDENT: 'その他インシデント', NEAR_MISS: 'その他ヒヤリハット', BATHING: '入浴', EXCRETION: '排泄', TRANSFER: '移乗', EQUIPMENT: '設備・備品', COMMUNICATION: 'コミュニケーション', OTHER: 'その他' };
const ReporterType = { CARE_STAFF: 'ケアスタッフ', ADMIN_STAFF: '事務員' };
const ImpactLevel = { LEVEL_0: 'レベル0: エラーや不具合があったが患者には実施されなかった', LEVEL_1: 'レベル1: 確認のため処置を要したが処置は行われなかった', LEVEL_2: 'レベル2: 確認のため処置を要したが処置は行われた', LEVEL_3A: 'レベル3a: 一過性・中等度（軽度な処置や治療を要した）', LEVEL_3B: 'レベル3b: 一過性・高度（遺存的な処置や治療を要した）', LEVEL_4A: 'レベル4a: 永続的・軽度～中等度（永続的な後遺症が残ったが有意な機能障害は伴わない）', LEVEL_4B: 'レベル4b: 永続的・高度（永続的な機能障害を伴う）', LEVEL_5: 'レベル5: 死亡（原疾患によるものを除く）' };


// =================================================================
// ■ 認証コンポーネント
// =================================================================
const Auth = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (isLoginMode) { await signInWithEmailAndPassword(auth, email, password); }
      else { await createUserWithEmailAndPassword(auth, email, password); }
    } catch (err) {
      switch (err.code) {
        case 'auth/invalid-email': setError('有効なメールアドレスを入力してください。'); break;
        case 'auth/user-not-found': case 'auth/wrong-password': setError('メールアドレスまたはパスワードが間違っています。'); break;
        case 'auth/email-already-in-use': setError('このメールアドレスは既に使用されています。'); break;
        case 'auth/weak-password': setError('パスワードは6文字以上で入力してください。'); break;
        default: setError('認証に失敗しました。もう一度お試しください。'); break;
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center"><h2 className="text-3xl font-bold text-gray-900">ヒヤリハットAI分析システム</h2><p className="mt-2 text-sm text-gray-600">{isLoginMode ? 'ログインしてください' : 'アカウントを作成します'}</p></div>
        <form className="space-y-6" onSubmit={handleAuth}>
          <div className="relative"><div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 2l7.997 3.884A2 2 0 0019 7.616V16a2 2 0 01-2 2H3a2 2 0 01-2-2V7.616a2 2 0 001.003-1.732zM10 4.268L3.003 7.511v7.422a.998.998 0 00.997.997h12.002a.998.998 0 00.997-.997V7.511L10 4.268zM6 8a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" /></svg></div><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="メールアドレス" required /></div>
          <div className="relative"><div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg></div><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="パスワード" required /></div>
          {error && <p className="text-sm text-center text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
          <div><button type="submit" disabled={loading} className="w-full px-4 py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-all duration-300">{loading ? '処理中...' : (isLoginMode ? 'ログイン' : '登録する')}</button></div>
        </form>
        <div className="text-sm text-center"><button onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} className="font-medium text-indigo-600 hover:text-indigo-500">{isLoginMode ? 'アカウントをお持ちでないですか？' : '既にアカウントをお持ちですか？'}</button></div>
      </div>
    </div>
  );
};

// =================================================================
// ■ メインアプリケーションコンポーネント
// =================================================================
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hiyarihats, setHiyarihats] = useState([]);
  const [formData, setFormData] = useState({ date: '', time: '', location: '', incidentType: HiyarihatType.FALL, description: '', cause: '', measures: '', reporter: ReporterType.CARE_STAFF, impactLevel: ImpactLevel.LEVEL_0 });
  const [editingId, setEditingId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [showModal, setShowModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [modalMessage, setModalMessage] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [modalType, setModalType] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [confirmAction, setConfirmAction] = useState(null);
  const [statsMonth] = useState(new Date().toISOString().slice(0, 7));

  const [isGenerating, setIsGenerating] = useState(false); // ★AI生成中のローディング状態
  const [appMode, setAppMode] = useState('hiyarihat'); // 'hiyarihat' | 'shift'

  const incidentChartRef = useRef(null);
  const incidentChartInstanceRef = useRef(null);

  // --- Effect定義 ---
  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }); return () => unsubscribe(); }, []);
  useEffect(() => { if (!user) return; const userId = user.uid; const q = query(collection(db, `artifacts/${appId}/users/${userId}/hiyarihats`)); const unsub = onSnapshot(q, (snap) => { const data = snap.docs.map(d => ({ id: d.id, ...d.data() })); data.sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`)); setHiyarihats(data); }, (e) => console.error(e)); return () => unsub(); }, [user]);

  useEffect(() => {
    const filteredData = hiyarihats.filter(h => h.date && h.date.startsWith(statsMonth));
    if (incidentChartInstanceRef.current) incidentChartInstanceRef.current.destroy();
    if (filteredData.length === 0) return;
    if (incidentChartRef.current) {
      const incidentTypeCounts = {};
      filteredData.forEach(item => { incidentTypeCounts[item.incidentType] = (incidentTypeCounts[item.incidentType] || 0) + 1; });
      const ctx = incidentChartRef.current.getContext('2d');
      incidentChartInstanceRef.current = new Chart(ctx, { type: 'bar', data: { labels: Object.keys(incidentTypeCounts), datasets: [{ label: `インシデントタイプ別件数`, data: Object.values(incidentTypeCounts), backgroundColor: 'rgba(54, 162, 235, 0.6)', borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { beginAtZero: true } } } });
    }
  }, [hiyarihats, statsMonth]);

  // --- ハンドラ関数 ---
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleLogout = async () => { try { await signOut(auth); } catch (error) { console.error("ログアウトエラー", error); showCustomModal('ログアウトに失敗しました。', 'info'); } };
  const resetForm = () => setFormData({ date: '', time: '', location: '', incidentType: HiyarihatType.FALL, description: '', cause: '', measures: '', reporter: ReporterType.CARE_STAFF, impactLevel: ImpactLevel.LEVEL_0 });
  const handleSubmit = async (e) => { e.preventDefault(); if (!user) return; const userId = user.uid; try { if (editingId) { await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/hiyarihats`, editingId), formData); showCustomModal('更新しました！', 'info'); setEditingId(null); } else { await addDoc(collection(db, `artifacts/${appId}/users/${userId}/hiyarihats`), formData); showCustomModal('保存しました！', 'info'); } resetForm(); } catch (e) { console.error("保存/更新エラー", e); showCustomModal('エラー: 保存または更新に失敗しました。', 'info'); } };
  // eslint-disable-next-line no-unused-vars
  const handleEdit = (hiyarihat) => { setFormData(hiyarihat); setEditingId(hiyarihat.id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  // eslint-disable-next-line no-unused-vars
  const handleDelete = (id) => { setModalType('confirm'); setModalMessage('本当にこのヒヤリハットを削除しますか？'); setConfirmAction(() => async () => { if (!user) return; const userId = user.uid; try { await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/hiyarihats`, id)); showCustomModal('削除しました！', 'info'); } catch (e) { console.error("削除エラー", e); showCustomModal('エラー: 削除に失敗しました。', 'info'); } finally { closeModal(); } }); setShowModal(true); };
  const showCustomModal = (message, type) => { setModalMessage(message); setModalType(type); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setModalMessage(''); setModalType(''); setConfirmAction(null); };

  // ★★★ Gemini API を呼び出す関数 ★★★
  const handleGenerateWithAI = async () => {
    const { date, time, location, incidentType, description } = formData;
    if (!date || !time || !location || !incidentType || !description) {
      showCustomModal('AIで分析するには、発生日時、場所、種類、状況・内容をすべて入力してください。', 'info');
      return;
    }

    setIsGenerating(true);

    const userQuery = `
以下のヒヤリハット情報に基づいて、考えられる「原因・要因」と具体的な「対応・対策」を提案してください。

- 発生日時: ${date} ${time}
- 発生場所: ${location}
- 種類: ${incidentType}
- 状況・内容: ${description}
`;

    const systemPrompt = `あなたは介護施設のヒヤリハット報告書を分析する専門家です。提供された情報に基づき、専門的かつ具体的な分析と改善策を提案してください。出力は必ず指定されたJSON形式で返してください。`;

    try {
      const apiKey = ""; // Leave this as-is
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              cause: { type: "STRING", description: "考えられる原因・要因" },
              measures: { type: "STRING", description: "具体的な対応・対策" }
            },
            required: ["cause", "measures"]
          }
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 && result.candidates[0].content?.parts?.[0]?.text) {
        const jsonText = result.candidates[0].content.parts[0].text;
        const parsedJson = JSON.parse(jsonText);
        setFormData(prev => ({
          ...prev,
          cause: parsedJson.cause || 'AIによる分析結果がありませんでした。',
          measures: parsedJson.measures || 'AIによる分析結果がありませんでした。'
        }));
        showCustomModal('AIによる分析が完了しました。', 'info');
      } else {
        throw new Error('AIからの有効な応答がありませんでした。');
      }

    } catch (error) {
      console.error("Gemini API Error:", error);
      showCustomModal(`AIによる分析中にエラーが発生しました。\n${error.message}`, 'info');
    } finally {
      setIsGenerating(false);
    }
  };


  // --- レンダリングロジック ---
  if (loading) { return (<div className="flex justify-center items-center h-screen"><p className="text-lg text-gray-600">読み込み中...</p></div>); }
  if (!user) { return <Auth />; }

  if (appMode === 'shift') {
    return (
      <div className="relative">
        <button
          onClick={() => setAppMode('hiyarihat')}
          className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 transition"
        >
          ヒヤリハットアプリに戻る
        </button>
        <ShiftAssistant />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'); body { font-family: 'Inter', sans-serif; background-color: #F9FAFB; } .form-input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); transition: border-color 0.2s; } .form-input:focus { border-color: #6366F1; outline: none; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); } .btn-primary { background-color: #6366F1; color: white; padding: 10px 20px; border-radius: 8px; transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: none; cursor: pointer; } .btn-primary:hover { background-color: #4F46E5; transform: translateY(-1px); } .btn-primary:disabled { background-color: #A5B4FC; cursor: not-allowed; } .btn-secondary { background-color: #6B7280; color: white; padding: 8px 16px; border-radius: 8px; transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out; border: none; cursor: pointer; } .btn-secondary:hover { background-color: #4B5563; transform: translateY(-1px); } .btn-danger { background-color: #EF4444; color: white; padding: 8px 16px; border-radius: 8px; transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out; border: none; cursor: pointer; } .btn-danger:hover { background-color: #DC2626; transform: translateY(-1px); } .table-header th { background-color: #E0E7FF; color: #374151; } .table-row:nth-child(even) { background-color: #F9FAFB; } .table-row:hover { background-color: #F3F4F6; }`}</style>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">ヒヤリハットAI分析</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => setAppMode('shift')} className="btn-primary bg-green-600 hover:bg-green-700">
            シフト作成へ
          </button>
          <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
          <button onClick={handleLogout} className="btn-secondary">ログアウト</button>
        </div>
      </header>

      {/* --- 入力フォーム --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{editingId ? 'ヒヤリハット編集' : '新規ヒヤリハット報告'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">発生日時:</label><input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className="form-input" required /><input type="time" id="time" name="time" value={formData.time} onChange={handleChange} className="form-input mt-2" required /></div>
          <div><label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">発生場所:</label><input type="text" id="location" name="location" value={formData.location} onChange={handleChange} className="form-input" placeholder="例: 食堂、居室" required /></div>
          <div><label htmlFor="incidentType" className="block text-gray-700 text-sm font-bold mb-2">種類:</label><select id="incidentType" name="incidentType" value={formData.incidentType} onChange={handleChange} className="form-input" required>{Object.values(HiyarihatType).map(type => (<option key={type} value={type}>{type}</option>))}</select></div>

          {/* --- 状況・内容 と AI生成ボタン --- */}
          <div>
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">状況・内容:</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} className="form-input h-24 resize-y" placeholder="何が起こったか具体的に記述してください" required></textarea>
            <button type="button" onClick={handleGenerateWithAI} disabled={isGenerating} className="btn-primary w-full mt-3 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300">
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </span>
              ) : '🤖 AIで原因・対策を生成する'}
            </button>
          </div>

          {/* --- 原因・要因 --- */}
          <div>
            <label htmlFor="cause" className="block text-gray-700 text-sm font-bold mb-2">原因・要因:</label>
            <textarea id="cause" name="cause" value={formData.cause} onChange={handleChange} className="form-input h-20 resize-y" placeholder="AIによる分析結果がここに表示されます" disabled={isGenerating}></textarea>
          </div>

          {/* --- 対応・対策 --- */}
          <div>
            <label htmlFor="measures" className="block text-gray-700 text-sm font-bold mb-2">対応・対策:</label>
            <textarea id="measures" name="measures" value={formData.measures} onChange={handleChange} className="form-input h-20 resize-y" placeholder="AIによる分析結果がここに表示されます" disabled={isGenerating}></textarea>
          </div>

          <div><label htmlFor="reporter" className="block text-gray-700 text-sm font-bold mb-2">報告者:</label><select id="reporter" name="reporter" value={formData.reporter} onChange={handleChange} className="form-input" required>{Object.values(ReporterType).map(type => (<option key={type} value={type}>{type}</option>))}</select></div>
          <div><label htmlFor="impactLevel" className="block text-gray-700 text-sm font-bold mb-2">影響レベル:</label><select id="impactLevel" name="impactLevel" value={formData.impactLevel} onChange={handleChange} className="form-input" required>{Object.values(ImpactLevel).map(level => (<option key={level} value={level}>{level}</option>))} </select></div>
          <button type="submit" className="btn-primary w-full">{editingId ? '更新' : '保存'}</button>
          {editingId && (<button type="button" onClick={() => { setEditingId(null); resetForm(); }} className="btn-secondary w-full mt-2">キャンセル</button>)}
        </form>
      </div>

      {/* 統計と一覧表示は変更なしのため省略 */}
      {/* ... (元のコードの renderStatistics, データ入出力, ヒヤリハット一覧, モーダル表示部分) ... */}

    </div>
  );
};

export default App;
