import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, TrashIcon, EditIcon } from 'lucide-react';

const DNS = () => {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: 'A',
    name: '',
    content: '',
    ttl: 300
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    if (selectedZone) {
      fetchRecords();
    }
  }, [selectedZone]);

  const fetchZones = async () => {
    try {
      const response = await axios.get('/api/cloudflare/zones');
      if (response.data.success) {
        setZones(response.data.result);
        if (response.data.result.length > 0) {
          setSelectedZone(response.data.result[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    }
  };

  const fetchRecords = async () => {
    if (!selectedZone) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/cloudflare/zones/${selectedZone}/dns`);
      if (response.data.success) {
        setRecords(response.data.result);
      }
    } catch (error) {
      console.error('Failed to fetch DNS records:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async () => {
    if (!newRecord.name || !newRecord.content) return;

    setCreating(true);
    try {
      await axios.post(`/api/cloudflare/zones/${selectedZone}/dns`, newRecord);
      setShowCreateModal(false);
      setNewRecord({ type: 'A', name: '', content: '', ttl: 300 });
      fetchRecords();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create DNS record');
    } finally {
      setCreating(false);
    }
  };

  const deleteRecord = async (recordId, name) => {
    if (!confirm(`Are you sure you want to delete the DNS record for ${name}?`)) return;

    try {
      await axios.delete(`/api/cloudflare/zones/${selectedZone}/dns/${recordId}`);
      fetchRecords();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete DNS record');
    }
  };

  const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DNS Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your Cloudflare DNS records
          </p>
        </div>
        {selectedZone && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Record
          </button>
        )}
      </div>

      {zones.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Zone
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TTL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.type === 'A' ? 'bg-blue-100 text-blue-800' :
                          record.type === 'CNAME' ? 'bg-green-100 text-green-800' :
                          record.type === 'MX' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {record.content}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.ttl === 1 ? 'Auto' : record.ttl}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteRecord(record.id, record.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {records.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No DNS records found for this zone.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {zones.length === 0 && (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">
            No Cloudflare zones found. Please check your API configuration in Settings.
          </p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add DNS Record</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={newRecord.type}
                    onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                  >
                    {recordTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    placeholder="www"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                    value={newRecord.name}
                    onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <input
                    type="text"
                    placeholder={newRecord.type === 'A' ? '192.168.1.1' : 'example.com'}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                    value={newRecord.content}
                    onChange={(e) => setNewRecord({ ...newRecord, content: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">TTL</label>
                  <select
                    value={newRecord.ttl}
                    onChange={(e) => setNewRecord({ ...newRecord, ttl: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                  >
                    <option value={1}>Auto</option>
                    <option value={300}>5 minutes</option>
                    <option value={600}>10 minutes</option>
                    <option value={1800}>30 minutes</option>
                    <option value={3600}>1 hour</option>
                    <option value={86400}>1 day</option>
                  </select>
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
                  onClick={createRecord}
                  disabled={creating || !newRecord.name || !newRecord.content}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Add Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DNS;