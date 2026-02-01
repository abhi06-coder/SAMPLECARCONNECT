import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/admin/DataTable';

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
        { key: 'actionType', header: 'Action', render: (row) => <span className="font-mono text-xs">{row.actionType}</span> },
        { key: 'admin', header: 'Admin', render: (row) => row.adminId?.name || 'Unknown' },
        { key: 'target', header: 'Target', render: (row) => `${row.targetModel} (${row.targetId})` },
        {
            key: 'details', header: 'Details', render: (row) => (
                <div className="max-w-xs overflow-hidden text-xs text-text-muted">
                    {JSON.stringify(row.details).substring(0, 50)}...
                </div>
            )
        },
        { key: 'timestamp', header: 'Time', render: (row) => new Date(row.timestamp).toLocaleString() },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Audit Logs</h1>
            <p className="text-text-muted mb-4">Tracking all administrative actions.</p>
            <DataTable
                columns={columns}
                data={logs}
                isLoading={loading}
                pagination={{ page, pages: totalPages }}
                onPageChange={setPage}
            />
        </div>
    );
};

export default AuditLogs;
