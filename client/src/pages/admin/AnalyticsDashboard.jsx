import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminStatCard = ({ title, value, icon, color }) => (
    <div className="bg-card border border-border rounded-xl p-6 flex items-center shadow-sm">
        <div className={`p-4 rounded-full mr-4 ${color} bg-opacity-10 text-2xl`}>
            {icon}
        </div>
        <div>
            <h3 className="text-sm font-medium text-text-muted">{title}</h3>
            <p className="text-2xl font-bold text-text">{value}</p>
        </div>
    </div>
);

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/admin/analytics');
                setData(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading Analytics...</div>;
    if (!data) return <div>No Data Available</div>;

    const { kpis, charts } = data;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Ride Analytics</h1>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard
                    title="Total Rides"
                    value={kpis.totalRides}
                    icon="🚗"
                    color="bg-blue-500 text-blue-500"
                />
                <AdminStatCard
                    title="Completed"
                    value={kpis.completedRides}
                    icon="✅"
                    color="bg-green-500 text-green-500"
                />
                <AdminStatCard
                    title="Cancelled"
                    value={kpis.cancelledRides}
                    icon="🚫"
                    color="bg-red-500 text-red-500"
                />
                <AdminStatCard
                    title="Avg. Occupancy"
                    value={`${kpis.avgOccupancy}%`}
                    icon="👥"
                    color="bg-purple-500 text-purple-500"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Rides Over Time</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.ridesOverTime}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="_id" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
                                    itemStyle={{ color: '#f3f4f6' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Placeholder for District Chart since data wasn't fully implemented in backend yet or simulated */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-center">
                    <p className="text-text-muted">More charts coming soon...</p>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
