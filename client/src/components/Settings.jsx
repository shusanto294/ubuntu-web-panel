import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckIcon, XIcon } from 'lucide-react';

const Settings = () => {
  const [cloudflareStatus, setCloudflareStatus] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changing, setChanging] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkCloudflareConnection();
  }, []);

  const checkCloudflareConnection = async () => {
    try {
      const response = await axios.get('/api/cloudflare/test');
      setCloudflareStatus(response.data);
    } catch (error) {
      setCloudflareStatus({ 
        success: false, 
        error: error.response?.data?.error || 'Connection failed' 
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage('New password must be at least 6 characters');
      return;
    }

    setChanging(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure your web panel settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Cloudflare API</span>
                <div className="flex items-center">
                  {cloudflareStatus?.success ? (
                    <>
                      <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-sm text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <XIcon className="w-5 h-5 text-red-500 mr-2" />
                      <span className="text-sm text-red-600">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
              
              {cloudflareStatus && !cloudflareStatus.success && (
                <p className="mt-2 text-sm text-red-600">{cloudflareStatus.error}</p>
              )}
              
              {cloudflareStatus?.success && cloudflareStatus.zones && (
                <p className="mt-2 text-sm text-gray-500">
                  {cloudflareStatus.zones} zones available
                </p>
              )}
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Configuration Instructions</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>1. Create a <code className="bg-gray-100 px-1 rounded">.env</code> file in the server directory</p>
                <p>2. Copy the contents from <code className="bg-gray-100 px-1 rounded">.env.example</code></p>
                <p>3. Add your Cloudflare API token and zone ID</p>
                <p>4. Restart the server</p>
              </div>
            </div>

            <button
              onClick={checkCloudflareConnection}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Test Connection
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ 
                  ...passwordForm, 
                  currentPassword: e.target.value 
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ 
                  ...passwordForm, 
                  newPassword: e.target.value 
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ 
                  ...passwordForm, 
                  confirmPassword: e.target.value 
                })}
              />
            </div>

            {message && (
              <div className={`text-sm ${
                message.includes('successfully') ? 'text-green-600' : 'text-red-600'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={changing}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {changing ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Panel Version:</span>
            <span className="ml-2 text-gray-600">1.0.0</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Node.js Version:</span>
            <span className="ml-2 text-gray-600">{process.version || 'Unknown'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Database:</span>
            <span className="ml-2 text-gray-600">SQLite</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Web Server:</span>
            <span className="ml-2 text-gray-600">Nginx</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;