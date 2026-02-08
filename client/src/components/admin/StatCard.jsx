import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';

const StatCard = ({ title, value, icon, trend, trendValue, color = "primary" }) => {
    const colorClasses = {
        primary: "bg-primary/10 text-primary",
        secondary: "bg-secondary/10 text-secondary",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        info: "bg-info/10 text-info"
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-surface border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-sm font-medium text-text-muted mb-1">{title}</h3>
                    <div className="text-2xl font-bold font-heading">{value}</div>
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>

            {(trend || trendValue) && (
                <div className="flex items-center text-xs font-medium">
                    <span className={`flex items-center ${trend === 'up' ? 'text-success' : 'text-error'}`}>
                        {trend === 'up' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                        {trendValue}
                    </span>
                    <span className="text-text-muted ml-2">vs last month</span>
                </div>
            )}
        </motion.div>
    );
};

export default StatCard;
