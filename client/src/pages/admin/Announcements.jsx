import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Plus, Megaphone, MapPin, Users } from 'lucide-react';
import { motion } from 'framer-motion';

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
        {
            key: 'title',
            header: 'Title',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Megaphone className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-text">{row.title}</span>
                </div>
            )
        },
        {
            key: 'message',
            header: 'Content',
            render: (row) => <div className="max-w-md truncate text-text-muted">{row.message}</div>
        },
        {
            key: 'target',
            header: 'Target Audience',
            render: (row) => (
                <div className="flex gap-2">
                    {row.targetRoles.map((role, idx) => (
                        <Badge key={idx} variant="neutral" className="capitalize">{role}</Badge>
                    ))}
                </div>
            )
        },
        { key: 'createdAt', header: 'Date Published', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    ];

    return (
        <div>
            <AdminPageHeader
                title="Announcements"
                subtitle="Broadcast messages to users and drivers."
            >
                <Button onClick={() => setShowForm(!showForm)} size="sm">
                    {showForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> New Announcement</>}
                </Button>
            </AdminPageHeader>

            {showForm && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface border border-border rounded-2xl p-6 mb-8 shadow-sm max-w-2xl"
                >
                    <h3 className="text-xl font-bold font-heading mb-6 border-b border-border pb-4">Create Announcement</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1.5 ml-1">Title</label>
                            <input
                                type="text"
                                className="w-full bg-neutral border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                placeholder="Enter announcement title"
                                value={newAnnouncement.title}
                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1.5 ml-1">Message</label>
                            <textarea
                                className="w-full bg-neutral border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors min-h-[100px]"
                                placeholder="Type your message here..."
                                value={newAnnouncement.message}
                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                                required
                            ></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold mb-1.5 ml-1 flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Target Role
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-neutral border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary appearance-none cursor-pointer"
                                        value={newAnnouncement.targetRoles}
                                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetRoles: e.target.value })}
                                    >
                                        <option value="all">All Users</option>
                                        <option value="driver">Drivers Only</option>
                                        <option value="user">Passengers Only</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 ml-1 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Target Regions (Optional)
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-neutral border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                    value={newAnnouncement.targetRegions}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetRegions: e.target.value })}
                                    placeholder="e.g. Kerala, Kochi"
                                />
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <Button type="submit">Publish Announcement</Button>
                        </div>
                    </form>
                </motion.div>
            )}

            <AdminTable
                columns={columns}
                data={announcements}
                isLoading={loading}
                emptyMessage="No announcements published yet."
            />
        </div>
    );
};

export default Announcements;
