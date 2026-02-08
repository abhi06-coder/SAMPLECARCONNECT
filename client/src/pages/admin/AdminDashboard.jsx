import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import StatCard from '../../components/admin/StatCard';
import { Users, Car, Calendar, DollarSign, Activity, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button'; // Assuming we might need buttons later or for consistency

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data } = await api.get('/admin/dashboard');
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-20 bg-neutral/50 rounded-2xl w-full"></div>
                <div className="grid grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-neutral/50 rounded-2xl"></div>)}
                </div>
                <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 h-64 bg-neutral/50 rounded-2xl"></div>
                    <div className="h-64 bg-neutral/50 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    if (!stats) return <div className="text-center py-10 text-text-muted">Failed to load dashboard data.</div>;

    const { kpis, recentActivity, attentionNeeded } = stats;

    return (
        <div>
            <AdminPageHeader
                title="Dashboard"
                subtitle="Overview of platform performance and key metrics."
            />

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Users"
                    value={kpis.totalUsers.toLocaleString()}
                    icon={<Users className="w-6 h-6" />}
                    // trend="up" // Dynamic trend logic can be added later if historical data exists
                    // trendValue="-" 
                    color="primary"
                />
                <StatCard
                    title="Active Rides"
                    value={kpis.activeRides.toLocaleString()}
                    icon={<Car className="w-6 h-6" />}
                    color="success"
                />
                <StatCard
                    title="Total Bookings"
                    value={kpis.totalBookings.toLocaleString()}
                    icon={<Calendar className="w-6 h-6" />}
                    color="info"
                />
                <StatCard
                    title="Total Revenue"
                    value={`₹${kpis.totalRevenue.toLocaleString()}`}
                    icon={<DollarSign className="w-6 h-6" />}
                    color="warning"
                />
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold font-heading flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Recent Rides
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {recentActivity.length === 0 ? (
                            <p className="text-text-muted text-sm">No recent activity.</p>
                        ) : (
                            recentActivity.map((ride) => (
                                <div key={ride._id} className="flex items-start gap-4 p-3 hover:bg-neutral rounded-xl transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-neutral-foreground/5 flex items-center justify-center text-lg">
                                        🚗
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-text">
                                            New ride offered: <span className="font-bold">{ride.source.name} → {ride.destination.name}</span>
                                        </p>
                                        <p className="text-xs text-text-muted">
                                            By {ride.driver?.name || "Unknown"} • {new Date(ride.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                                        ₹{ride.price}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Alerts / Tasks */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-surface border border-border rounded-2xl p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold font-heading flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-error" />
                            Attention Needed
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {attentionNeeded.pendingRefunds > 0 && (
                            <div className="p-4 bg-error/5 border border-error/10 rounded-xl">
                                <h4 className="text-sm font-bold text-error mb-1">{attentionNeeded.pendingRefunds} Refund Requests</h4>
                                <p className="text-xs text-text-muted">Pending approval.</p>
                            </div>
                        )}
                        {attentionNeeded.pendingReports > 0 && (
                            <div className="p-4 bg-warning/5 border border-warning/10 rounded-xl">
                                <h4 className="text-sm font-bold text-warning mb-1">{attentionNeeded.pendingReports} User Reports</h4>
                                <p className="text-xs text-text-muted">Requires review.</p>
                            </div>
                        )}
                        {attentionNeeded.pendingRefunds === 0 && attentionNeeded.pendingReports === 0 && (
                            <div className="p-4 bg-success/5 border border-success/10 rounded-xl text-center">
                                <h4 className="text-sm font-bold text-success mb-1">All Caught Up!</h4>
                                <p className="text-xs text-text-muted">No pending items requiring attention.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
