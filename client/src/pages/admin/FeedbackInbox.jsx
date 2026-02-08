import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { RefreshCw, MessageSquare, Reply, CheckCheck, Filter } from 'lucide-react';

const FeedbackInbox = () => {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('Open');

    const fetchFeedback = async (pageNumber = 1) => {
        setLoading(true);
        try {
            const config = {
                params: { pageNumber, status: filter === 'All' ? '' : filter }
            };
            const { data } = await api.get('/admin/feedback', config);

            setFeedback(data.feedback);
            setPage(data.page);
            setTotalPages(data.pages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback(1);
    }, [filter]);

    useEffect(() => {
        fetchFeedback(page);
    }, [page]);

    const handleReply = async (id) => {
        const reply = prompt("Enter your reply:");
        if (!reply) return;

        try {
            await api.put(`/admin/feedback/${id}/reply`, { reply });

            fetchFeedback(page);
            alert('Reply sent');
        } catch (error) {
            alert('Failed to send reply');
        }
    };

    const columns = [
        {
            key: 'user',
            header: 'User Details',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                        <div className="font-bold text-text text-sm">{row.userId?.name || 'Anonymous'}</div>
                        <div className="text-xs text-text-muted">{row.userId?.email || 'N/A'}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'message',
            header: 'Message Content',
            render: (row) => (
                <div className="max-w-md">
                    <p className="text-sm text-text line-clamp-2" title={row.message}>{row.message}</p>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (row) => (
                <Badge variant={row.status === 'Open' ? 'error' : 'success'}>
                    {row.status}
                </Badge>
            )
        },
        { key: 'createdAt', header: 'Submitted', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    ];

    const renderActions = (row) => {
        if (row.status !== 'Open') return (
            <div className="flex justify-end text-success text-xs font-bold items-center">
                <CheckCheck className="w-3 h-3 mr-1" /> Replied
            </div>
        );
        return (
            <div className="flex justify-end">
                <Button
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => handleReply(row._id)}
                >
                    <Reply className="w-3 h-3 mr-1" /> Reply
                </Button>
            </div>
        );
    };

    return (
        <div>
            <AdminPageHeader
                title="Feedback Inbox"
                subtitle="Manage user queries and support tickets."
            >
                <Button onClick={() => fetchFeedback(page)} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </AdminPageHeader>

            <div className="bg-surface border border-border rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-text-muted" />
                    <span className="text-sm font-medium text-text-muted mr-2">Filter by Status:</span>
                    {['Open', 'Closed', 'All'].map(s => (
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
                data={feedback}
                isLoading={loading}
                pagination={{ page, pages: totalPages }}
                onPageChange={setPage}
                actions={renderActions}
                emptyMessage="No feedback found."
            />
        </div>
    );
};

export default FeedbackInbox;
