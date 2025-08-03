import { useState, useEffect } from 'react';
import EmailDomains from './EmailDomains';
import EmailAccounts from './EmailAccounts';
import EmailStatus from './EmailStatus';

const Email = () => {
  const [activeTab, setActiveTab] = useState('accounts');
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tabs = [
    { id: 'accounts', name: 'Email Accounts', icon: '📧' },
    { id: 'domains', name: 'Email Domains', icon: '🌐' },
    { id: 'status', name: 'Mail Server Status', icon: '📊' }
  ];

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage email domains, accounts, and mail server configuration
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'accounts' && (
          <EmailAccounts 
            domains={domains}
            selectedDomain={selectedDomain}
            setSelectedDomain={setSelectedDomain}
            refreshTrigger={refreshTrigger}
            onRefresh={triggerRefresh}
          />
        )}
        {activeTab === 'domains' && (
          <EmailDomains 
            onDomainChange={triggerRefresh}
            setDomains={setDomains}
            refreshTrigger={refreshTrigger}
          />
        )}
        {activeTab === 'status' && (
          <EmailStatus refreshTrigger={refreshTrigger} />
        )}
      </div>
    </div>
  );
};

export default Email;