import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Search, Filter, RefreshCw, MoreVertical, Trash2, Ban, CheckCircle } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const fetchUsers = async (pageNumber = 1) => {
        setLoading(true);
        try {
            const config = {
                params: {
                    pageNumber,
                    keyword: search,
                    role: roleFilter
                }
            };

            const { data } = await api.get('/admin/users', config);

            setUsers(data.users);
            setPage(data.page);
            setTotalPages(data.pages);
            setTotalUsers(data.total);
        } catch (error) {
            console.error(error);
            // Handle error (toast etc)
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(page);
    }, [page, roleFilter]); // Search usually triggers on submit or debounce, for now simple effect

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchUsers(1);
    };

    const handleBlockUser = async (user, type) => {
        if (!window.confirm(`Are you sure you want to ${type === 'ACTIVE' ? 'Unblock' : 'Block'} ${user.name}? This action cannot be undone lightly.`)) return;

        try {
            await api.put(`/admin/users/${user._id}/status`, {
                status: type,
                blockReason: type !== 'ACTIVE' ? 'Admin Action' : null
            });

            fetchUsers(page);
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
        }
    };

    const columns = [
        {
            key: 'name', header: 'User Details', render: (user) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral to-neutral-foreground/10 flex items-center justify-center text-sm font-bold text-text-muted">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-bold text-text">{user.name}</div>
                        <div className="text-xs text-text-muted">{user.email}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'role', header: 'Role', render: (user) => (
                <Badge variant={user.role === 'driver' ? 'secondary' : 'primary'}>
                    {user.role.toUpperCase()}
                </Badge>
            )
        },
        {
            key: 'status', header: 'Status', render: (user) => (
                <Badge variant={user.status === 'ACTIVE' ? 'success' : 'error'}>
                    {user.status || 'ACTIVE'}
                </Badge>
            )
        },
        { key: 'createdAt', header: 'Joined Date', render: (user) => new Date(user.createdAt).toLocaleDateString() },
    ];

    const renderActions = (user) => (
        <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <MoreVertical className="w-4 h-4" />
            </Button>
            {user.status === 'HARD_BLOCKED' || user.status === 'SOFT_BLOCKED' ? (
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={() => handleBlockUser(user, 'ACTIVE')}
                    title="Unblock User"
                >
                    <CheckCircle className="w-3 h-3 mr-1" /> Unblock
                </Button>
            ) : (
                <Button
                    size="sm"
                    variant="danger"
                    className="h-8 px-3 text-xs"
                    onClick={() => handleBlockUser(user, 'SOFT_BLOCKED')}
                    title="Block User (5 Days)"
                >
                    <Ban className="w-3 h-3 mr-1" /> Block
                </Button>
            )}
        </div>
    );

    return (
        <div>
            <AdminPageHeader
                title="User Management"
                subtitle="Manage user roles, statuses, and permissions."
            >
                <Button onClick={() => fetchUsers(page)} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
                <Button size="sm">
                    Export Data
                </Button>
            </AdminPageHeader>

            <div className="bg-surface border border-border rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearch} className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full bg-neutral/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                            <select
                                className="bg-neutral/50 border border-border rounded-xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:border-primary appearance-none cursor-pointer hover:bg-neutral transition-colors"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="">All Roles</option>
                                <option value="user">Passenger</option>
                                <option value="driver">Driver</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <AdminTable
                columns={columns}
                data={users}
                isLoading={loading}
                pagination={{ page, pages: totalPages, total: totalUsers }}
                onPageChange={setPage}
                actions={renderActions}
                emptyMessage="No users found based on your search metrics."
            />
        </div>
    );
};

export default UserManagement;
