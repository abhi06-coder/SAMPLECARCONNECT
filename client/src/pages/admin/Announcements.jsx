import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/admin/DataTable';
import Button from '../../components/ui/Button';

const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        message: '',
        targetRoles: 'all',
        targetRegions: ''
    });

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/announcements');
            setAnnouncements(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/announcements', {
                ...newAnnouncement,
                targetRoles: [newAnnouncement.targetRoles], // backend expects array
                targetRegions: newAnnouncement.targetRegions ? newAnnouncement.targetRegions.split(',').map(s => s.trim()) : []
            });

            setShowForm(false);
            setNewAnnouncement({ title: '', message: '', targetRoles: 'all', targetRegions: '' });
            fetchAnnouncements();
        } catch (error) {
            alert('Failed to create announcement');
        }
    };

    const columns = [
        { key: 'title', header: 'Title', render: (row) => <span className="font-bold">{row.title}</span> },
        { key: 'message', header: 'Message', render: (row) => <div className="max-w-md truncate">{row.message}</div> },
        { key: 'target', header: 'Target', render: (row) => row.targetRoles.join(', ') },
        { key: 'createdAt', header: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Announcements</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : 'New Announcement'}
                </Button>
            </div>

            {showForm && (
                <div className="bg-card border border-border rounded-xl p-6 mb-8">
                    <h3 className="text-xl font-bold mb-4">Create Announcement</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input
                                type="text"
                                className="w-full bg-neutral border border-border rounded-lg px-4 py-2"
                                value={newAnnouncement.title}
                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Message</label>
                            <textarea
                                className="w-full bg-neutral border border-border rounded-lg px-4 py-2"
                                value={newAnnouncement.message}
                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                                required
                            ></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Target Role</label>
                                <select
                                    className="w-full bg-neutral border border-border rounded-lg px-4 py-2"
                                    value={newAnnouncement.targetRoles}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetRoles: e.target.value })}
                                >
                                    <option value="all">All Users</option>
                                    <option value="driver">Drivers Only</option>
                                    <option value="user">Passengers Only</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Target Regions (comma sep, optional)</label>
                                <input
                                    type="text"
                                    className="w-full bg-neutral border border-border rounded-lg px-4 py-2"
                                    value={newAnnouncement.targetRegions}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetRegions: e.target.value })}
                                    placeholder="e.g. Kerala, Kochi"
                                />
                            </div>
                        </div>
                        <Button type="submit" fullWidth>Publish Announcement</Button>
                    </form>
                </div>
            )}

            <DataTable
                columns={columns}
                data={announcements}
                isLoading={loading}
            />
        </div>
    );
};

export default Announcements;
