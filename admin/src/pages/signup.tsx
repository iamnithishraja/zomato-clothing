import { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AlertCircle, Eye, EyeOff, ArrowRight, Check, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SignupForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

// ─── Password Strength ────────────────────────────────────────────────────────
function getPasswordStrength(password: string): {
  score: number; label: string; color: string;
} {
  if (!password) return { score: 0, label: '', color: '#E0E0E0' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const map = [
    { score: 1, label: 'Weak', color: '#E23744' },
    { score: 2, label: 'Fair', color: '#FFC107' },
    { score: 3, label: 'Good', color: '#17A2B8' },
    { score: 4, label: 'Strong', color: '#28A745' },
  ];
  return map[score - 1] ?? { score: 0, label: 'Too short', color: '#E23744' };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= strength.score ? strength.color : '#E8E8E4',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      {strength.label && (
        <span style={{ fontSize: 11, color: strength.color, fontWeight: 600, letterSpacing: '0.05em' }}>
          {strength.label}
        </span>
      )}
    </div>
  );
}

// ─── Field Component ──────────────────────────────────────────────────────────
function InputField({
  id, label, type = 'text', placeholder, value, onChange,
  required, minLength, badge, rightElement,
}: {
  id: string; label: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  required?: boolean; minLength?: number;
  badge?: string; rightElement?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label htmlFor={id} style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#6F6F6F', fontFamily: "'DM Sans', sans-serif",
        }}>{label}</label>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 600, color: '#B0B0B0',
            background: '#F4F4F2', padding: '2px 7px', borderRadius: 20,
            letterSpacing: '0.05em',
          }}>{badge}</span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          id={id} type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          required={required} minLength={minLength}
          style={{
            width: '100%', padding: rightElement ? '13px 48px 13px 16px' : '13px 16px',
            background: '#F9F9F7', border: '1.5px solid #E8E8E4',
            borderRadius: 10, fontSize: 14, color: '#2D2D2D',
            fontFamily: "'DM Sans', sans-serif", outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={e => {
            e.target.style.borderColor = '#FFD700';
            e.target.style.boxShadow = '0 0 0 3px rgba(255,215,0,0.15)';
          }}
          onBlur={e => {
            e.target.style.borderColor = '#E8E8E4';
            e.target.style.boxShadow = 'none';
          }}
        />
        {rightElement && (
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Password Match Indicator ─────────────────────────────────────────────────
function PasswordMatch({ password, confirm }: { password: string; confirm: string }) {
  if (!confirm) return null;
  const match = password === confirm;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: 12, color: match ? '#28A745' : '#E23744', fontWeight: 500,
      marginTop: 4,
    }}>
      {match ? <Check size={13} /> : <X size={13} />}
      {match ? 'Passwords match' : 'Passwords do not match'}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Signup() {
  const [form, setForm] = useState<SignupForm>({
    username: '', email: '', password: '', confirmPassword: '', phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const { signup, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const update = useCallback(<K extends keyof SignupForm>(key: K, value: SignupForm[K]) => {
    setForm(f => ({ ...f, [key]: value }));
  }, []);

  const canProceedStep1 = form.username.length >= 3 && form.email.includes('@');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceedStep1) setStep(2);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    try {
      await signup({
        username: form.username, email: form.email,
        password: form.password, phone: form.phone || undefined,
      });
      navigate('/dashboard');
    } catch (err: any) { setError(err.message); }
  }, [form, signup, navigate]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #B0B0B0; }
        input { -webkit-appearance: none; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-animate { animation: fadeUp 0.5s ease forwards; }
      `}</style>

      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        fontFamily: "'DM Sans', sans-serif", padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative background elements */}
        <div style={{
          position: 'absolute', top: -150, left: -150,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, right: -100,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,193,7,0.1) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', top: '30%', right: '15%',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        }} />
        <div className="card-animate" style={{
          width: '100%', maxWidth: 460,
          background: '#FFFFFF', borderRadius: 20,
          border: '1px solid #EBEBEB',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '36px 36px 24px',
            borderBottom: '1px solid #F4F4F2',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #FFD700, #FFC107)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#2D2D2D', fontWeight: 900, fontSize: 16, fontFamily: "'Playfair Display', serif" }}>L</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2D2D2D', letterSpacing: '0.05em' }}>LOCALS ADMIN</span>
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 30, fontWeight: 900, color: '#2D2D2D', margin: 0, lineHeight: 1.2,
            }}>Create account</h1>
            <p style={{ color: '#6F6F6F', fontSize: 14, marginTop: 6 }}>
              Set up your admin credentials
            </p>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
              {[1, 2].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                    background: step >= s ? '#FFD700' : '#F4F4F2',
                    color: step >= s ? '#2D2D2D' : '#B0B0B0',
                    transition: 'all 0.3s',
                  }}>
                    {step > s ? <Check size={14} /> : s}
                  </div>
                  <span style={{ fontSize: 12, color: step === s ? '#2D2D2D' : '#B0B0B0', fontWeight: step === s ? 600 : 400 }}>
                    {s === 1 ? 'Account Info' : 'Security'}
                  </span>
                  {s < 2 && <div style={{ width: 24, height: 1, background: step > s ? '#FFD700' : '#E8E8E4' }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div style={{ padding: '28px 36px 36px' }}>
            {step === 1 ? (
              <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <InputField
                  id="username" label="Username"
                  placeholder="Choose a username (min 3 chars)"
                  value={form.username}
                  onChange={v => update('username', v)}
                  required minLength={3}
                />
                <InputField
                  id="email" label="Email Address" type="email"
                  placeholder="admin@company.com"
                  value={form.email}
                  onChange={v => update('email', v)}
                  required
                />
                <InputField
                  id="phone" label="Phone Number" type="tel"
                  badge="Optional"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={v => update('phone', v)}
                />
                <div style={{ height: 4 }} />
                <button
                  type="submit"
                  disabled={!canProceedStep1}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                    background: canProceedStep1
                      ? 'linear-gradient(135deg, #FFD700 0%, #FFC107 100%)'
                      : '#F4F4F2',
                    color: canProceedStep1 ? '#2D2D2D' : '#B0B0B0',
                    fontSize: 15, fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: canProceedStep1 ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: canProceedStep1 ? '0 4px 15px rgba(255,215,0,0.4)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  Continue <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <InputField
                    id="password" label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={v => update('password', v)}
                    required minLength={6}
                    rightElement={
                      <button type="button" onClick={() => setShowPassword(s => !s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6F6F6F', padding: 0, display: 'flex' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />
                  <PasswordStrengthBar password={form.password} />
                </div>
                <div>
                  <InputField
                    id="confirmPassword" label="Confirm Password" type="password"
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={v => update('confirmPassword', v)}
                    required minLength={6}
                  />
                  <PasswordMatch password={form.password} confirm={form.confirmPassword} />
                </div>

                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(226,55,68,0.08)', border: '1px solid rgba(226,55,68,0.2)',
                    color: '#E23744', fontSize: 13,
                  }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button"
                    onClick={() => setStep(1)}
                    style={{
                      flex: '0 0 auto', padding: '14px 20px', borderRadius: 10,
                      border: '1.5px solid #E8E8E4', background: 'transparent',
                      color: '#6F6F6F', fontSize: 14, fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                    }}>
                    Back
                  </button>
                  <button type="submit" disabled={isLoading}
                    style={{
                      flex: 1, padding: '14px', borderRadius: 10, border: 'none',
                      background: isLoading ? '#E8E8E4' : 'linear-gradient(135deg, #FFD700 0%, #FFC107 100%)',
                      color: isLoading ? '#B0B0B0' : '#2D2D2D',
                      fontSize: 15, fontWeight: 700,
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: isLoading ? 'none' : '0 4px 15px rgba(255,215,0,0.4)',
                    }}>
                    {isLoading ? 'Creating...' : (<>Create Account <ArrowRight size={16} /></>)}
                  </button>
                </div>
              </form>
            )}

            <div style={{
              marginTop: 24, paddingTop: 20, borderTop: '1px solid #F4F4F2',
              textAlign: 'center', fontSize: 13, color: '#6F6F6F',
            }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#FFD700', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}