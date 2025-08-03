import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCwIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon } from 'lucide-react';

const EmailStatus = ({ refreshTrigger }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, [refreshTrigger]);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/email/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch email status:', error);
      setStatus({ success: false, error: 'Failed to fetch status' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const StatusIcon = ({ success }) => {
    if (success) {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
    return <XCircleIcon className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Mail Server Status</h3>
          <p className="mt-1 text-sm text-gray-600">
            Monitor your email server configuration and health
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCwIcon className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Server Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Server Configuration</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Mail Server Configuration</span>
              <div className="flex items-center">
                <StatusIcon success={status?.success} />
                <span className={`ml-2 text-sm ${status?.success ? 'text-green-600' : 'text-red-600'}`}>
                  {status?.success ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </div>

            {!status?.success && status?.error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <AlertCircleIcon className="w-5 h-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Configuration Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{status.error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {status?.success && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Configuration Valid</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{status.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Email Statistics</h4>
          
          {status?.statistics && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email Domains</span>
                <span className="text-sm font-medium text-gray-900">
                  {status.statistics.domains}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Email Accounts</span>
                <span className="text-sm font-medium text-gray-900">
                  {status.statistics.accounts}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Accounts</span>
                <span className="text-sm font-medium text-green-600">
                  {status.statistics.activeAccounts}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Inactive Accounts</span>
                <span className="text-sm font-medium text-red-600">
                  {status.statistics.accounts - status.statistics.activeAccounts}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Instructions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Mail Server Setup Instructions</h4>
        
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h5 className="font-medium text-gray-900">Prerequisites:</h5>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Postfix mail server installed and configured</li>
              <li>Dovecot IMAP/POP3 server installed and configured</li>
              <li>OpenDKIM for email signing (optional but recommended)</li>
              <li>Virtual mailbox user (vmail) created</li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium text-gray-900">Required Services:</h5>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium">Postfix</div>
                <div className="text-xs">Mail Transfer Agent</div>
                <code className="text-xs">systemctl status postfix</code>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium">Dovecot</div>
                <div className="text-xs">IMAP/POP3 Server</div>
                <code className="text-xs">systemctl status dovecot</code>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium">OpenDKIM</div>
                <div className="text-xs">Email Signing</div>
                <code className="text-xs">systemctl status opendkim</code>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-gray-900">Configuration Files:</h5>
            <div className="mt-2 space-y-2">
              <div className="bg-gray-50 p-2 rounded font-mono text-xs">
                <div>/etc/postfix/virtual_mailbox_domains</div>
                <div>/etc/postfix/virtual_mailbox_maps</div>
                <div>/etc/postfix/virtual_alias_maps</div>
                <div>/etc/dovecot/users</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <AlertCircleIcon className="w-5 h-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    This panel manages email configuration files directly. Ensure you have proper backups 
                    and the web panel has appropriate sudo permissions for mail server management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailStatus;