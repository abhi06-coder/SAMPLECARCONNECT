import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/admin/DataTable';
import Button from '../../components/ui/Button';

const RefundRequests = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('Pending');

    const fetchRefunds = async (pageNumber = 1) => {
        setLoading(true);
        console.log('🔵 [Frontend] Fetching refunds...', { pageNumber, filter });
        try {
            const config = {
                params: { pageNumber, status: filter === 'All' ? '' : filter }
            };
            console.log('🔵 [Frontend] API call config:', config);
            const { data } = await api.get('/admin/refunds', config);
            console.log('✅ [Frontend] Refunds received:', data);

            setRefunds(Array.isArray(data) ? data : (data.refunds || []));

            console.log('📊 [Frontend] State updated - refunds count:', data.refunds?.length);
        } catch (error) {
            console.error('❌ [Frontend] Refund fetch error:', error);
            console.error('❌ [Frontend] Error response:', error.response);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefunds(1);
    }, [filter]);

    useEffect(() => {
        fetchRefunds(page);
    }, [page]);

    const handleProcessRefund = async (id, status) => {
        const reason = status === 'Rejected' ? prompt("Enter rejection reason:") : null;
        if (status === 'Rejected' && !reason) return;

        if (!window.confirm(`Are you sure you want to ${status} this refund? This is a simulation.`)) return;

        try {
            await api.put(`/admin/refunds/${id}`, {
                status,
                rejectionReason: reason
            });

            fetchRefunds(page);
            alert(`Refund ${status}`);
        } catch (error) {
            alert('Action failed');
        }
    };

    const columns = [
        {
            key: 'rideReference', header: 'Type / Driver', render: (row) => (
                <div>
                    <div className="font-bold">
                        {row.type === 'DEPOSIT' ? '🛡️ Security Deposit' : `Ride: ${row.rideId?.source?.name || '?'} ➝ ${row.rideId?.destination?.name || '?'}`}
                    </div>
                    <div className="text-xs text-text-muted">Driver: {row.driverId?.name} ({row.driverId?.email})</div>
                </div>
            )
        },
        { key: 'amount', header: 'Amount', render: (row) => `₹${row.amount}` },
        { key: 'reason', header: 'Reason' },
        {
            key: 'status', header: 'Status', render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.status === 'Approved' ? 'bg-green-500/10 text-green-500' :
                    row.status === 'Rejected' ? 'bg-red-500/10 text-red-500' :
                        'bg-yellow-500/10 text-yellow-500'
                    }`}>
                    {row.status}
                </span>
            )
        },
        { key: 'createdAt', header: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    ];

    const renderActions = (row) => {
        if (row.status !== 'Pending') return <span className="text-text-muted">-</span>;
        return (
            <div className="flex justify-end space-x-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleProcessRefund(row._id, 'Approved')}>
                    Approve
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleProcessRefund(row._id, 'Rejected')}>
                    Reject
                </Button>
            </div>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Refund Requests</h1>
                <div className="flex space-x-2">
                    {['Pending', 'Approved', 'Rejected', 'All'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === s ? 'bg-primary text-white' : 'bg-neutral text-text-muted hover:text-text'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {console.log('🎨 [Frontend] Rendering DataTable with refunds:', refunds, 'length:', refunds?.length)}

            <DataTable
                columns={columns}
                data={refunds}
                isLoading={loading}
                pagination={{ page, pages: totalPages }}
                onPageChange={setPage}
                actions={renderActions}
            />
        </div>
    );
};

export default RefundRequests;
