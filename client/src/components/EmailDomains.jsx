import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, TrashIcon, KeyIcon } from 'lucide-react';

const EmailDomains = ({ onDomainChange, setDomains, refreshTrigger }) => {
  const [domains, setLocalDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [creating, setCreating] = useState(false);
  const [showDKIMModal, setShowDKIMModal] = useState(false);
  const [selectedDKIM, setSelectedDKIM] = useState(null);

  useEffect(() => {
    fetchDomains();
  }, [refreshTrigger]);

  const fetchDomains = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/email/domains', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocalDomains(response.data);
      setDomains(response.data);
    } catch (error) {
      console.error('Failed to fetch email domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDomain = async () => {
    if (!newDomain) return;

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/email/domains', 
        { domain: newDomain }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowCreateModal(false);
      setNewDomain('');
      fetchDomains();
      onDomainChange();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create email domain');
    } finally {
      setCreating(false);
    }
  };

  const deleteDomain = async (domainId, domainName) => {
    if (!confirm(`Are you sure you want to delete the email domain ${domainName}?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/email/domains/${domainId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDomains();
      onDomainChange();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete email domain');
    }
  };

  const showDKIMKeys = (domain) => {
    setSelectedDKIM(domain);
    setShowDKIMModal(true);
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
        <div>
          <h3 className="text-lg font-medium text-gray-900">Email Domains</h3>
          <p className="mt-1 text-sm text-gray-600">
            Configure domains for email hosting
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Domain
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {domains.map((domain) => (
            <li key={domain._id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">{domain.domain}</p>
                      <div className="ml-2 flex space-x-1">
                        {domain.isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                        {domain.dkimEnabled && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            DKIM
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      <p>{domain.currentAccounts} / {domain.maxAccounts} accounts</p>
                      <p className="text-xs text-gray-400">
                        Created {new Date(domain.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {domain.dkimEnabled && (
                    <button
                      onClick={() => showDKIMKeys(domain)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <KeyIcon className="w-4 h-4 mr-2" />
                      DKIM Keys
                    </button>
                  )}
                  <button
                    onClick={() => deleteDomain(domain._id, domain.domain)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-gray-50"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {domains.length === 0 && (
          <div className="px-4 py-12 text-center">
            <span className="text-4xl">🌐</span>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No email domains</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first email domain.</p>
          </div>
        )}
      </div>

      {/* Create Domain Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Email Domain</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Domain Name</label>
                  <input
                    type="text"
                    placeholder="example.com"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This domain will be configured for email hosting with DKIM signing.
                  </p>
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
                  onClick={createDomain}
                  disabled={creating || !newDomain}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Add Domain'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DKIM Keys Modal */}
      {showDKIMModal && selectedDKIM && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                DKIM Configuration for {selectedDKIM.domain}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">DNS Record</label>
                  <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <p><strong>Type:</strong> TXT</p>
                    <p><strong>Name:</strong> default._domainkey.{selectedDKIM.domain}</p>
                    <div className="mt-2">
                      <strong>Value:</strong>
                      <textarea
                        readOnly
                        className="mt-1 block w-full h-32 text-xs font-mono border-gray-300 rounded-md shadow-sm bg-white"
                        value={selectedDKIM.dkimPublicKey || 'DKIM key not available'}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Add this TXT record to your DNS zone to enable DKIM signing for this domain.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">SPF Record</label>
                  <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <p><strong>Type:</strong> TXT</p>
                    <p><strong>Name:</strong> {selectedDKIM.domain}</p>
                    <p><strong>Value:</strong> {selectedDKIM.spfRecord}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">DMARC Record</label>
                  <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <p><strong>Type:</strong> TXT</p>
                    <p><strong>Name:</strong> _dmarc.{selectedDKIM.domain}</p>
                    <p><strong>Value:</strong> {selectedDKIM.dmarcRecord}{selectedDKIM.domain}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDKIMModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailDomains;