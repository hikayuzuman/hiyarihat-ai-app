import React, { useState, useMemo, useEffect } from 'react';
import { Users, Calendar, Settings, Printer, Wand2, AlertCircle, FileText, Clock, Edit3, Filter, Trash2, Plus, X, ClipboardList, Database } from 'lucide-react';

// --- 型定義 ---
type JobTitle = '施設長' | '副施設長' | '看護師' | '介護リーダー' | '介護職員' | '機能訓練指導員' | 'パート';

// ユーザー定義のシフト記号
type ShiftType = '休' | '有' | '夏' | '冬' | 'ani' | '付' | '◒' | '○' | '▽' | '◑' | '●' | '';

interface ShiftDefinition {
    symbol: ShiftType;
    label: string;
    time: string;
    colorClass: string;
    isWork: boolean;
    isNight?: boolean;
}

const SHIFT_DEFS: Record<string, ShiftDefinition> = {
    '◒': { symbol: '◒', label: '早番', time: '7:00~16:00', colorClass: 'bg-yellow-100 text-yellow-800', isWork: true },
    '○': { symbol: '○', label: '日勤1', time: '8:30~17:30', colorClass: 'bg-blue-50 text-blue-800', isWork: true },
    '▽': { symbol: '▽', label: '日勤2', time: '9:00~17:00', colorClass: 'bg-blue-100 text-blue-900', isWork: true },
    '◑': { symbol: '◑', label: '入り', time: '16:00~0:00', colorClass: 'bg-purple-100 text-purple-800', isWork: true, isNight: true },
    '●': { symbol: '●', label: '明け', time: '0:00~9:00', colorClass: 'bg-gray-700 text-white', isWork: true, isNight: true },
    '休': { symbol: '休', label: '公休', time: '終日', colorClass: 'bg-red-100 text-red-800', isWork: false },
    '付': { symbol: '付', label: '付加休', time: '月1回', colorClass: 'bg-lime-100 text-lime-800', isWork: false },
    '有': { symbol: '有', label: '有給', time: '終日', colorClass: 'bg-orange-100 text-orange-800', isWork: false },
    '夏': { symbol: '夏', label: '夏季休', time: '7-9月', colorClass: 'bg-teal-100 text-teal-800', isWork: false },
    '冬': { symbol: '冬', label: '冬季休', time: '10-12月', colorClass: 'bg-cyan-100 text-cyan-800', isWork: false },
    'ani': { symbol: 'ani', label: 'アニバ', time: '誕生月~', colorClass: 'bg-pink-100 text-pink-800', isWork: false },
};

interface Staff {
    id: string;
    code: string;
    name: string;
    title: JobTitle;
    allowedFloors: string[];
    possibleShifts: ShiftType[];
    paidLeaveRemaining: number;
    birthMonth: number;
    prevMonthLastShift: ShiftType; // 前月末の勤務
}

interface Wish {
    staffId: string;
    date: number;
    type: ShiftType;
}

interface ShiftCell {
    type: ShiftType;
    isFixed: boolean;
}

interface RequiredStaffCount {
    floor: string;
    early: number; // ◒
    day: number;   // ○ + ▽
    late: number;  // ◑
    night: number; // ●
}

interface GlobalSettings {
    holidaysStandard: number;
    holidaysFeb: number;
    maxConsecutiveWork: number;
}

// --- 初期データ ---
const INITIAL_STAFF: Staff[] = [
    { id: '1', code: 'N001', name: '山田 太郎', title: '施設長', allowedFloors: ['1F', '2F'], possibleShifts: ['◒', '○', '▽', '◑', '●'], paidLeaveRemaining: 10, birthMonth: 5, prevMonthLastShift: '' },
    { id: '2', code: 'N002', name: '鈴木 花子', title: '副施設長', allowedFloors: ['1F', '2F', '3F'], possibleShifts: ['◒', '○', '▽', '◑', '●'], paidLeaveRemaining: 12, birthMonth: 8, prevMonthLastShift: '' },
    { id: '3', code: 'N003', name: '佐藤 健一', title: '介護リーダー', allowedFloors: ['2F', '3F'], possibleShifts: ['◒', '○', '▽', '◑', '●'], paidLeaveRemaining: 8, birthMonth: 11, prevMonthLastShift: '◑' }, // デモ用: 前月入り
    { id: '4', code: 'N004', name: '田中 優子', title: '介護職員', allowedFloors: ['1F'], possibleShifts: ['◒', '○', '▽', '◑', '●'], paidLeaveRemaining: 5, birthMonth: 2, prevMonthLastShift: '' },
    { id: '5', code: 'N005', name: '高橋 直樹', title: '介護職員', allowedFloors: ['2F'], possibleShifts: ['◒', '○', '▽', '◑', '●'], paidLeaveRemaining: 6, birthMonth: 7, prevMonthLastShift: '' },
    { id: '6', code: 'N006', name: '渡辺 さくら', title: '看護師', allowedFloors: ['All'], possibleShifts: ['◒', '○', '▽'], paidLeaveRemaining: 15, birthMonth: 4, prevMonthLastShift: '' },
    { id: '7', code: 'N007', name: '伊藤 健太', title: 'パート', allowedFloors: ['1F'], possibleShifts: ['○', '▽'], paidLeaveRemaining: 2, birthMonth: 9, prevMonthLastShift: '' },
    { id: '8', code: 'N008', name: '山本 美咲', title: '介護職員', allowedFloors: ['3F'], possibleShifts: ['◒', '○', '▽', '◑', '●'], paidLeaveRemaining: 7, birthMonth: 12, prevMonthLastShift: '' },
];

const INITIAL_WISHES: Wish[] = [
    { staffId: '1', date: 5, type: '有' },
    { staffId: '2', date: 15, type: '夏' },
    { staffId: '4', date: 10, type: '休' },
    { staffId: '4', date: 11, type: '休' },
];

const FLOORS = ['1F', '2F', '3F'];
const JOB_TITLES: JobTitle[] = ['施設長', '副施設長', '看護師', '介護リーダー', '介護職員', '機能訓練指導員', 'パート'];

const INITIAL_REQUIRED_COUNTS: Record<string, RequiredStaffCount> = {
    '1F': { floor: '1F', early: 1, day: 2, late: 1, night: 1 },
    '2F': { floor: '2F', early: 1, day: 2, late: 1, night: 1 },
    '3F': { floor: '3F', early: 0, day: 1, late: 0, night: 0 },
};

const INITIAL_GLOBAL_SETTINGS: GlobalSettings = {
    holidaysStandard: 9,
    holidaysFeb: 8,
    maxConsecutiveWork: 5,
};

// --- ローカルストレージ用ヘルパー ---
const STORAGE_KEYS = {
    STAFF: 'shift_app_staff_v4',
    WISHES: 'shift_app_wishes_v4',
    REQUIRED_COUNTS: 'shift_app_required_counts_v4',
    GLOBAL_SETTINGS: 'shift_app_global_settings_v4',
    SHIFT_MAP: 'shift_app_shift_map_v4',
    IS_GENERATED: 'shift_app_is_generated_v4'
};
// --- Added fix for potential JSON parse issues or missing data ---
const loadFromStorage = <T,>(key: string, initial: T): T => {
    if (typeof window === 'undefined') return initial;
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : initial;
    } catch (e) {
        console.warn('Failed to load ' + key, e);
        return initial;
    }
};

// --- 設定値 ---
const TARGET_YEAR = 2025;
const TARGET_MONTH: number = 11; // 11月
const DAYS_IN_MONTH = 30;
const START_DAY_OF_WEEK = 6; // 2025/11/1 = 土

export default function ShiftAssistant() {
    const [activeTab, setActiveTab] = useState<'staff' | 'wishes' | 'rules' | 'shift' | 'config'>('shift');

    // State initialization
    const [staffList, setStaffList] = useState<Staff[]>(() => loadFromStorage(STORAGE_KEYS.STAFF, INITIAL_STAFF));
    const [wishes, setWishes] = useState<Wish[]>(() => loadFromStorage(STORAGE_KEYS.WISHES, INITIAL_WISHES));
    const [requiredCounts, setRequiredCounts] = useState<Record<string, RequiredStaffCount>>(() => loadFromStorage(STORAGE_KEYS.REQUIRED_COUNTS, INITIAL_REQUIRED_COUNTS));
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => loadFromStorage(STORAGE_KEYS.GLOBAL_SETTINGS, INITIAL_GLOBAL_SETTINGS));
    const [shiftMap, setShiftMap] = useState<Record<string, Record<number, ShiftCell>>>(() => loadFromStorage(STORAGE_KEYS.SHIFT_MAP, {}));
    const [isGenerated, setIsGenerated] = useState<boolean>(() => loadFromStorage(STORAGE_KEYS.IS_GENERATED, false));

    const [viewMode, setViewMode] = useState<'edit' | 'print'>('edit');
    const [selectedFloor, setSelectedFloor] = useState<string>('All');

    // Auto-save
    useEffect(() => localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList)), [staffList]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.WISHES, JSON.stringify(wishes)), [wishes]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.REQUIRED_COUNTS, JSON.stringify(requiredCounts)), [requiredCounts]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.GLOBAL_SETTINGS, JSON.stringify(globalSettings)), [globalSettings]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.SHIFT_MAP, JSON.stringify(shiftMap)), [shiftMap]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.IS_GENERATED, JSON.stringify(isGenerated)), [isGenerated]);

    // Staff Modal State
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [staffForm, setStaffForm] = useState<Partial<Staff>>({
        code: '', name: '', title: '介護職員', allowedFloors: ['1F'], possibleShifts: ['◒', '○', '▽', '◑', '●'], paidLeaveRemaining: 10, birthMonth: 1, prevMonthLastShift: ''
    });

    // Wish Calendar State
    const [selectedWishStaffId, setSelectedWishStaffId] = useState<string>(staffList[0]?.id || '');

    const isFebruary = TARGET_MONTH === 2;
    const requiredHolidays = isFebruary ? globalSettings.holidaysFeb : globalSettings.holidaysStandard;
    const isSummerSeason = [7, 8, 9].includes(TARGET_MONTH);
    const isWinterSeason = [10, 11, 12, 1].includes(TARGET_MONTH);

    // --- Synchronization Logic (Critical) ---
    // 希望休や前月勤務が変わったら、shiftMapにも即座に反映させる
    useEffect(() => {
        setShiftMap(prevShiftMap => {
            const newShiftMap = { ...prevShiftMap };

            staffList.forEach(staff => {
                if (!newShiftMap[staff.id]) newShiftMap[staff.id] = {};

                // 1. 前月末が「入り」なら、1日は「明け」で強制固定
                if (staff.prevMonthLastShift === '◑') {
                    newShiftMap[staff.id][1] = { type: '●', isFixed: true };
                }

                // 2. 希望休を適用 (既存のAI生成より優先、ただし手動固定がさらに上書きするかは仕様によるが今回は希望休優先)
                wishes.forEach(w => {
                    if (w.staffId === staff.id) {
                        newShiftMap[staff.id][w.date] = { type: w.type, isFixed: true };
                    }
                });

                // 3. 逆に、希望休リストになく、前月明けでもないのに固定されている「休日」があれば、
                //    それはAI生成結果かもしれないのでそのままにする。
                //    ただし、希望休で「空」にした(=削除した)場合は、シフト表からも消すべき。
                //    この同期は複雑なので、ここでは「希望休リストにあるものは必ず反映」とする。

                // 前月明けの解除チェック (前月設定が変わった場合用)
                if (staff.prevMonthLastShift !== '◑' && newShiftMap[staff.id][1]?.type === '●' && newShiftMap[staff.id][1]?.isFixed) {
                    // これが希望休由来でなければ解除したいが、判別難しいので簡易的に、希望休になければ解除
                    const wishFirst = wishes.find(w => w.staffId === staff.id && w.date === 1);
                    if (!wishFirst) {
                        newShiftMap[staff.id][1] = { type: '', isFixed: false };
                        // もしAI生成済みなら空欄になってしまうが、再生成推奨
                    }
                }
            });
            return newShiftMap;
        });
    }, [wishes, staffList]); // staffList includes prevMonthLastShift

    // --- Helper: Reset ---
    const handleResetData = () => {
        if (window.confirm('全てのデータを初期状態に戻しますか？\nこの操作は取り消せません。')) {
            setStaffList(INITIAL_STAFF);
            setWishes(INITIAL_WISHES);
            setRequiredCounts(INITIAL_REQUIRED_COUNTS);
            setGlobalSettings(INITIAL_GLOBAL_SETTINGS);
            setShiftMap({});
            setIsGenerated(false);
            localStorage.clear();
        }
    };

    // --- Logic: Staff Management ---
    const handleOpenAddStaff = () => {
        setEditingStaffId(null);
        setStaffForm({ code: '', name: '', title: '介護職員', allowedFloors: ['1F'], possibleShifts: ['◒', '○', '▽', '◑', '●'], paidLeaveRemaining: 10, birthMonth: 1, prevMonthLastShift: '' });
        setIsStaffModalOpen(true);
    };

    const handleOpenEditStaff = (staff: Staff) => {
        setEditingStaffId(staff.id);
        setStaffForm({ ...staff });
        setIsStaffModalOpen(true);
    };

    const handleSaveStaff = () => {
        if (!staffForm.name || !staffForm.code) return alert('必須項目を入力してください');

        if (editingStaffId) {
            setStaffList(prev => prev.map(s => s.id === editingStaffId ? { ...s, ...staffForm } as Staff : s));
        } else {
            const newStaff: Staff = {
                id: Date.now().toString(),
                code: staffForm.code!, name: staffForm.name!, title: staffForm.title as JobTitle,
                allowedFloors: staffForm.allowedFloors || [], possibleShifts: staffForm.possibleShifts || [],
                paidLeaveRemaining: staffForm.paidLeaveRemaining || 0, birthMonth: staffForm.birthMonth || 1,
                prevMonthLastShift: staffForm.prevMonthLastShift || ''
            };
            setStaffList(prev => [...prev, newStaff]);
        }
        setIsStaffModalOpen(false);
    };

    const handleDeleteStaff = (id: string) => {
        if (window.confirm('削除しますか？')) setStaffList(prev => prev.filter(s => s.id !== id));
    };

    const toggleStaffFormFloor = (floor: string) => {
        setStaffForm(prev => ({ ...prev, allowedFloors: prev.allowedFloors?.includes(floor) ? prev.allowedFloors.filter(f => f !== floor) : [...(prev.allowedFloors || []), floor] }));
    };
    const toggleStaffFormShift = (shift: ShiftType) => {
        setStaffForm(prev => ({ ...prev, possibleShifts: prev.possibleShifts?.includes(shift) ? prev.possibleShifts.filter(s => s !== shift) : [...(prev.possibleShifts || []), shift] }));
    };

    // --- Logic: Wishes ---
    const cycleWishType = (staffId: string, date: number) => {
        const types: ShiftType[] = ['', '休', '有', '夏', '冬', 'ani'];
        const currentWish = wishes.find(w => w.staffId === staffId && w.date === date);
        const currentType = currentWish ? currentWish.type : '';

        const currentIndex = types.indexOf(currentType);
        const nextIndex = (currentIndex + 1) % types.length;
        const nextType = types[nextIndex];

        setWishes(prev => {
            const filtered = prev.filter(w => !(w.staffId === staffId && w.date === date));
            if (nextType === '') return filtered;
            return [...filtered, { staffId, date, type: nextType }];
        });
    };

    // --- Logic: Shift Generation ---
    const filteredStaffList = useMemo(() => {
        if (selectedFloor === 'All') return staffList;
        return staffList.filter(s => s.allowedFloors.includes(selectedFloor) || s.allowedFloors.includes('All'));
    }, [staffList, selectedFloor]);

    const dailyCounts = useMemo(() => {
        const counts: Record<number, Record<ShiftType, number>> = {};
        for (let d = 1; d <= DAYS_IN_MONTH; d++) {
            counts[d] = { '◒': 0, '○': 0, '▽': 0, '◑': 0, '●': 0, '休': 0, '有': 0, '夏': 0, '冬': 0, 'ani': 0, '付': 0, '': 0 };
            filteredStaffList.forEach(staff => {
                const type = shiftMap[staff.id]?.[d]?.type;
                if (type && counts[d][type] !== undefined) counts[d][type]++;
            });
        }
        return counts;
    }, [shiftMap, filteredStaffList]);

    const updateShift = (staffId: string, date: number, newType: ShiftType) => {
        setShiftMap(prev => ({ ...prev, [staffId]: { ...prev[staffId], [date]: { type: newType, isFixed: true } } }));
    };

    const updateRequiredCount = (floor: string, field: keyof RequiredStaffCount, value: number) => {
        setRequiredCounts(prev => ({ ...prev, [floor]: { ...prev[floor], [field]: value } }));
    };

    const generateShift = () => {
        const newShiftMap = { ...shiftMap };
        const targetStaff = selectedFloor === 'All' ? staffList : staffList.filter(s => s.allowedFloors.includes(selectedFloor) || s.allowedFloors.includes('All'));

        // 1. Init (Clear non-fixed)
        targetStaff.forEach(staff => {
            if (!newShiftMap[staff.id]) newShiftMap[staff.id] = {};
            for (let d = 1; d <= DAYS_IN_MONTH; d++) {
                const currentCell = shiftMap[staff.id]?.[d];
                // Keep if fixed (Wishes are already fixed by useEffect)
                if (!currentCell?.isFixed) {
                    newShiftMap[staff.id][d] = { type: '', isFixed: false };
                }
            }
            // 前月勤務のチェック: 入りなら1日は明けで固定 (useEffectでもやってるが念の為)
            if (staff.prevMonthLastShift === '◑') {
                newShiftMap[staff.id][1] = { type: '●', isFixed: true };
            }
        });

        // 2. Night Shifts (Pairing)
        for (let d = 1; d < DAYS_IN_MONTH; d++) {
            const shuffled = [...targetStaff].sort(() => Math.random() - 0.5);
            let count = 0;
            const needed = 2;
            for (const staff of shuffled) {
                if (count >= needed) break;
                if (newShiftMap[staff.id][d].type !== '' || newShiftMap[staff.id][d + 1].type !== '') continue;
                if (!staff.possibleShifts.includes('◑') || !staff.possibleShifts.includes('●')) continue;
                if (d > 1 && newShiftMap[staff.id][d - 1].type === '◑') continue;
                // 前月が入りで、1日が明けの場合、1日に「入り」は入れられない
                if (d === 1 && staff.prevMonthLastShift === '◑') continue;

                newShiftMap[staff.id][d] = { type: '◑', isFixed: false };
                newShiftMap[staff.id][d + 1] = { type: '●', isFixed: false };
                count++;
            }
        }

        // 3. Fill & Holidays
        targetStaff.forEach(staff => {
            let currentHolidays = 0;
            let hasFuka = false;
            let hasSeason = false;

            for (let d = 1; d <= DAYS_IN_MONTH; d++) {
                const t = newShiftMap[staff.id][d].type;
                if (t === '休') currentHolidays++;
                if (t === '付') hasFuka = true;
                if (['夏', '冬'].includes(t)) hasSeason = true;
            }

            const queue: ShiftType[] = [];
            if (!hasFuka) queue.push('付');
            if (!hasSeason) {
                if (isSummerSeason && staff.possibleShifts.includes('夏')) queue.push('夏');
                if (isWinterSeason && staff.possibleShifts.includes('冬')) queue.push('冬');
            }
            const needed = Math.max(0, requiredHolidays - currentHolidays);
            for (let i = 0; i < needed; i++) queue.push('休');

            while (queue.length > 0) {
                const nextOff = queue.shift()!;
                let maxRun = 0, maxRunStart = -1, curRun = 0, curStart = -1;
                for (let d = 1; d <= DAYS_IN_MONTH; d++) {
                    const type = newShiftMap[staff.id][d].type;
                    if (type === '' || SHIFT_DEFS[type]?.isWork) {
                        if (curRun === 0) curStart = d;
                        curRun++;
                    } else {
                        if (curRun > maxRun) { maxRun = curRun; maxRunStart = curStart; }
                        curRun = 0;
                    }
                }
                if (curRun > maxRun) { maxRun = curRun; maxRunStart = curStart; }

                let target = -1;
                if (maxRun > globalSettings.maxConsecutiveWork) {
                    for (let i = 0; i < maxRun; i++) {
                        const d = maxRunStart + i;
                        if (newShiftMap[staff.id][d]?.type === '') { target = d; break; }
                    }
                }
                if (target === -1) {
                    const empties = [];
                    for (let d = 1; d <= DAYS_IN_MONTH; d++) if (newShiftMap[staff.id][d].type === '') empties.push(d);
                    if (empties.length > 0) target = empties[Math.floor(Math.random() * empties.length)];
                }
                if (target !== -1) newShiftMap[staff.id][target] = { type: nextOff, isFixed: false };
            }

            const dayShifts = ['◒', '○', '▽'].filter(s => staff.possibleShifts.includes(s as ShiftType));
            for (let d = 1; d <= DAYS_IN_MONTH; d++) {
                if (newShiftMap[staff.id][d].type === '') {
                    newShiftMap[staff.id][d] = { type: dayShifts.length > 0 ? dayShifts[Math.floor(Math.random() * dayShifts.length)] as ShiftType : '休', isFixed: false };
                }
            }
        });

        setShiftMap(newShiftMap);
        setIsGenerated(true);
    };

    // --- Components ---
    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button onClick={() => setActiveTab(id)} className={`flex items-center px-4 py-2 mr-2 rounded-t-lg font-medium transition-colors ${activeTab === id ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <Icon className="w-4 h-4 mr-2" />{label}
        </button>
    );

    const EditableCell = ({ staffId, date, type }: { staffId: string, date: number, type: ShiftType }) => {
        const def = SHIFT_DEFS[type];
        const colorClass = def ? def.colorClass : 'bg-gray-50';
        if (viewMode === 'print') return <span className={`font-bold text-base ${def && !def.isWork ? 'text-red-600' : 'text-black'}`}>{type}</span>;
        return (
            <div className="relative w-full h-full group">
                <select
                    value={type}
                    onChange={(e) => updateShift(staffId, date, e.target.value as ShiftType)}
                    className={`w-full h-full text-center appearance-none font-bold text-sm border-none outline-none cursor-pointer focus:ring-2 focus:ring-blue-400 ${colorClass}`}
                    style={{ textAlignLast: 'center' }}
                >
                    <option value="">-</option>
                    {Object.values(SHIFT_DEFS).map(d => <option key={d.symbol} value={d.symbol}>{d.symbol}</option>)}
                </select>
            </div>
        );
    };

    const CountDisplay = ({ label, current, target, color }: { label: string, current: number, target: number, color: string }) => {
        const isShort = current < target;
        return (
            <div className={`flex flex-col items-center justify-center w-full h-auto ${color}`}>
                <span className="text-[10px] font-bold leading-none">{label}</span>
                <span className={`text-[11px] font-bold leading-none ${isShort ? 'text-red-600' : ''}`}>{current}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            {isStaffModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
                            <h3 className="text-lg font-bold text-gray-700">{editingStaffId ? '職員情報編集' : '新規職員追加'}</h3>
                            <button onClick={() => setIsStaffModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" className="border p-2 rounded" placeholder="職員コード" value={staffForm.code} onChange={e => setStaffForm({ ...staffForm, code: e.target.value })} />
                                <input type="text" className="border p-2 rounded" placeholder="氏名" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} />
                                <select className="border p-2 rounded" value={staffForm.title} onChange={e => setStaffForm({ ...staffForm, title: e.target.value as JobTitle })}>{JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                <input type="number" className="border p-2 rounded" placeholder="有給残" value={staffForm.paidLeaveRemaining} onChange={e => setStaffForm({ ...staffForm, paidLeaveRemaining: parseInt(e.target.value) })} />
                            </div>

                            {/* 前月勤務設定 */}
                            <div className="bg-orange-50 p-3 rounded border border-orange-200">
                                <label className="block text-sm font-bold text-orange-800 mb-1">前月末（10/31）の勤務</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="prevMonth" className="mr-1" checked={staffForm.prevMonthLastShift !== '◑'} onChange={() => setStaffForm({ ...staffForm, prevMonthLastShift: '' })} />
                                        <span className="text-sm">通常/休み</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="prevMonth" className="mr-1" checked={staffForm.prevMonthLastShift === '◑'} onChange={() => setStaffForm({ ...staffForm, prevMonthLastShift: '◑' })} />
                                        <span className="text-sm font-bold text-purple-700">入り (◑)</span>
                                    </label>
                                </div>
                                <p className="text-xs text-orange-600 mt-1">※「入り」を選択すると、1日は自動的に「明け(●)」になります。</p>
                            </div>

                            <div>
                                <p className="mb-1 text-sm font-bold">担当フロア</p>
                                <div className="flex gap-2">{['1F', '2F', '3F', 'All'].map(f => <label key={f} className="flex items-center space-x-1 border p-2 rounded bg-gray-50"><input type="checkbox" checked={staffForm.allowedFloors?.includes(f)} onChange={() => toggleStaffFormFloor(f)} /><span>{f}</span></label>)}</div>
                            </div>
                            <div>
                                <p className="mb-1 text-sm font-bold">可能勤務</p>
                                <div className="flex flex-wrap gap-2">{Object.values(SHIFT_DEFS).filter(d => d.isWork || ['夏', '冬'].includes(d.symbol)).map(d => <label key={d.symbol} className={`flex items-center space-x-1 border p-2 rounded ${staffForm.possibleShifts?.includes(d.symbol) ? d.colorClass : 'bg-gray-50'}`}><input type="checkbox" checked={staffForm.possibleShifts?.includes(d.symbol)} onChange={() => toggleStaffFormShift(d.symbol)} /><span>{d.symbol}</span></label>)}</div>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                            <button onClick={() => setIsStaffModalOpen(false)} className="px-4 py-2 border rounded">キャンセル</button>
                            <button onClick={handleSaveStaff} className="px-4 py-2 bg-blue-600 text-white rounded">{editingStaffId ? '更新' : '追加'}</button>
                        </div>
                    </div>
                </div>
            )}

            <header className="bg-slate-800 text-white p-4 shadow-md print:hidden">
                <div className="container mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold flex items-center"><Wand2 className="mr-2" /> AI介護シフトアシスタント</h1>
                        <p className="text-xs text-slate-300 mt-1">{TARGET_YEAR}年 {TARGET_MONTH}月度 {selectedFloor !== 'All' && `(${selectedFloor})`}</p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="bg-slate-700 px-3 py-1 rounded flex items-center gap-2 text-xs">
                            <Clock className="w-3 h-3" /><span>休:{requiredHolidays}</span><span>連勤:{globalSettings.maxConsecutiveWork}迄</span>
                            <span className="ml-2 text-green-300 flex items-center"><Database className="w-3 h-3 mr-1" />保存中</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4">
                <div className="flex border-b border-gray-200 mb-4 overflow-x-auto print:hidden">
                    <TabButton id="shift" label="月次シフト作成" icon={FileText} />
                    <TabButton id="staff" label="職員マスタ" icon={Users} />
                    <TabButton id="wishes" label="希望休" icon={Calendar} />
                    <TabButton id="rules" label="フロア人員" icon={Settings} />
                    <TabButton id="config" label="作成ルール" icon={ClipboardList} />
                </div>

                <div className="bg-white rounded-lg shadow p-6 min-h-[600px] print:shadow-none print:p-0">
                    {activeTab === 'shift' && (
                        <div>
                            <div className="flex flex-wrap justify-between items-center mb-6 bg-gray-50 p-4 rounded-lg border print:hidden">
                                <div className="flex items-center space-x-6">
                                    <h2 className="text-xl font-bold text-gray-800">勤務表</h2>
                                    <div className="flex items-center bg-white border rounded px-2 py-1 shadow-sm">
                                        <Filter className="w-4 h-4 text-gray-500 mr-2" />
                                        <select value={selectedFloor} onChange={(e) => setSelectedFloor(e.target.value)} className="text-sm font-bold outline-none text-blue-800 cursor-pointer bg-transparent">
                                            <option value="All">全フロア</option>
                                            {FLOORS.map(f => <option key={f} value={f}>{f}のみ</option>)}
                                        </select>
                                    </div>
                                    {isGenerated && (
                                        <div className="flex bg-white rounded border overflow-hidden ml-4">
                                            <button onClick={() => setViewMode('edit')} className={`px-3 py-1 text-sm flex items-center ${viewMode === 'edit' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-600'}`}><Edit3 className="w-3 h-3 mr-1" />編集</button>
                                            <button onClick={() => setViewMode('print')} className={`px-3 py-1 text-sm flex items-center ${viewMode === 'print' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-600'}`}><Printer className="w-3 h-3 mr-1" />印刷</button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex space-x-3">
                                    <button onClick={generateShift} className="flex items-center bg-indigo-600 text-white px-6 py-2 rounded shadow-lg hover:bg-indigo-700">
                                        <Wand2 className="w-5 h-5 mr-2 animate-pulse" />{selectedFloor === 'All' ? 'AI自動作成' : `AI作成 (${selectedFloor})`}
                                    </button>
                                    {isGenerated && <button onClick={() => window.print()} className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"><Printer className="w-4 h-4 mr-2" />印刷</button>}
                                </div>
                            </div>

                            {isGenerated ? (
                                <div className={`overflow-x-auto ${viewMode === 'print' ? 'p-0' : ''}`}>
                                    {viewMode === 'print' && <div className="text-center mb-6"><h1 className="text-2xl font-serif font-bold border-b-2 border-black inline-block pb-1 mb-2">{TARGET_YEAR}年{TARGET_MONTH}月 勤務表 {selectedFloor !== 'All' && `(${selectedFloor})`}</h1></div>}
                                    <table className="w-full border-collapse text-center text-sm border border-gray-300">
                                        <thead>
                                            <tr className="bg-gray-100 print:bg-gray-200">
                                                <th rowSpan={2} className="border border-gray-400 p-2 min-w-[100px] text-left">氏名</th>
                                                <th rowSpan={2} className="border border-gray-400 p-2 min-w-[40px]">職</th>
                                                {Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1).map(d => (
                                                    <th key={d} className={`border border-gray-400 p-1 w-9 ${d % 7 === 2 || d % 7 === 3 ? 'text-red-600 bg-red-50 print:bg-white' : ''}`}>{d}</th>
                                                ))}
                                                <th rowSpan={2} className="border border-gray-400 p-1 w-10 bg-gray-50 text-xs">休</th>
                                            </tr>
                                            <tr className="bg-slate-50 text-[10px]">
                                                {Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1).map(d => {
                                                    const counts = dailyCounts[d] || {};
                                                    let target = { early: 0, day: 0, late: 0, night: 0 };
                                                    if (selectedFloor === 'All') FLOORS.forEach(f => { target.early += requiredCounts[f].early; target.day += requiredCounts[f].day; target.late += requiredCounts[f].late; target.night += requiredCounts[f].night; });
                                                    else target = requiredCounts[selectedFloor];
                                                    return (
                                                        <th key={d} className="border border-gray-400 p-0 align-top h-14">
                                                            <div className="grid grid-cols-2 gap-0 h-full">
                                                                <CountDisplay label="◒" current={counts['◒']} target={target.early} color="text-yellow-700" />
                                                                <CountDisplay label="○" current={counts['○'] + counts['▽']} target={target.day} color="text-blue-700" />
                                                                <CountDisplay label="◑" current={counts['◑']} target={target.late} color="text-purple-700" />
                                                                <CountDisplay label="●" current={counts['●']} target={target.night} color="text-gray-700" />
                                                            </div>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStaffList.map(staff => (
                                                <tr key={staff.id} className="print:break-inside-avoid">
                                                    <td className="border border-gray-400 p-1 px-2 font-bold text-left text-sm relative">
                                                        {staff.name}
                                                        {staff.prevMonthLastShift === '◑' && <span className="absolute top-0 right-0 text-[8px] text-purple-600 bg-purple-100 px-1 rounded-bl">前月入</span>}
                                                    </td>
                                                    <td className="border border-gray-400 p-1 text-xs">{staff.title.substring(0, 2)}</td>
                                                    {Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1).map(d => (
                                                        <td key={d} className="border border-gray-400 p-0 h-9 w-9">
                                                            <EditableCell staffId={staff.id} date={d} type={shiftMap[staff.id]?.[d]?.type || ''} />
                                                        </td>
                                                    ))}
                                                    <td className="border border-gray-400 p-1 font-bold text-center bg-red-50 text-red-700">
                                                        {staffList.find(s => s.id === staff.id) ? Array.from({ length: DAYS_IN_MONTH }, (_, i) => shiftMap[staff.id]?.[i + 1]?.type).filter(t => ['休', '有', '夏', '冬', 'ani', '付'].includes(t || '')).length : 0}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                                    <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                                    <p className="text-gray-500 text-lg font-medium">シフト未作成</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'staff' && (
                        <div>
                            <div className="flex justify-between mb-4"><h2 className="text-lg font-bold">職員一覧</h2><button onClick={handleOpenAddStaff} className="bg-green-600 text-white px-3 py-1 rounded flex items-center"><Plus className="w-4 h-4 mr-1" />追加</button></div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead><tr className="bg-gray-100"><th className="p-2 border w-20">操作</th><th className="p-2 border">氏名</th><th className="p-2 border">職位</th><th className="p-2 border">勤務</th><th className="p-2 border">フロア</th></tr></thead>
                                    <tbody>
                                        {staffList.map(s => (
                                            <tr key={s.id} className="border-b hover:bg-gray-50">
                                                <td className="p-2 text-center flex justify-center gap-2">
                                                    <button onClick={() => handleOpenEditStaff(s)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit3 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteStaff(s.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                                <td className="p-2">
                                                    {s.name}
                                                    {s.prevMonthLastShift === '◑' && <span className="ml-2 text-[10px] bg-purple-100 text-purple-800 px-1 rounded border border-purple-200">前月入</span>}
                                                </td>
                                                <td className="p-2">{s.title}</td>
                                                <td className="p-2 text-xs">{s.possibleShifts.join(' ')}</td><td className="p-2">{s.allowedFloors.join(',')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'wishes' && (
                        <div className="flex h-[600px] border rounded-lg overflow-hidden">
                            <div className="w-64 border-r bg-gray-50 overflow-y-auto">
                                <div className="p-3 border-b font-bold text-gray-600 bg-gray-100 sticky top-0">職員選択</div>
                                {staffList.map(staff => (
                                    <button
                                        key={staff.id}
                                        onClick={() => setSelectedWishStaffId(staff.id)}
                                        className={`w-full text-left p-3 border-b hover:bg-white transition-colors ${selectedWishStaffId === staff.id ? 'bg-white border-l-4 border-l-blue-500 font-bold' : 'text-gray-600'}`}
                                    >
                                        {staff.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex-1 p-6 bg-white overflow-y-auto">
                                {selectedWishStaffId && staffList.find(s => s.id === selectedWishStaffId) ? (
                                    <div>
                                        <div className="mb-4 flex justify-between items-center">
                                            <h3 className="text-xl font-bold">{staffList.find(s => s.id === selectedWishStaffId)?.name} さんの希望休</h3>
                                            <div className="text-sm text-gray-500">クリックで変更: <span className="font-bold">空→休→有→夏→冬→ani</span></div>
                                        </div>
                                        <div className="border-t border-l border-gray-300">
                                            <div className="grid grid-cols-7 bg-gray-100 text-center font-bold">
                                                {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                                                    <div key={day} className={`p-2 border-r border-b border-gray-300 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-700'}`}>{day}</div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7">
                                                {Array.from({ length: START_DAY_OF_WEEK }).map((_, i) => (
                                                    <div key={`empty-${i}`} className="h-24 border-r border-b border-gray-300 bg-gray-50"></div>
                                                ))}
                                                {Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1).map(day => {
                                                    const wish = wishes.find(w => w.staffId === selectedWishStaffId && w.date === day);
                                                    const def = wish ? SHIFT_DEFS[wish.type] : null;
                                                    return (
                                                        <div
                                                            key={day}
                                                            onClick={() => cycleWishType(selectedWishStaffId, day)}
                                                            className={`
                                  h-24 border-r border-b border-gray-300 p-1 relative cursor-pointer transition-colors hover:bg-blue-50
                                  ${def ? def.colorClass : 'bg-white'}
                                `}
                                                        >
                                                            <span className="absolute top-1 left-2 font-bold text-gray-500 text-sm">{day}</span>
                                                            {wish && (
                                                                <div className="flex flex-col items-center justify-center h-full">
                                                                    <span className="text-xl font-bold">{wish.type}</span>
                                                                    <span className="text-[10px] mt-1">{def?.label}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {Array.from({ length: (7 - ((START_DAY_OF_WEEK + DAYS_IN_MONTH) % 7)) % 7 }).map((_, i) => (
                                                    <div key={`fill-${i}`} className="h-24 border-r border-b border-gray-300 bg-gray-50"></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">職員を選択してください</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'rules' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {FLOORS.map(f => (
                                <div key={f} className="border rounded p-4">
                                    <h3 className="font-bold text-center mb-2 bg-blue-50 rounded">{f} 必要人数</h3>
                                    <div className="space-y-2 text-sm">
                                        {['early', 'day', 'late', 'night'].map(k => (
                                            <div key={k} className="flex justify-between items-center">
                                                <span>{k === 'early' ? '早' : k === 'day' ? '日' : k === 'late' ? '遅' : '夜'}</span>
                                                <input type="number" className="w-16 border text-center" value={(requiredCounts[f] as any)[k]} onChange={e => updateRequiredCount(f, k as keyof RequiredStaffCount, parseInt(e.target.value))} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold flex items-center"><ClipboardList className="mr-2" />全体ルール設定</h2>
                                <button onClick={handleResetData} className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded hover:bg-red-50">データリセット</button>
                            </div>
                            <div className="bg-white border p-6 rounded max-w-xl space-y-6">
                                <div>
                                    <label className="block text-sm font-bold mb-1">通常月の公休数</label>
                                    <input type="number" className="border rounded w-full p-2" value={globalSettings.holidaysStandard} onChange={e => setGlobalSettings({ ...globalSettings, holidaysStandard: parseInt(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">2月の公休数</label>
                                    <input type="number" className="border rounded w-full p-2" value={globalSettings.holidaysFeb} onChange={e => setGlobalSettings({ ...globalSettings, holidaysFeb: parseInt(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">最大連続勤務日数</label>
                                    <input type="number" className="border rounded w-full p-2" value={globalSettings.maxConsecutiveWork} onChange={e => setGlobalSettings({ ...globalSettings, maxConsecutiveWork: parseInt(e.target.value) })} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
