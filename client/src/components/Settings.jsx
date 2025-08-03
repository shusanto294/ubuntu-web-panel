import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Cloud, Save, TestTube, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const Settings = () => {
  const [cloudflareSettings, setCloudflareSettings] = useState({
    apiToken: '',
    zoneId: '',
    email: ''
  });
  const [cloudflareStatus, setCloudflareStatus] = useState(null);
  const [cloudflareZones, setCloudflareZones] = useState([]);
  const [showApiToken, setShowApiToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changing, setChanging] = useState(false);
  const [message, setMessage] = useState('');
  const [cloudflareMessage, setCloudflareMessage] = useState('');

  useEffect(() => {
    loadCloudflareSettings();
    checkCloudflareConnection();
  }, []);

  const loadCloudflareSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/settings/cloudflare', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setCloudflareSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load Cloudflare settings:', error);
    }
  };

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

  const testCloudflareConnection = async () => {
    if (!cloudflareSettings.apiToken) {
      setCloudflareMessage('Please enter your API token first');
      return;
    }

    setTesting(true);
    setCloudflareMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/settings/cloudflare/test', {
        apiToken: cloudflareSettings.apiToken,
        email: cloudflareSettings.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCloudflareStatus(response.data);
        setCloudflareZones(response.data.zones || []);
        setCloudflareMessage('Connection successful! Found ' + (response.data.zones?.length || 0) + ' zones');
      } else {
        setCloudflareStatus({ success: false, error: response.data.error });
        setCloudflareMessage('Connection failed: ' + response.data.error);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Connection test failed';
      setCloudflareStatus({ success: false, error: errorMessage });
      setCloudflareMessage('Error: ' + errorMessage);
    } finally {
      setTesting(false);
    }
  };

  const saveCloudflareSettings = async () => {
    setSaving(true);
    setCloudflareMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/settings/cloudflare', cloudflareSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCloudflareMessage('Settings saved successfully!');
      
      // Test connection after saving
      setTimeout(() => {
        checkCloudflareConnection();
      }, 1000);
    } catch (error) {
      setCloudflareMessage('Failed to save settings: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Cloudflare Configuration */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Cloud className="w-6 h-6 text-orange-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Cloudflare Configuration</h3>
            </div>
            <div className="flex items-center">
              {cloudflareStatus?.success ? (
                <>
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-sm text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {/* API Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Token *
              </label>
              <div className="relative">
                <input
                  type={showApiToken ? "text" : "password"}
                  placeholder="Enter your Cloudflare API token"
                  className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                  value={cloudflareSettings.apiToken}
                  onChange={(e) => setCloudflareSettings({ 
                    ...cloudflareSettings, 
                    apiToken: e.target.value 
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowApiToken(!showApiToken)}
                >
                  {showApiToken ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Get your token from: <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">Cloudflare Dashboard</a>
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                value={cloudflareSettings.email}
                onChange={(e) => setCloudflareSettings({ 
                  ...cloudflareSettings, 
                  email: e.target.value 
                })}
              />
            </div>

            {/* Zone Selection */}
            {cloudflareZones.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Zone
                </label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                  value={cloudflareSettings.zoneId}
                  onChange={(e) => setCloudflareSettings({ 
                    ...cloudflareSettings, 
                    zoneId: e.target.value 
                  })}
                >
                  <option value="">Select a zone...</option>
                  {cloudflareZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Messages */}
            {cloudflareMessage && (
              <div className={`text-sm p-3 rounded-md ${
                cloudflareMessage.includes('successful') || cloudflareMessage.includes('Found') 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {cloudflareMessage}
              </div>
            )}

            {cloudflareStatus?.success && cloudflareStatus.zones && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  ✅ Connected to Cloudflare with {cloudflareStatus.zones} zones available
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={testCloudflareConnection}
                disabled={testing || !cloudflareSettings.apiToken}
                className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TestTube className="w-4 h-4 mr-2" />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              
              <button
                onClick={saveCloudflareSettings}
                disabled={saving || !cloudflareSettings.apiToken}
                className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            {/* Help Information */}
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-800 mb-1">API Token Requirements:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Permissions: Zone:Zone:Read, Zone:DNS:Edit</li>
                    <li>• Include your domains in the zone resources</li>
                    <li>• Copy the token immediately after creation</li>
                  </ul>
                </div>
              </div>
            </div>
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