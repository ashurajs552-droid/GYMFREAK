import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Activity, Target, Zap, Shield, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';

const Landing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="landing-page" style={{
            background: 'var(--bg-color)',
            minHeight: '100vh',
            color: 'var(--text-primary)',
            overflowX: 'hidden'
        }}>
            {/* Navigation */}
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 5%',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: 'rgba(15, 17, 21, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--glass-border)'
            }}>
                <div className="logo" style={{ fontSize: '1.5rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Dumbbell color="var(--primary-color)" size={32} />
                    <span>GYM FREAK</span>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <Link to="/login" className="btn btn-secondary" style={{ padding: '10px 25px', borderRadius: '30px' }}>Login</Link>
                    <Link to="/register" className="btn btn-primary" style={{ padding: '10px 25px', borderRadius: '30px' }}>Join Now</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                padding: '160px 5% 100px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                background: 'radial-gradient(circle at center, rgba(204, 255, 0, 0.05) 0%, transparent 70%)'
            }}>
                <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(204, 255, 0, 0.1)',
                        padding: '8px 16px',
                        borderRadius: '30px',
                        color: 'var(--primary-color)',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        marginBottom: '24px'
                    }}>
                        <Zap size={16} /> THE ULTIMATE FITNESS COMPANION
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                        fontWeight: '900',
                        lineHeight: '1.1',
                        marginBottom: '24px',
                        letterSpacing: '-2px'
                    }}>
                        TRANSFORM YOUR <span className="text-gradient">BODY</span>,<br />
                        MASTER YOUR <span style={{ color: 'var(--secondary-color)' }}>LIFE</span>.
                    </h1>
                    <p style={{
                        fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                        color: 'var(--text-secondary)',
                        maxWidth: '700px',
                        margin: '0 auto 40px',
                        lineHeight: '1.6'
                    }}>
                        Track your workouts, monitor your nutrition with our massive Indian food database, and get AI-powered insights to reach your goals faster than ever.
                    </p>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="btn btn-primary" style={{
                            padding: '18px 40px',
                            fontSize: '1.1rem',
                            borderRadius: '50px',
                            boxShadow: '0 10px 30px rgba(204, 255, 0, 0.3)'
                        }}>
                            Start Free Trial <ArrowRight size={20} style={{ marginLeft: '10px' }} />
                        </Link>
                        <Link to="/login" className="btn btn-secondary" style={{
                            padding: '18px 40px',
                            fontSize: '1.1rem',
                            borderRadius: '50px'
                        }}>
                            View Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section style={{ padding: '60px 5%', background: 'var(--surface-color)' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '40px',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {[
                        { label: 'Active Users', value: '50K+' },
                        { label: 'Workouts Logged', value: '2M+' },
                        { label: 'Indian Food Items', value: '500+' },
                        { label: 'Success Stories', value: '10K+' }
                    ].map((stat, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary-color)' }}>{stat.value}</div>
                            <div style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '100px 5%' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>Everything You Need</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Powerful tools designed to keep you motivated and on track.</p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '30px',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {[
                        {
                            icon: <Activity color="var(--primary-color)" size={32} />,
                            title: 'Workout Tracking',
                            desc: 'Log every set, rep, and weight. Track your progressive overload with detailed history and charts.'
                        },
                        {
                            icon: <Target color="var(--secondary-color)" size={32} />,
                            title: 'Nutrition Management',
                            desc: 'Massive database of Indian foods. Track calories, protein, carbs, and fats with ease.'
                        },
                        {
                            icon: <TrendingUp color="#ff4d4d" size={32} />,
                            title: 'Progress Analytics',
                            desc: 'Visualize your journey with beautiful charts. See your strength gains and weight trends over time.'
                        },
                        {
                            icon: <Zap color="#ffe600" size={32} />,
                            title: 'AI Smart Estimates',
                            desc: 'Can\'t find a food or exercise? Our AI will estimate the nutritional values or MET for you instantly.'
                        },
                        {
                            icon: <Shield color="#00cc66" size={32} />,
                            title: 'Personalized Goals',
                            desc: 'Set custom targets for weight loss, muscle gain, or maintenance based on your body metrics.'
                        },
                        {
                            icon: <CheckCircle2 color="var(--primary-color)" size={32} />,
                            title: 'Daily Insights',
                            desc: 'Get daily motivation and pro tips from our virtual coach to keep you pushing forward.'
                        }
                    ].map((feature, i) => (
                        <div key={i} className="card" style={{
                            padding: '40px',
                            textAlign: 'left',
                            transition: 'all 0.3s ease',
                            cursor: 'default'
                        }}>
                            <div style={{ marginBottom: '20px' }}>{feature.icon}</div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{feature.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                padding: '100px 5%',
                textAlign: 'center',
                background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '30px',
                margin: '0 5% 100px',
                color: '#fff'
            }}>
                <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '24px' }}>Ready to Crush Your Goals?</h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '40px', opacity: 0.9 }}>Join thousands of others who have transformed their lives with Gym Freak.</p>
                <Link to="/register" className="btn btn-primary" style={{
                    padding: '20px 50px',
                    fontSize: '1.2rem',
                    borderRadius: '50px',
                    boxShadow: '0 10px 30px rgba(204, 255, 0, 0.4)'
                }}>
                    Get Started Now
                </Link>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '60px 5%',
                borderTop: '1px solid var(--glass-border)',
                textAlign: 'center',
                color: 'var(--text-secondary)'
            }}>
                <div className="logo" style={{ fontSize: '1.5rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '20px', color: 'var(--text-primary)' }}>
                    <Dumbbell color="var(--primary-color)" size={24} />
                    <span>GYM FREAK</span>
                </div>
                <p>© 2026 Gym Freak. All rights reserved.</p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
                    <a href="#" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</a>
                    <a href="#" style={{ color: 'var(--text-secondary)' }}>Terms of Service</a>
                    <a href="#" style={{ color: 'var(--text-secondary)' }}>Contact Us</a>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
