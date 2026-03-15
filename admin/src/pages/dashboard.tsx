import { useMemo } from 'react';
import {
  BarChart3, DollarSign, ClipboardList,
  Users, Truck, Store, Rocket,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type SectionType = 'analytics' | 'revenue' | 'orders' | 'users' | 'delivery' | 'stores';

interface DashboardProps {
  section?: SectionType;
}

// ─── Section Config ───────────────────────────────────────────────────────────
const SECTIONS = {
  analytics: {
    title: 'Analytics Overview',
    icon: BarChart3,
    color: '#6366F1',
    description: 'The landing page of the dashboard. Gives the founder an instant snapshot of platform health.',
    features: [
      'Total orders, total users, total stores, total delivery partners — displayed as metric cards',
      'Orders chart — toggle between daily, weekly, and monthly views',
      'New user registrations — total count and new users in the last 30 days',
      'Category-wise sales breakdown — chart showing which clothing categories sell most',
    ],
  },
  revenue: {
    title: 'Revenue & Financial',
    icon: DollarSign,
    color: '#10B981',
    description: 'A complete financial overview of the platform.',
    features: [
      'Gross Merchandise Value (GMV) — total value of all orders processed',
      'Platform commission earned — calculated from all completed orders',
      'Total successful payments and total failed payments — summary cards',
      'Razorpay payment logs table — Order ID, amount, payment status, and date',
      'Failed transactions clearly highlighted for quick action',
    ],
  },
  orders: {
    title: 'Order Management',
    icon: ClipboardList,
    color: '#F59E0B',
    description: 'Full visibility into every order on the platform with the ability to intervene when needed.',
    features: [
      'Filter orders by status: All, Pending, Confirmed, Picked, In Transit, Delivered, Cancelled',
      'Orders table — Order ID, customer name, merchant store, amount, status badge, date',
      'Click any order to expand and view the full status timeline with timestamps',
      'Force cancel option available on stuck or pending orders',
    ],
  },
  users: {
    title: 'User Management',
    icon: Users,
    color: '#EC4899',
    description: 'A clear view of all registered users across every role.',
    features: [
      'Total user counts broken down by role — Customers, Merchants, Delivery Partners',
      'New users joined in the last 30 days',
      'Filter by role — All, Customer, Merchant, Delivery',
      'Users table — Name, phone/email, role badge, profile completion status, joined date',
    ],
  },
  delivery: {
    title: 'Delivery Partner Management',
    icon: Truck,
    color: '#8B5CF6',
    description: 'Monitor all delivery partners and their real-time availability.',
    features: [
      'Summary cards — Active now, Offline, and Busy counts',
      'Delivery partners table — Name, phone, current status (online / offline / busy)',
      'Current order ID shown for partners who are currently on a delivery',
      'Partner rating displayed alongside availability status',
    ],
  },
  stores: {
    title: 'Store Performance',
    icon: Store,
    color: '#EF4444',
    description: 'Side-by-side performance data for every merchant store on the platform.',
    features: [
      'Store performance table — Store name, owner, total orders, total revenue, average rating, return rate',
      'Sortable columns — sort by revenue, number of orders, or rating',
      'Quick comparison of all merchants in one view',
    ],
  },
};

// ─── Coming Soon Card ─────────────────────────────────────────────────────────
function ComingSoonCard({ sectionKey }: { sectionKey: SectionType }) {
  const section = SECTIONS[sectionKey];
  const Icon = section.icon;
  
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 20,
      border: '1px solid #EBEBEB', padding: '48px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      maxWidth: 700, margin: '0 auto',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: `${section.color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
      }}>
        <Icon size={36} color={section.color} />
      </div>
      
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 32, fontWeight: 900, color: '#2D2D2D',
        textAlign: 'center', margin: '0 0 12px',
      }}>
        {section.title}
      </h2>
      
      <p style={{
        fontSize: 15, color: '#6F6F6F', textAlign: 'center',
        maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.6,
      }}>
        {section.description}
      </p>
      
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'linear-gradient(135deg, #FFD700, #FFC107)',
        padding: '12px 24px', borderRadius: 40,
        margin: '0 auto 32px', justifyContent: 'center',
        width: 'fit-content',
        boxShadow: '0 4px 15px rgba(255,215,0,0.4)',
      }}>
        <Rocket size={18} color="#2D2D2D" />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#2D2D2D', letterSpacing: '0.02em' }}>
          Coming Soon
        </span>
      </div>
      
      <div style={{
        background: '#FAFAF8', borderRadius: 16,
        padding: '24px', border: '1px solid #F4F4F2',
      }}>
        <h3 style={{
          fontSize: 13, fontWeight: 700, color: '#B0B0B0',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          Planned Features
        </h3>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {section.features.map((feature, i) => (
            <li key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 0',
              borderBottom: i < section.features.length - 1 ? '1px solid #EBEBEB' : 'none',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: section.color, marginTop: 7, flexShrink: 0,
              }} />
              <span style={{ fontSize: 14, color: '#4A4A4A', lineHeight: 1.5 }}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Dashboard Home ───────────────────────────────────────────────────────────
function DashboardHome() {
  const greetingHour = new Date().getHours();
  const greeting = useMemo(() => {
    if (greetingHour < 12) return 'Good morning';
    if (greetingHour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [greetingHour]);

  const sectionKeys = Object.keys(SECTIONS) as SectionType[];

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, color: '#B0B0B0', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 4 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            </p>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 36, fontWeight: 900, color: '#2D2D2D', margin: 0, lineHeight: 1.1,
            }}>
              {greeting} 👋
            </h1>
            <p style={{ color: '#6F6F6F', fontSize: 15, marginTop: 6 }}>
              Welcome to Locals Admin Dashboard. Select a section from the sidebar to get started.
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 40,
            background: 'rgba(40,167,69,0.1)', border: '1px solid rgba(40,167,69,0.2)',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#28A745',
              boxShadow: '0 0 0 3px rgba(40,167,69,0.3)',
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#28A745' }}>Live</span>
          </div>
        </div>
      </div>

      {/* Section Cards Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
      }}>
        {sectionKeys.map((key) => {
          const section = SECTIONS[key];
          const Icon = section.icon;
          return (
            <div key={key} style={{
              background: '#FFFFFF', borderRadius: 16,
              border: '1px solid #EBEBEB', padding: '24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${section.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={22} color={section.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 18, fontWeight: 700, color: '#2D2D2D', margin: 0,
                    }}>
                      {section.title}
                    </h3>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#FFD700',
                      background: 'rgba(255,215,0,0.15)', padding: '4px 10px',
                      borderRadius: 20, letterSpacing: '0.05em',
                    }}>
                      COMING SOON
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6F6F6F', margin: 0, lineHeight: 1.5 }}>
                    {section.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard({ section }: DashboardProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stat-card { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      <div style={{
        padding: '32px 36px', background: '#FAFAF8',
        minHeight: '100%', fontFamily: "'DM Sans', sans-serif",
      }}>
        {section ? (
          <ComingSoonCard sectionKey={section} />
        ) : (
          <DashboardHome />
        )}
      </div>
    </>
  );
}