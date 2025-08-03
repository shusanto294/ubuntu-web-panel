import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, TrashIcon, ShieldCheckIcon, GlobeAltIcon } from 'lucide-react';

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSite, setNewSite] = useState({
    domain: '',
    enableSSL: false,
    enableCloudflare: false,
    serverIP: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/sites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSites(response.data);
    } catch (error) {
      console.error('Failed to fetch sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSite = async () => {
    if (!newSite.domain) return;

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/sites', newSite, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreateModal(false);
      setNewSite({ domain: '', enableSSL: false, enableCloudflare: false, serverIP: '' });
      fetchSites();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create site');
    } finally {
      setCreating(false);
    }
  };

  const deleteSite = async (siteId, domain) => {
    if (!confirm(`Are you sure you want to delete ${domain}?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/sites/${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSites();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete site');
    }
  };

  const enableSSL = async (siteId, domain) => {
    if (!confirm(`Enable SSL for ${domain}? This will request a Let's Encrypt certificate.`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/sites/${siteId}/ssl`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSites();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to enable SSL');
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your websites and their configurations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Site
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {sites.map((site) => (
            <li key={site.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <GlobeAltIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">{site.domain}</p>
                      <div className="ml-2 flex space-x-1">
                        {site.ssl_enabled && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            SSL
                          </span>
                        )}
                        {site.cloudflare_enabled && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Cloudflare
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{site.path}</p>
                    <p className="text-xs text-gray-400">
                      Created {new Date(site.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!site.ssl_enabled && (
                    <button
                      onClick={() => enableSSL(site.id, site.domain)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <ShieldCheckIcon className="w-4 h-4 mr-2" />
                      Enable SSL
                    </button>
                  )}
                  <button
                    onClick={() => deleteSite(site.id, site.domain)}
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
        {sites.length === 0 && (
          <div className="px-4 py-12 text-center">
            <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sites</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new site.</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Site</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Domain</label>
                  <input
                    type="text"
                    placeholder="example.com"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                    value={newSite.domain}
                    onChange={(e) => setNewSite({ ...newSite, domain: e.target.value })}
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      checked={newSite.enableCloudflare}
                      onChange={(e) => setNewSite({ ...newSite, enableCloudflare: e.target.checked })}
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable Cloudflare DNS</span>
                  </label>
                </div>

                {newSite.enableCloudflare && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Server IP</label>
                    <input
                      type="text"
                      placeholder="123.456.789.0"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      value={newSite.serverIP}
                      onChange={(e) => setNewSite({ ...newSite, serverIP: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      checked={newSite.enableSSL}
                      onChange={(e) => setNewSite({ ...newSite, enableSSL: e.target.checked })}
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable SSL (Let's Encrypt)</span>
                  </label>
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
                  onClick={createSite}
                  disabled={creating || !newSite.domain}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Site'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sites;