import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/admin/DataTable';
import Button from '../../components/ui/Button';

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
        if (!window.confirm(`Are you sure you want to ${type === 'ACTIVE' ? 'Unblock' : 'Block'} ${user.name}?`)) return;

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
            key: 'name', header: 'Name', render: (user) => (
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-neutral flex items-center justify-center text-xs font-bold">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-bold">{user.name}</div>
                        <div className="text-xs text-text-muted">{user.email}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'role', header: 'Role', render: (user) => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'driver' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                    }`}>
                    {user.role.toUpperCase()}
                </span>
            )
        },
        {
            key: 'status', header: 'Status', render: (user) => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                    {user.status || 'ACTIVE'}
                </span>
            )
        },
        { key: 'createdAt', header: 'Joined', render: (user) => new Date(user.createdAt).toLocaleDateString() },
    ];

    const renderActions = (user) => (
        <div className="flex justify-end space-x-2">
            {user.status === 'HARD_BLOCKED' ? (
                <Button size="sm" variant="outline" onClick={() => handleBlockUser(user, 'ACTIVE')}>
                    Unblock
                </Button>
            ) : (
                <Button size="sm" variant="danger" onClick={() => handleBlockUser(user, 'HARD_BLOCKED')}>
                    Block
                </Button>
            )}
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">User Management</h1>
                <div className="flex space-x-2">
                    <form onSubmit={handleSearch} className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="bg-neutral border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button size="sm" type="submit">Search</Button>
                    </form>
                    <select
                        className="bg-neutral border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="user">Passenger</option>
                        <option value="driver">Driver</option>
                    </select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={users}
                isLoading={loading}
                pagination={{ page, pages: totalPages, total: totalUsers }}
                onPageChange={setPage}
                actions={renderActions}
            />
        </div>
    );
};

export default UserManagement;
