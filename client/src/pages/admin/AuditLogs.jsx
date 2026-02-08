import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import Badge from '../../components/ui/Badge';
import { Activity, User } from 'lucide-react';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = async (pageNumber = 1) => {
        setLoading(true);
        try {
            const config = {
                params: { pageNumber }
            };
            const { data } = await api.get('/admin/audit-logs', config);

            setLogs(data.logs);
            setPage(data.page);
            setTotalPages(data.pages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    const columns = [
        {
            key: 'actionType',
            header: 'Action',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="font-mono text-xs font-bold">{row.actionType}</span>
                </div>
            )
        },
        {
            key: 'admin',
            header: 'Admin',
            render: (row) => (
                <div className="flex items-center gap-2 text-sm">
                    <User className="w-3 h-3 text-text-muted" />
                    {row.adminId?.name || 'Unknown'}
                </div>
            )
        },
        {
            key: 'target',
            header: 'Target',
            render: (row) => (
                <Badge variant="neutral">
                    {row.targetModel.toUpperCase()} #{row.targetId ? row.targetId.substring(0, 8) : 'N/A'}...
                </Badge>
            )
        },
        {
            key: 'details',
            header: 'Change Details',
            render: (row) => (
                <div className="max-w-xs overflow-hidden text-xs font-mono text-text-muted bg-neutral rounded p-1 whitespace-nowrap">
                    {JSON.stringify(row.details || {})}
                </div>
            )
        },
        { key: 'timestamp', header: 'Timestamp', render: (row) => new Date(row.timestamp).toLocaleString() },
    ];

    return (
        <div>
            <AdminPageHeader
                title="Audit Logs"
                subtitle="Track and monitor vital administrative actions."
            />
            <AdminTable
                columns={columns}
                data={logs}
                isLoading={loading}
                pagination={{ page, pages: totalPages }}
                onPageChange={setPage}
                emptyMessage="No audit logs recorded."
            />
        </div>
    );
};

export default AuditLogs;
