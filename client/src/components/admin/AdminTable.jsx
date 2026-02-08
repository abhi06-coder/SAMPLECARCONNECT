import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AdminTable = ({
    columns,
    data,
    isLoading,
    pagination,
    onPageChange,
    actions,
    emptyMessage = "No data found."
}) => {
    if (isLoading) {
        return (
            <div className="w-full bg-surface border border-border rounded-2xl p-6 space-y-4 shadow-sm animate-pulse">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-neutral rounded-xl w-full opacity-50" />
                ))}
            </div>
        );
    }

    return (
        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-neutral border-b border-border">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className="text-left py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider"
                                >
                                    {col.header}
                                </th>
                            ))}
                            {actions && <th className="py-4 px-6 text-right text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.length > 0 ? (
                            data.map((row, idx) => (
                                <tr
                                    key={row._id || idx}
                                    className="hover:bg-neutral/50 transition-colors duration-200 group"
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className="py-4 px-6 text-sm text-text font-medium">
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="py-4 px-6 text-right">
                                            {actions(row)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    className="py-12 text-center text-text-muted"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border bg-neutral/30">
                    <span className="text-sm text-text-muted">
                        Showing page <span className="font-bold text-text">{pagination.page}</span> of <span className="font-bold text-text">{pagination.pages}</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="p-2 rounded-lg hover:bg-neutral disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                            className="p-2 rounded-lg hover:bg-neutral disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTable;
