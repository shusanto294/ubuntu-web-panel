import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, TrashIcon, EditIcon, KeyIcon, BarChart3Icon } from 'lucide-react';

const EmailAccounts = ({ domains, selectedDomain, setSelectedDomain, refreshTrigger, onRefresh }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [newAccount, setNewAccount] = useState({
    email: '',
    password: '',
    quota: 1000,
    aliases: [''],
    forwards: ['']
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [selectedDomain, refreshTrigger]);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/email/domains', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.length > 0 && !selectedDomain) {
        setSelectedDomain(response.data[0].domain);
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = selectedDomain ? { domain: selectedDomain } : {};
      const response = await axios.get('/api/email/accounts', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setAccounts(response.data);
    } catch (error) {
      console.error('Failed to fetch email accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    if (!newAccount.email || !newAccount.password) return;

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const accountData = {
        ...newAccount,
        aliases: newAccount.aliases.filter(alias => alias.trim()),
        forwards: newAccount.forwards.filter(forward => forward.trim())
      };

      await axios.post('/api/email/accounts', accountData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreateModal(false);
      setNewAccount({
        email: '',
        password: '',
        quota: 1000,
        aliases: [''],
        forwards: ['']
      });
      fetchAccounts();
      onRefresh();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create email account');
    } finally {
      setCreating(false);
    }
  };

  const updateAccount = async () => {
    if (!editingAccount) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        quota: editingAccount.quota,
        aliases: editingAccount.aliases.filter(alias => alias.trim()),
        forwards: editingAccount.forwards.filter(forward => forward.trim()),
        isActive: editingAccount.isActive
      };

      await axios.put(`/api/email/accounts/${editingAccount._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowEditModal(false);
      setEditingAccount(null);
      fetchAccounts();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update email account');
    } finally {
      setUpdating(false);
    }
  };

  const deleteAccount = async (accountId, email) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/email/accounts/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAccounts();
      onRefresh();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete email account');
    }
  };

  const changePassword = async (accountId, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/email/accounts/${accountId}/password`, 
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowPasswordModal(false);
      alert('Password updated successfully');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to change password');
    }
  };

  const getUsage = async (accountId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/email/accounts/${accountId}/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Usage: ${response.data.used}MB / ${response.data.quota}MB (${response.data.percentage}%)`);
    } catch (error) {
      alert('Failed to get usage information');
    }
  };

  const addField = (field) => {
    if (field === 'aliases') {
      setNewAccount(prev => ({ ...prev, aliases: [...prev.aliases, ''] }));
    } else if (field === 'forwards') {
      setNewAccount(prev => ({ ...prev, forwards: [...prev.forwards, ''] }));
    }
  };

  const removeField = (field, index) => {
    if (field === 'aliases') {
      setNewAccount(prev => ({ 
        ...prev, 
        aliases: prev.aliases.filter((_, i) => i !== index) 
      }));
    } else if (field === 'forwards') {
      setNewAccount(prev => ({ 
        ...prev, 
        forwards: prev.forwards.filter((_, i) => i !== index) 
      }));
    }
  };

  const updateField = (field, index, value) => {
    if (field === 'aliases') {
      const newAliases = [...newAccount.aliases];
      newAliases[index] = value;
      setNewAccount(prev => ({ ...prev, aliases: newAliases }));
    } else if (field === 'forwards') {
      const newForwards = [...newAccount.forwards];
      newForwards[index] = value;
      setNewAccount(prev => ({ ...prev, forwards: newForwards }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Email Accounts</h3>
            <p className="mt-1 text-sm text-gray-600">
              Manage email accounts and their settings
            </p>
          </div>
          
          {domains.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Filter by Domain</label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="mt-1 block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Domains</option>
                {domains.map((domain) => (
                  <option key={domain._id} value={domain.domain}>
                    {domain.domain}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Account
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {accounts.map((account) => (
            <li key={account._id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📧</span>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">{account.email}</p>
                      <div className="ml-2 flex space-x-1">
                        {account.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Disabled
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      <p>Quota: {account.quota}MB | Used: {account.usedQuota || 0}MB</p>
                      {account.aliases?.length > 0 && (
                        <p>Aliases: {account.aliases.join(', ')}</p>
                      )}
                      {account.forwards?.length > 0 && (
                        <p>Forwards: {account.forwards.join(', ')}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Created {new Date(account.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => getUsage(account._id)}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <BarChart3Icon className="w-3 h-3 mr-1" />
                    Usage
                  </button>
                  <button
                    onClick={() => {
                      setEditingAccount(account);
                      setShowEditModal(true);
                    }}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <EditIcon className="w-3 h-3 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setEditingAccount(account);
                      setShowPasswordModal(true);
                    }}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <KeyIcon className="w-3 h-3 mr-1" />
                    Password
                  </button>
                  <button
                    onClick={() => deleteAccount(account._id, account.email)}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-red-700 bg-white hover:bg-gray-50"
                  >
                    <TrashIcon className="w-3 h-3 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {accounts.length === 0 && (
          <div className="px-4 py-12 text-center">
            <span className="text-4xl">📧</span>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No email accounts</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedDomain 
                ? `No email accounts found for ${selectedDomain}`
                : 'Get started by creating your first email account.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Email Account</h3>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      placeholder="user@domain.com"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      value={newAccount.email}
                      onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value.toLowerCase() })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      value={newAccount.password}
                      onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Quota (MB)</label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                    value={newAccount.quota}
                    onChange={(e) => setNewAccount({ ...newAccount, quota: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Aliases</label>
                  {newAccount.aliases.map((alias, index) => (
                    <div key={index} className="flex mt-1">
                      <input
                        type="email"
                        placeholder="alias@domain.com"
                        className="flex-1 border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                        value={alias}
                        onChange={(e) => updateField('aliases', index, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeField('aliases', index)}
                        className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField('aliases')}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Alias
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Forward To</label>
                  {newAccount.forwards.map((forward, index) => (
                    <div key={index} className="flex mt-1">
                      <input
                        type="email"
                        placeholder="forward@example.com"
                        className="flex-1 border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                        value={forward}
                        onChange={(e) => updateField('forwards', index, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeField('forwards', index)}
                        className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField('forwards')}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Forward
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={createAccount}
                  disabled={creating || !newAccount.email || !newAccount.password}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && editingAccount && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Change Password for {editingAccount.email}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                    id="newPassword"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const newPassword = document.getElementById('newPassword').value;
                    changePassword(editingAccount._id, newPassword);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailAccounts;