import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/admin/DataTable';
import Button from '../../components/ui/Button';

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
        { key: 'user', header: 'User', render: (row) => `${row.userId?.name} (${row.userId?.email})` },
        {
            key: 'message', header: 'Message', render: (row) => (
                <div className="max-w-md truncate" title={row.message}>{row.message}</div>
            )
        },
        {
            key: 'status', header: 'Status', render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.status === 'Open' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                    {row.status}
                </span>
            )
        },
        { key: 'createdAt', header: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    ];

    const renderActions = (row) => {
        if (row.status !== 'Open') return <span className="text-text-muted">Closed</span>;
        return (
            <Button size="sm" onClick={() => handleReply(row._id)}>
                Reply
            </Button>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Feedback / Queries</h1>
                <div className="flex space-x-2">
                    {['Open', 'Closed', 'All'].map(s => (
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

            <DataTable
                columns={columns}
                data={feedback}
                isLoading={loading}
                pagination={{ page, pages: totalPages }}
                onPageChange={setPage}
                actions={renderActions}
            />
        </div>
    );
};

export default FeedbackInbox;
