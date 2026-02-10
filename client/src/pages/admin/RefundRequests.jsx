import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { RefreshCw, CheckCircle, XCircle, Shield, MapPin, Filter } from 'lucide-react';

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
            const { data } = await api.get('/admin/refunds', config);

            setRefunds(Array.isArray(data) ? data : (data.refunds || []));
            // Assuming pagination data might be missing in some responses based on previous code
            // ensuring fallback
            setTotalPages(data.pages || 1);
        } catch (error) {
            console.error('❌ [Frontend] Refund fetch error:', error);
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

        if (!window.confirm(`Are you sure you want to ${status} this refund?`)) return;

        const action = status === 'Approved' ? 'approve' : 'reject';

        try {
            await api.put(`/admin/refunds/${id}`, {
                action,
                rejectionReason: reason
            });

            fetchRefunds(page);
            alert(`Refund ${status}`);
        } catch (error) {
            console.error('❌ [Frontend] Process refund error:', error);
            alert('Action failed');
        }
    };

    const columns = [
        {
            key: 'rideReference', header: 'Request Details', render: (row) => (
                <div className="flex items-start gap-3">
                    <div className="mt-1">
                        {row.type === 'DEPOSIT' ? (
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Shield className="w-4 h-4" />
                            </div>
                        ) : (
                            <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                                <MapPin className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-text">
                            {row.type === 'DEPOSIT' ? 'Security Deposit Refund' : `Ride Refund`}
                        </div>
                        {row.type !== 'DEPOSIT' && (
                            <div className="text-xs font-medium text-text mt-0.5">
                                {row.rideId?.source?.name || '?'} ➝ {row.rideId?.destination?.name || '?'}
                            </div>
                        )}
                        <div className="text-xs text-text-muted mt-1">
                            Driver: <span className="font-medium text-text">{row.driverId?.name}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (row) => <span className="font-bold font-mono text-text">₹{row.amount}</span>
        },
        {
            key: 'reason',
            header: 'Reason',
            render: (row) => <span className="text-sm text-text-muted italic">"{row.reason}"</span>
        },
        {
            key: 'status', header: 'Status', render: (row) => (
                <Badge variant={
                    row.status === 'Approved' ? 'success' :
                        row.status === 'Rejected' ? 'error' : 'warning'
                }>
                    {row.status}
                </Badge>
            )
        },
        { key: 'createdAt', header: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    ];

    const renderActions = (row) => {
        if (row.status !== 'Pending') return <span className="text-text-muted text-xs italic">Processed</span>;
        return (
            <div className="flex justify-end gap-2">
                <Button
                    size="sm"
                    className="h-8 px-3 text-xs bg-success hover:bg-success-hover text-white shadow-none"
                    onClick={() => handleProcessRefund(row._id, 'Approved')}
                >
                    <CheckCircle className="w-3 h-3 mr-1" /> Approve
                </Button>
                <Button
                    size="sm"
                    variant="danger"
                    className="h-8 px-3 text-xs shadow-none"
                    onClick={() => handleProcessRefund(row._id, 'Rejected')}
                >
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                </Button>
            </div>
        );
    };

    return (
        <div>
            <AdminPageHeader
                title="Refund Requests"
                subtitle="Review and process driver deposit and ride refunds."
            >
                <Button onClick={() => fetchRefunds(page)} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </AdminPageHeader>

            <div className="bg-surface border border-border rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Filter className="w-4 h-4 text-text-muted" />
                    <span className="text-sm font-medium text-text-muted mr-2">Filter by Status:</span>
                    {['Pending', 'Approved', 'Rejected', 'All'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === s
                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                : 'bg-neutral text-text-muted hover:bg-neutral-hover hover:text-text'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <AdminTable
                columns={columns}
                data={refunds}
                isLoading={loading}
                pagination={{ page, pages: totalPages, total: refunds.length }}
                onPageChange={setPage}
                actions={renderActions}
                emptyMessage="No refund requests found matching the filter."
            />
        </div>
    );
};

export default RefundRequests;
