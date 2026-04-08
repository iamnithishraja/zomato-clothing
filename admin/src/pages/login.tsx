import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AlertCircle, Eye, EyeOff, ArrowRight, Smartphone, Lock } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type LoginMode = 'password' | 'otp';
type OtpStep = 'phone' | 'verify';

interface PasswordForm { username: string; password: string; }
interface OtpForm { phone: string; otp: string; }

// ─── Sub-components ───────────────────────────────────────────────────────────
function InputField({
  id, label, type = 'text', placeholder, value, onChange,
  disabled, maxLength, required, minLength,
  rightElement,
}: {
  id: string; label: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  disabled?: boolean; maxLength?: number; required?: boolean; minLength?: number;
  rightElement?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#6F6F6F', fontFamily: "'DM Sans', sans-serif",
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id} type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled} maxLength={maxLength}
          required={required} minLength={minLength}
          style={{
            width: '100%', padding: rightElement ? '14px 48px 14px 16px' : '14px 16px',
            background: '#F9F9F7', border: '1.5px solid #E8E8E4',
            borderRadius: 10, fontSize: 15, color: '#2D2D2D',
            fontFamily: "'DM Sans', sans-serif", outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
            opacity: disabled ? 0.5 : 1,
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
          <div style={{
            position: 'absolute', right: 14, top: '50%',
            transform: 'translateY(-50%)',
          }}>{rightElement}</div>
        )}
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 8,
      background: 'rgba(226,55,68,0.08)', border: '1px solid rgba(226,55,68,0.2)',
      color: '#E23744', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    }}>
      <AlertCircle size={15} style={{ flexShrink: 0 }} />
      {message}
    </div>
  );
}

function PrimaryButton({ children, loading, loadingText }: {
  children: React.ReactNode; loading?: boolean; loadingText?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%', padding: '14px', borderRadius: 10, border: 'none',
        background: loading ? '#E8E8E4' : 'linear-gradient(135deg, #FFD700 0%, #FFC107 100%)',
        color: loading ? '#B0B0B0' : '#2D2D2D', fontSize: 15, fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif", cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: loading ? 'none' : '0 4px 15px rgba(255,215,0,0.4)',
        letterSpacing: '0.02em',
      }}
      onMouseEnter={e => {
        if (!loading) {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(255,215,0,0.5)';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = loading ? 'none' : '0 4px 15px rgba(255,215,0,0.4)';
      }}
    >
      {loading ? loadingText : children}
      {!loading && <ArrowRight size={16} />}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Login() {
  const [mode, setMode] = useState<LoginMode>('password');
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({ username: '', password: '' });
  const [otpForm, setOtpForm] = useState<OtpForm>({ phone: '', otp: '' });

  const { loginWithPassword, requestOTP, verifyOTP, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handlePasswordLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await loginWithPassword(passwordForm);
      navigate('/dashboard/analytics');
    } catch (err: any) { setError(err.message); }
  }, [passwordForm, loginWithPassword, navigate]);

  const handleOtpSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (otpStep === 'phone') {
        await requestOTP(otpForm.phone);
        setOtpStep('verify');
      } else {
        await verifyOTP(otpForm.phone, otpForm.otp);
        navigate('/dashboard/analytics');
      }
    } catch (err: any) { setError(err.message); }
  }, [otpStep, otpForm, requestOTP, verifyOTP, navigate]);

  const switchMode = useCallback((newMode: LoginMode) => {
    setMode(newMode);
    setError('');
    setOtpStep('phone');
    setOtpForm({ phone: '', otp: '' });
  }, []);

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
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .card-animate { animation: fadeUp 0.5s ease forwards; }
      `}</style>

      <div style={{
        minHeight: '100vh', display: 'flex',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        fontFamily: "'DM Sans', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative background elements */}
        <div style={{
          position: 'absolute', top: -150, right: -150,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, left: -100,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,193,7,0.1) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '20%',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }} />
        {/* Left Panel */}
        <div
          className="left-panel relative hidden min-h-screen w-full max-w-none flex-1 flex-col justify-between overflow-hidden bg-[#2D2D2D] p-10 sm:p-12 lg:flex xl:p-14"
        >
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', top: -80, right: -80,
            width: 300, height: 300, borderRadius: '50%',
            background: 'rgba(255,215,0,0.08)',
          }} />
          <div style={{
            position: 'absolute', bottom: 80, left: -60,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(226,55,68,0.12)',
          }} />
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,215,0,0.1)', padding: '8px 16px',
              borderRadius: 40, border: '1px solid rgba(255,215,0,0.2)',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD700' }} />
              <span style={{ color: '#FFD700', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>
                ADMIN PORTAL
              </span>
            </div>
          </div>
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 48, fontWeight: 900, color: '#FFFFFF',
              lineHeight: 1.1, marginBottom: 20,
            }}>
              Manage your<br />
              <span style={{ color: '#FFD700' }}>empire</span><br />
              with ease.
            </h2>
            <p style={{ color: '#6F6F6F', fontSize: 16, lineHeight: 1.6 }}>
              Full control over users, stores, products and orders — all in one place.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['2,543', 'Users'], ['145', 'Stores'], ['892', 'Orders']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#FFD700', fontFamily: "'Playfair Display', serif" }}>{n}</div>
                <div style={{ fontSize: 12, color: '#6F6F6F', letterSpacing: '0.06em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '24px',
        }}>
          <div className="card-animate" style={{
            width: '100%', maxWidth: 420,
            background: '#FFFFFF', borderRadius: 20,
            border: '1px solid #EBEBEB',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}>
            {/* Card Header */}
            <div style={{
              padding: '36px 36px 24px',
              borderBottom: '1px solid #F4F4F2',
              background: 'linear-gradient(135deg, #FAFAF8 0%, #FFFFFF 100%)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #FFD700, #FFC107)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#2D2D2D', fontWeight: 900, fontSize: 16, fontFamily: "'Playfair Display', serif" }}>L</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2D2D2D', letterSpacing: '0.05em' }}>
                  LOCALS ADMIN
                </span>
              </div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 30, fontWeight: 900, color: '#2D2D2D',
                margin: 0, lineHeight: 1.2,
              }}>
                Welcome back
              </h1>
              <p style={{ color: '#6F6F6F', fontSize: 14, marginTop: 6 }}>
                Sign in to your admin dashboard
              </p>
            </div>

            {/* Mode Toggle */}
            <div style={{ padding: '16px 36px 0' }}>
              <div style={{
                display: 'flex', background: '#F4F4F2',
                borderRadius: 10, padding: 4, gap: 4,
              }}>
                {(['password', 'otp'] as LoginMode[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                      background: mode === m ? '#FFFFFF' : 'transparent',
                      boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                      color: mode === m ? '#2D2D2D' : '#6F6F6F',
                      fontSize: 13, fontWeight: mode === m ? 700 : 500,
                      cursor: 'pointer', transition: 'all 0.2s',
                      fontFamily: "'DM Sans', sans-serif",
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 6,
                    }}
                  >
                    {m === 'password' ? <Lock size={13} /> : <Smartphone size={13} />}
                    {m === 'password' ? 'Password' : 'OTP'}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Body */}
            <div style={{ padding: '24px 36px 36px' }}>
              {mode === 'password' ? (
                <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <InputField
                    id="username" label="Username or Email"
                    placeholder="Enter your username or email"
                    value={passwordForm.username}
                    onChange={v => setPasswordForm(f => ({ ...f, username: v }))}
                    required
                  />
                  <InputField
                    id="password" label="Password" type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={passwordForm.password}
                    onChange={v => setPasswordForm(f => ({ ...f, password: v }))}
                    required
                    rightElement={
                      <button type="button" onClick={() => setShowPassword(s => !s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6F6F6F', padding: 0, display: 'flex' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />
                  {error && <ErrorBanner message={error} />}
                  <div style={{ height: 4 }} />
                  <PrimaryButton loading={isLoading} loadingText="Signing in...">
                    Sign In
                  </PrimaryButton>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {otpStep === 'verify' && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
                      fontSize: 13, color: '#2D2D2D',
                    }}>
                      OTP sent to <strong>{otpForm.phone}</strong>
                    </div>
                  )}
                  <InputField
                    id="phone" label="Phone Number" type="tel"
                    placeholder="+91 98765 43210"
                    value={otpForm.phone}
                    onChange={v => setOtpForm(f => ({ ...f, phone: v }))}
                    disabled={otpStep === 'verify'}
                    required
                  />
                  {otpStep === 'verify' && (
                    <InputField
                      id="otp" label="6-Digit OTP" type="text"
                      placeholder="Enter OTP"
                      value={otpForm.otp}
                      onChange={v => setOtpForm(f => ({ ...f, otp: v }))}
                      maxLength={6} required
                    />
                  )}
                  {error && <ErrorBanner message={error} />}
                  <div style={{ height: 4 }} />
                  <PrimaryButton
                    loading={isLoading}
                    loadingText={otpStep === 'phone' ? 'Sending...' : 'Verifying...'}
                  >
                    {otpStep === 'phone' ? 'Send OTP' : 'Verify OTP'}
                  </PrimaryButton>
                  {otpStep === 'verify' && (
                    <button type="button"
                      onClick={() => { setOtpStep('phone'); setError(''); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#6F6F6F', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                        textAlign: 'center',
                      }}>
                      Didn't receive it? <span style={{ color: '#2D2D2D', fontWeight: 600 }}>Resend OTP</span>
                    </button>
                  )}
                </form>
              )}

              <div style={{
                marginTop: 24, paddingTop: 20,
                borderTop: '1px solid #F4F4F2',
                textAlign: 'center', fontSize: 13, color: '#6F6F6F',
              }}>
                Don't have an account?{' '}
                <Link to="/signup" style={{ color: '#FFD700', fontWeight: 600, textDecoration: 'none' }}>
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}