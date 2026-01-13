import { useState, useEffect } from 'react';
import { ArrowDown, Wallet, Zap, Shield, ChevronRight, Info, RefreshCw, Send, Lock, Loader2, CheckCircle, Copy, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [step, setStep] = useState('calculator'); // 'calculator', 'form', 'processing', 'payment'
  const [amount, setAmount] = useState('100');
  const [calculatedAmount, setCalculatedAmount] = useState(null);
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // Form Data
  const [wallet, setWallet] = useState('');
  const [email, setEmail] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderRequisites, setOrderRequisites] = useState(null);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    const fetchRate = () => {
      setLoading(true);
      fetch('/api/rates')
        .then(res => res.json())
        .then(data => {
          setRate(data.ourRate);
          setLoading(false);
        })
        .catch(err => {
          console.error("API Error:", err);
          setLoading(false);
          setRate(98.50); // Fallback rate
        });
    };

    fetchRate();
    const interval = setInterval(fetchRate, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (amount && rate) {
      setCalculatedAmount((parseFloat(amount) * rate).toFixed(2));
    }
  }, [amount, rate]);

  useEffect(() => {
    let pollInterval;
    if (step === 'processing' && currentOrderId) {
      pollInterval = setInterval(() => {
        fetch(`/api/orders/${currentOrderId}`)
          .then(res => res.json())
          .then(data => {
            setOrderStatus(data.status);
            if (data.status === 'waiting_payment' && data.requisites) {
              setOrderRequisites(data.requisites);
              setStep('payment');
              clearInterval(pollInterval);
            }
          })
          .catch(console.error);
      }, 1000);
    }
    return () => clearInterval(pollInterval);
  }, [step, currentOrderId]);

  const handleStartExchange = () => {
    setStep('form');
  };

  const handleSubmitForm = () => {
    setLoading(true);
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, wallet, email })
    })
      .then(res => res.json())
      .then(data => {
        setCurrentOrderId(data.id);
        setStep('processing');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handlePayment = () => {
    if (!currentOrderId) return;
    fetch(`/api/orders/${currentOrderId}/confirm`, { method: 'POST' })
      .then(() => {
        alert('Платеж подтвержден! Ожидайте поступления средств.');
        setStep('calculator');
      });
  };

  return (
    <div className="min-h-screen bg-[#2a2635] text-white font-sans selection:bg-yellow-500/30 pb-20">

      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#453f5a]/20 rounded-full blur-[100px] -z-10"></div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 relative z-10 space-y-6">

        {/* --- HEADER --- */}
        <header className="flex flex-col items-center justify-center space-y-3">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            {/* Smoother, Circular Logo matching Card Color */}
            <div className="w-16 h-16 bg-[#3f3a50] rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(234,179,8,0.2)] border border-yellow-500/10 overflow-hidden">
              <img
                src="/logo.png"
                alt="Gremlin"
                className="w-10 h-auto object-contain"
              />
            </div>
          </motion.div>

          <div className="text-center">
            <h1 className="text-base font-bold text-white tracking-wide">GREMLIN <span className="text-yellow-400">EXCHANGE</span></h1>
          </div>
        </header>

        <AnimatePresence mode="wait">

          {/* STEP 1: CALCULATOR */}
          {step === 'calculator' && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* CARD 1: YOU GIVE */}
              <div className="bg-[#3f3a50]/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Отдаете</span>
                  <span className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/10">
                    <Wallet size={10} />
                    <span>USDT TRC20</span>
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#1f1b29]/60 border border-white/5 rounded-xl px-4 py-3 text-2xl font-mono text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 focus:bg-[#1f1b29]/80 transition-all"
                    placeholder="0.00"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">
                    USDT
                  </div>
                </div>

                <div className="mt-3 flex justify-between text-xs text-gray-500 font-medium">
                  <span>Мин: 10 USDT</span>
                  <span>Макс: 50,000 USDT</span>
                </div>
              </div>

              {/* CONNECTOR */}
              <div className="relative h-4 flex items-center justify-center -my-2 z-20">
                <div className="bg-[#2a2635] border border-gray-700 rounded-full p-1.5 shadow-md">
                  <ArrowDown size={14} className="text-yellow-400" />
                </div>
              </div>

              {/* CARD 2: YOU GET */}
              <div className="bg-[#3f3a50]/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-lg relative group hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Получаете</span>
                  <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/10">
                    <Zap size={10} />
                    <span>SBER RUB</span>
                  </span>
                </div>
                <div className="relative">
                  <div className={`w-full bg-[#1f1b29]/60 border border-white/5 rounded-xl px-4 py-3 text-2xl font-mono flex items-center justify-between ${loading ? 'text-gray-500' : 'text-green-400'}`}>
                    <span>{loading ? 'Поиск...' : `~${calculatedAmount}`}</span>
                    <span className="text-sm font-bold text-gray-400 font-sans">RUB</span>
                  </div>
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw size={20} className="text-yellow-500 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="mt-3 flex justify-between text-xs font-medium">
                  <span className="text-gray-500">Курс: 1 USDT = {rate || '...'} RUB</span>
                  <span className="text-yellow-400 flex items-center gap-1"><Lock size={10} /> Фикс. 15 мин</span>
                </div>
              </div>

              {/* AI INFO */}
              <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="w-full flex items-center justify-between p-4 hover:bg-yellow-500/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Shield size={14} className="text-yellow-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-white">Умный Мониторинг</div>
                      <div className="text-[10px] text-yellow-500 uppercase tracking-wide">BestChange • Bybit P2P</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`text-yellow-500/70 transition-transform ${showInfo ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {showInfo && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 text-xs text-gray-400 space-y-2 border-t border-yellow-500/10">
                        <p>Наш AI-агент мониторит 20+ источников в реальном времени, чтобы найти лучший курс для вас.</p>
                        <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/5">
                          <Info size={12} className="text-yellow-400" />
                          <span>Включая <strong>комиссию сервиса 1.5%</strong>.</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={handleStartExchange}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_#fbbf244d] hover:shadow-[0_0_30px_#fbbf2480] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                <span>НАЧАТЬ ОБМЕН</span>
                <Send size={18} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: USER DATA FORM */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-[#3f3a50]/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-lg space-y-4">
                <h2 className="text-lg font-bold text-white mb-2">Реквизиты получателя</h2>

                <div className="space-y-2">
                  <label className="text-xs text-gray-400 ml-1">Карта SBER (RUB)</label>
                  <input
                    type="text"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className="w-full bg-[#1f1b29]/60 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-all font-mono"
                    placeholder="0000 0000 0000 0000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-400 ml-1">Ваш Email (для чека)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1f1b29]/60 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-all"
                    placeholder="mail@example.com"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('calculator')}
                  className="w-1/3 bg-[#3f3a50]/60 hover:bg-[#3f3a50] text-gray-300 font-bold py-4 rounded-xl border border-white/5 transition-all"
                >
                  Назад
                </button>
                <button
                  onClick={handleSubmitForm}
                  className="w-2/3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold py-4 rounded-xl shadow-[0_0_20px_#fbbf244d] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><span>Далее</span><ChevronRight size={18} /></>}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PROCESSING ANIMATION (Simulating "Middleman" Work) */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-10 space-y-6"
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse"></div>
                <Loader2 size={96} className="text-yellow-400 animate-spin relative z-10" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">AI подбирает заявку...</h3>
                <p className="text-sm text-gray-400 max-w-[200px] mx-auto">
                  Анализируем курсы на BestChange, проверяем лимиты и резервы.
                </p>
              </div>

              {/* Polling Indicator */}
              <div className="text-xs text-gray-500 animate-pulse">
                Статус: {orderStatus || "Инициализация"}...
              </div>
            </motion.div>
          )}


          {/* STEP 4: PAYMENT REQUISITES */}
          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle size={24} className="text-green-500" />
                <div>
                  <div className="font-bold text-green-400">Заявка создана!</div>
                  <div className="text-xs text-gray-400">Ордер #{currentOrderId?.slice(0, 6)} активен 15 минут</div>
                </div>
              </div>

              <div className="bg-[#3f3a50]/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-lg space-y-5">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">К оплате</div>
                  <div className="text-3xl font-mono font-bold text-white">{orderRequisites?.amount || amount} USDT</div>
                  <div className="text-xs text-yellow-500 mt-1">Сеть: TRC20</div>
                </div>

                <div className="bg-[#1f1b29]/80 rounded-xl p-4 border border-white/5 space-y-2">
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>Адрес кошелька</span>
                    <span className="text-yellow-500">ПРОКСИ (AI)</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono text-gray-300 break-all">
                      {orderRequisites?.address || '...'}
                    </code>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Copy size={16} className="text-yellow-500" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-center text-gray-500">
                  После оплаты нажмите кнопку ниже.
                  <br />AI автоматически проверит транзакцию.
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
              >
                Я ОПЛАТИЛ
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* --- FOOTER & SUPPORT --- */}
        <footer className="space-y-4 pt-2">
          {/* Support Button */}
          <a
            href="https://t.me/support" // Placeholder
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/5 bg-[#3f3a50]/30 hover:bg-[#3f3a50]/50 text-gray-400 hover:text-white transition-all text-sm font-medium"
          >
            <MessageCircle size={16} />
            <span>Чат с помощником</span>
          </a>

          <div className="flex justify-center gap-4 opacity-30 grayscale hover:opacity-50 transition-all">
            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold border border-gray-700 px-2 py-1 rounded">
              <span>AML CLEAN</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold border border-gray-700 px-2 py-1 rounded">
              <span>INSTANT</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default App;
