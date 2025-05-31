import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">FAFF v0</h1>
              <span className="text-sm text-gray-500">Internal Ticketing & Chat System</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Operations Team</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="h-screen">
        {children}
      </main>
    </div>
  );
};

export default Layout;