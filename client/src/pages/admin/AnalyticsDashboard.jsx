import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import StatCard from '../../components/admin/StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Car, CheckCircle, XCircle, Users, Download } from 'lucide-react';
import Button from '../../components/ui/Button';

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

    if (loading) return (
        <div className="space-y-6 animate-pulse">
            <div className="h-20 bg-neutral/50 rounded-2xl w-full"></div>
            <div className="grid grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-neutral/50 rounded-2xl"></div>)}
            </div>
        </div>
    );

    if (!data) return <div>No Data Available</div>;

    const { kpis, charts } = data;

    return (
        <div className="space-y-8">
            <AdminPageHeader
                title="Ride Analytics"
                subtitle="Deep dive into ride performance and user engagement."
            >
                <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />}>
                    Export Report
                </Button>
            </AdminPageHeader>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Rides"
                    value={kpis.totalRides}
                    icon={<Car className="w-6 h-6" />}
                    color="primary"
                />
                <StatCard
                    title="Completed"
                    value={kpis.completedRides}
                    icon={<CheckCircle className="w-6 h-6" />}
                    color="success"
                />
                <StatCard
                    title="Cancelled"
                    value={kpis.cancelledRides}
                    icon={<XCircle className="w-6 h-6" />}
                    color="danger"
                />
                <StatCard
                    title="Avg. Occupancy"
                    value={`${kpis.avgOccupancy}%`}
                    icon={<Users className="w-6 h-6" />}
                    color="info"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold font-heading mb-6">Rides Over Time</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.ridesOverTime}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="_id"
                                    stroke="#6b7280"
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#6b7280"
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        borderColor: '#374151',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    itemStyle={{ color: '#f3f4f6' }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#1f2937' }}
                                    activeDot={{ r: 6, stroke: '#818cf8', strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Placeholder for District Chart */}
                <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-16 h-16 bg-neutral rounded-full flex items-center justify-center mb-4">
                        <Car className="w-8 h-8 text-text-muted opacity-50" />
                    </div>
                    <h3 className="text-lg font-bold text-text mb-2">Regional Heatmap</h3>
                    <p className="text-text-muted text-center max-w-xs">Geographic distribution data will appear here once enough rides are logged.</p>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
