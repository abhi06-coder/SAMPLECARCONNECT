import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const UserReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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
        {
            key: 'reportedUser',
            header: 'Subject',
            render: (row) => (
                <div>
                    <div className="font-bold text-text text-sm">{row.reportedUserId?.name || 'Unknown'}</div>
                    <div className="text-xs text-text-muted">Reported by: {row.reportedBy?.name || 'Anonymous'}</div>
                </div>
            )
        },
        {
            key: 'type',
            header: 'Violation Type',
            render: (row) => (
                <div className="flex items-center gap-2 text-error font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    {row.type}
                </div>
            )
        },
        {
            key: 'description',
            header: 'Description',
            render: (row) => (
                <div className="max-w-xs">
                    <p className="text-sm text-text-muted line-clamp-2" title={row.description}>{row.description}</p>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (row) => (
                <Badge variant={row.status === 'Pending' ? 'warning' : row.status === 'Resolved' ? 'success' : 'neutral'}>
                    {row.status}
                </Badge>
            )
        },
    ];

    const renderActions = (row) => {
        if (row.status !== 'Pending') return <span className="text-text-muted text-xs italic">Closed</span>;
        return (
            <div className="flex space-x-2 justify-end">
                <Button
                    size="sm"
                    variant="danger"
                    className="h-8 px-3 text-xs"
                    onClick={() => handleAction(row._id, 'Resolved')}
                >
                    <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 text-xs"
                    onClick={() => handleAction(row._id, 'Dismissed')}
                >
                    <XCircle className="w-3 h-3 mr-1" /> Dismiss
                </Button>
            </div>
        );
    };

    return (
        <div>
            <AdminPageHeader
                title="User Reports & Abuse"
                subtitle="Investigate and resolve user reported violations."
            />

            <AdminTable
                columns={columns}
                data={reports}
                isLoading={loading}
                pagination={{ page, pages: totalPages }}
                onPageChange={setPage}
                actions={renderActions}
                emptyMessage="No pending reports."
            />
        </div>
    );
};

export default UserReports;
