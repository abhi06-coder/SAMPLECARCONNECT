import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const AdminSidebar = () => {
    const location = useLocation();

    const links = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
        { name: 'Users', path: '/admin/users', icon: 'busts_in_silhouette' },
        { name: 'Analytics', path: '/admin/analytics', icon: 'chart_with_upwards_trend' },
        { name: 'Refunds', path: '/admin/refunds', icon: 'money_with_wings' },
        { name: 'Feedback', path: '/admin/feedback', icon: 'speech_balloon' },
        { name: 'Reports', path: '/admin/reports', icon: 'rotating_light' },
        { name: 'Announcements', path: '/admin/announcements', icon: 'loudspeaker' },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: 'scroll' },
    ];

    return (
        <div className="w-64 bg-card/50 backdrop-blur-md border-r border-border h-screen fixed left-0 top-0 pt-20 overflow-y-auto">
            <div className="px-6 py-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Admin Panel
                </h2>
            </div>
            <nav className="mt-6 px-4 space-y-2">
                {links.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-text-muted hover:text-text hover:bg-white/5'
                                }`}
                        >
                            <span className="text-xl">{link.icon === 'busts_in_silhouette' ? '👥' : link.icon === 'chart_with_upwards_trend' ? '📈' : link.icon === 'money_with_wings' ? '💸' : link.icon === 'speech_balloon' ? '💬' : link.icon === 'rotating_light' ? '🚨' : link.icon === 'loudspeaker' ? '📢' : link.icon === 'scroll' ? '📜' : link.icon}</span>
                            <span className="font-medium">{link.name}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute right-0 w-1 h-8 bg-primary rounded-l-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default AdminSidebar;
