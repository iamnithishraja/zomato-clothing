import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LogOut,
  Users, Truck,
  ChevronRight, Bell,
  BarChart3, DollarSign, ClipboardList, Store,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

// ─── Menu Config ──────────────────────────────────────────────────────────────
const MENU_ITEMS: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: BarChart3, label: 'Analytics Overview', href: '/dashboard/analytics' },
  { icon: DollarSign, label: 'Revenue & Financial', href: '/dashboard/revenue' },
  { icon: ClipboardList, label: 'Order Management', href: '/dashboard/orders' },
  { icon: Users, label: 'User Management', href: '/dashboard/users' },
  { icon: Truck, label: 'Delivery Partners', href: '/dashboard/delivery' },
  { icon: Store, label: 'Store Performance', href: '/dashboard/stores' },
];

// ─── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ item, isActive }: { item: MenuItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
        background: isActive ? '#FFD700' : 'transparent',
        transition: 'all 0.15s',
        marginBottom: 2,
      }}
      onMouseEnter={e => {
        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = '#F4F4F2';
      }}
      onMouseLeave={e => {
        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: isActive ? 'rgba(45,45,45,0.12)' : '#F4F4F2',
          transition: 'background 0.15s',
        }}>
          <Icon size={16} color={isActive ? '#2D2D2D' : '#6F6F6F'} />
        </div>
        <span style={{
          fontSize: 14, fontWeight: isActive ? 700 : 500,
          color: isActive ? '#2D2D2D' : '#6F6F6F',
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: isActive ? '-0.01em' : 0,
        }}>
          {item.label}
        </span>
      </div>
      {item.badge ? (
        <span style={{
          background: isActive ? '#2D2D2D' : '#E23744',
          color: '#FFFFFF', fontSize: 10, fontWeight: 700,
          padding: '2px 7px', borderRadius: 20, minWidth: 20, textAlign: 'center',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {item.badge}
        </span>
      ) : isActive ? (
        <ChevronRight size={14} color="#2D2D2D" />
      ) : null}
    </Link>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: 'linear-gradient(135deg, #E23744, #830B15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#FFFFFF', fontSize: 13, fontWeight: 800,
      fontFamily: "'Playfair Display', serif",
    }}>
      {initials || 'A'}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar() {
  const location = useLocation();
  const { admin, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const currentPath = location.pathname;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .sidebar-animate { animation: slideIn 0.35s ease forwards; }
      `}</style>

      <div className="sidebar-animate" style={{
        width: 240, background: '#FFFFFF',
        borderRight: '1px solid #EBEBEB',
        height: '100vh', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0,
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Brand Header */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #F4F4F2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #FFD700, #FFC107)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255,215,0,0.35)',
            }}>
              <span style={{
                color: '#2D2D2D', fontWeight: 900, fontSize: 18,
                fontFamily: "'Playfair Display', serif",
              }}>L</span>
            </div>
            <div>
              <div style={{
                fontSize: 15, fontWeight: 800, color: '#2D2D2D',
                letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>Locals</div>
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#B0B0B0',
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>Admin Console</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#B0B0B0',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '0 12px', marginBottom: 10,
          }}>
            Navigation
          </div>
          {MENU_ITEMS.map(item => (
            <NavItem
              key={item.href}
              item={item}
              isActive={
                item.href === '/dashboard'
                  ? currentPath === '/dashboard'
                  : currentPath.startsWith(item.href)
              }
            />
          ))}
        </nav>

        {/* Notification strip */}
        <div style={{ padding: '0 12px 12px' }}>
          <div style={{
            padding: '12px', borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,193,7,0.08))',
            border: '1px solid rgba(255,215,0,0.3)',
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,215,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Bell size={15} color="#E6C200" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2D2D2D' }}>15 pending alerts</div>
              <div style={{ fontSize: 11, color: '#6F6F6F' }}>View notifications</div>
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid #F4F4F2' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 10px', borderRadius: 10,
            marginBottom: 4,
          }}>
            <Avatar name={admin?.username ?? 'Admin'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: '#2D2D2D',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {admin?.username ?? 'Admin'}
              </div>
              <div style={{
                fontSize: 11, color: '#B0B0B0',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {admin?.email ?? ''}
              </div>
            </div>
          </div>

          {!showLogoutConfirm ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px', borderRadius: 8, border: 'none',
                background: 'transparent', cursor: 'pointer',
                color: '#6F6F6F', fontSize: 13, fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(226,55,68,0.08)';
                (e.currentTarget as HTMLButtonElement).style.color = '#E23744';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#6F6F6F';
              }}
            >
              <LogOut size={16} /> Sign out
            </button>
          ) : (
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(226,55,68,0.06)', border: '1px solid rgba(226,55,68,0.15)',
            }}>
              <p style={{ fontSize: 12, color: '#E23744', fontWeight: 600, margin: '0 0 8px' }}>
                Sign out?
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={logout}
                  style={{
                    flex: 1, padding: '6px', borderRadius: 6, border: 'none',
                    background: '#E23744', color: '#FFFFFF',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                  Yes
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{
                    flex: 1, padding: '6px', borderRadius: 6,
                    border: '1px solid #E0E0E0', background: '#FFFFFF',
                    color: '#6F6F6F', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}