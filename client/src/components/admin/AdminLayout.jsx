import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <div className="flex-1 ml-64 p-8 pt-24 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
