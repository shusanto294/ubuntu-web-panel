import { useState, useEffect } from 'react';
import axios from 'axios';
import { GlobeAltIcon, CloudIcon, ServerIcon, CheckCircleIcon, MailIcon } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSites: 0,
    activeSites: 0,
    cloudflareEnabled: 0,
    sslEnabled: 0,
    totalEmailAccounts: 0,
    emailDomains: 0
  });
  const [recentSites, setRecentSites] = useState([]);
  const [cloudflareStatus, setCloudflareStatus] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    checkCloudflareConnection();
    checkEmailStatus();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch sites data
      const sitesResponse = await axios.get('/api/sites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sites = sitesResponse.data;
      setRecentSites(sites.slice(0, 5));
      
      // Fetch email data
      const [domainsResponse, accountsResponse] = await Promise.all([
        axios.get('/api/email/domains', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/email/accounts', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setStats({
        totalSites: sites.length,
        activeSites: sites.filter(site => site.status === 'active').length,
        cloudflareEnabled: sites.filter(site => site.cloudflareEnabled).length,
        sslEnabled: sites.filter(site => site.sslEnabled).length,
        emailDomains: domainsResponse.data.length,
        totalEmailAccounts: accountsResponse.data.length
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCloudflareConnection = async () => {
    try {
      const response = await axios.get('/api/cloudflare/test');
      setCloudflareStatus(response.data);
    } catch (error) {
      setCloudflareStatus({ success: false, error: error.response?.data?.error || 'Connection failed' });
    }
  };

  const checkEmailStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/email/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailStatus(response.data);
    } catch (error) {
      setEmailStatus({ success: false, error: error.response?.data?.error || 'Email status unavailable' });
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of your Ubuntu web server
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GlobeAltIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Sites
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalSites}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Sites
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeSites}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CloudIcon className="h-8 w-8 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Cloudflare Enabled
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.cloudflareEnabled}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ServerIcon className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    SSL Enabled
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.sslEnabled}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MailIcon className="h-8 w-8 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Email Domains
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.emailDomains}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MailIcon className="h-8 w-8 text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Email Accounts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalEmailAccounts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Sites
            </h3>
            <div className="mt-5">
              {recentSites.length > 0 ? (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {recentSites.map((site) => (
                      <li key={site.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {site.domain}
                            </p>
                            <p className="text-sm text-gray-500">
                              Created {new Date(site.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {site.ssl_enabled && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                SSL
                              </span>
                            )}
                            {site.cloudflare_enabled && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                CF
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No sites created yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              System Status
            </h3>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cloudflare API</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  cloudflareStatus?.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {cloudflareStatus?.success ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {cloudflareStatus && !cloudflareStatus.success && (
                <p className="text-sm text-red-600">{cloudflareStatus.error}</p>
              )}
              {cloudflareStatus?.success && cloudflareStatus.zones && (
                <p className="text-sm text-gray-500">
                  {cloudflareStatus.zones} zones available
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Server</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  emailStatus?.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {emailStatus?.success ? 'Running' : 'Not Available'}
                </span>
              </div>
              {emailStatus && !emailStatus.success && (
                <p className="text-sm text-red-600">{emailStatus.error}</p>
              )}
              {emailStatus?.success && emailStatus.statistics && (
                <p className="text-sm text-gray-500">
                  {emailStatus.statistics.activeAccounts} active email accounts
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;