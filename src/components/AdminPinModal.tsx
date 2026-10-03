import React, { useState, useEffect, useRef } from 'react';
import { useMenu } from '../context/MenuContext.tsx';
import { Lock, KeyRound, Eye, EyeOff, X, ArrowRight, AlertCircle } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { verifyAdminPin } = useMenu();
  const [pin, setPin] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMessage(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setErrorMessage('Por favor, digite a senha.');
      return;
    }

    const isValid = verifyAdminPin(pin);
    if (isValid) {
      setErrorMessage(null);
      onSuccess();
    } else {
      setErrorMessage('Senha incorreta. Tente novamente.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'clear') {
      setPin('');
      setErrorMessage(null);
    } else if (val === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
      setErrorMessage(null);
    } else {
      setPin((prev) => prev + val);
      setErrorMessage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-sm bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 text-neutral-100 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">
              Acesso Protegido por Senha
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Digite a senha do administrador para gerenciar preços e ofertas
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <KeyRound className="w-4 h-4" />
            </div>

            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Digite a senha..."
              className="w-full pl-10 pr-10 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-center text-xl font-bold tracking-widest text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 shadow-inner"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMessage && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 bg-red-950/40 py-1.5 px-3 rounded-lg border border-red-800">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Touch-Friendly Numeric Keypad for Tablets & Mobiles */}
          <div className="grid grid-cols-3 gap-2 mt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className="py-3 bg-neutral-800/90 hover:bg-neutral-700 active:bg-amber-500 active:text-neutral-950 text-white font-bold text-lg rounded-xl border border-neutral-700 transition-all select-none"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKeypadPress('clear')}
              className="py-3 bg-neutral-800/60 hover:bg-neutral-700 text-neutral-400 hover:text-white font-semibold text-xs rounded-xl border border-neutral-700 transition-all uppercase select-none"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-3 bg-neutral-800/90 hover:bg-neutral-700 active:bg-amber-500 active:text-neutral-950 text-white font-bold text-lg rounded-xl border border-neutral-700 transition-all select-none"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('backspace')}
              className="py-3 bg-neutral-800/60 hover:bg-neutral-700 text-neutral-400 hover:text-white font-semibold text-xs rounded-xl border border-neutral-700 transition-all uppercase select-none"
            >
              ⌫
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-1"
          >
            <span>Entrar no Painel</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
