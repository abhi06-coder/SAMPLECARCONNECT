import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/admin/DataTable';
import Button from '../../components/ui/Button';

const UserReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Auto-refresh logic not implemented to keep it simple, just load on mount
    const fetchReports = async (pageNumber = 1) => {
        setLoading(true);
        try {
            const config = {
                params: { pageNumber }
            };
            const { data } = await api.get('/admin/reports', config);

            setReports(data.reports);
            setPage(data.page);
            setTotalPages(data.pages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports(page);
    }, [page]);

    const handleAction = async (id, status) => {
        const notes = prompt("Enter admin notes:");
        if (!notes) return;

        try {
            await api.put(`/admin/reports/${id}`, {
                status,
                adminNotes: notes
            });

            fetchReports(page);
        } catch (error) {
            alert('Action failed');
        }
    };

    const columns = [
        { key: 'reportedUser', header: 'Reported User', render: (row) => `${row.reportedUserId?.name} (${row.reportedUserId?.email})` },
        { key: 'reporter', header: 'Reported By', render: (row) => `${row.reportedBy?.name}` },
        { key: 'type', header: 'Type', render: (row) => <span className="text-red-500 font-bold">{row.type}</span> },
        { key: 'description', header: 'Description', render: (row) => <div className="max-w-xs truncate">{row.description}</div> },
        { key: 'status', header: 'Status', render: (row) => row.status },
    ];

    const renderActions = (row) => {
        if (row.status !== 'Pending') return <span className="text-text-muted">Resolved</span>;
        return (
            <div className="flex space-x-2 justify-end">
                <Button size="sm" variant="danger" onClick={() => handleAction(row._id, 'Resolved')}>
                    Punish/Resolve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleAction(row._id, 'Dismissed')}>
                    Dismiss
                </Button>
            </div>
        );
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">User Reports & Abuse</h1>
            <DataTable
                columns={columns}
                data={reports}
                isLoading={loading}
                pagination={{ page, pages: totalPages }}
                onPageChange={setPage}
                actions={renderActions}
            />
        </div>
    );
};

export default UserReports;
