import React, { useState } from 'react';
import { useHistory } from '@docusaurus/router';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useAuth, supabase } from '../hooks/useAuth';

function OnboardingContent() {
  const { user, loading, fetchProfile } = useAuth();
  const history = useHistory();
  
  const [publisherId, setPublisherId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Guard: Protect route
  if (!loading && !user) {
    history.push('/login');
    return null;
  }

  const handleSetupProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    const cleanId = publisherId.toLowerCase().trim();
    if (!/^[a-z0-9-]+$/.test(cleanId)) {
      setError('Publisher ID can only contain lowercase letters, numbers, and hyphens.');
      return;
    }

    setSaving(true);

    // Insert into database
    const { error: dbError } = await supabase.from('publishers').insert({
      id: user.id,
      publisher_id: cleanId,
      display_name: user?.user_metadata?.full_name || cleanId,
      avatar_url: user?.user_metadata?.avatar_url || ''
    });

    if (dbError) {
      if (dbError.code === '23505') { // Postgres unique constraint violation code
        setError('This Publisher ID is already taken.');
      } else {
        setError(dbError.message);
      }
      setSaving(false);
    } else {
      // Success! Fetch the new profile to update state and redirect
      await fetchProfile(user.id);
      history.push('/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d1117] text-white">
      <div className="p-8 bg-[#161b22] border border-gray-800 rounded-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-2">Claim your Publisher ID</h2>
        <p className="text-gray-400 mb-6 text-sm">
          This ID will uniquely identify your extensions in the Mono Studio ecosystem. 
          It must exactly match the "publisher" field in your manifest.json.
        </p>

        <form onSubmit={handleSetupProfile}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Publisher ID</label>
            <div className="flex items-center border border-gray-700 rounded-lg bg-[#0d1117] px-3 py-2">
              <span className="text-gray-500 mr-1">@</span>
              <input
                type="text"
                value={publisherId}
                onChange={(e) => setPublisherId(e.target.value)}
                placeholder="cranonic"
                className="bg-transparent border-none outline-none w-full text-white"
                required
              />
            </div>
          </div>

          {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

          <button 
            type="submit" 
            disabled={saving || !publisherId}
            className="w-full py-2 px-4 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 rounded-lg font-medium transition-colors"
          >
            {saving ? 'Claiming...' : 'Claim ID & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Onboarding() {
  return (
    <BrowserOnly 
      fallback={
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      {() => <OnboardingContent />}
    </BrowserOnly>
  );
}