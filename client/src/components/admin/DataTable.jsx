import React from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';

const DataTable = ({ columns, data, isLoading, pagination, onPageChange, actions }) => {
    if (isLoading) {
        return <div className="p-8 text-center text-text-muted">Loading data...</div>;
    }

    if (!data || data.length === 0) {
        return <div className="p-8 text-center text-text-muted">No data found.</div>;
    }

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-neutral/50 border-b border-border">
                            {columns.map((col) => (
                                <th key={col.key} className="px-6 py-4 font-semibold text-text whitespace-nowrap">
                                    {col.header}
                                </th>
                            ))}
                            {actions && <th className="px-6 py-4 font-semibold text-text text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.map((row, index) => (
                            <motion.tr
                                key={row._id || index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="hover:bg-neutral/30 transition-colors"
                            >
                                {columns.map((col) => (
                                    <td key={`${row._id}-${col.key}`} className="px-6 py-4 text-text-muted whitespace-nowrap">
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        {actions(row)}
                                    </td>
                                )}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <span className="text-sm text-text-muted">
                        Page {pagination.page} of {pagination.pages} (Total: {pagination.total})
                    </span>
                    <div className="flex space-x-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={pagination.page === 1}
                            onClick={() => onPageChange(pagination.page - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={pagination.page === pagination.pages}
                            onClick={() => onPageChange(pagination.page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
