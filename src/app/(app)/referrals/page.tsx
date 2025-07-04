'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAllReferrals } from '@/lib/mock-data';
import type { Referral } from '@/types';
import ReferralTable from '@/components/dashboard/referral-table';
import { Gift } from 'lucide-react';

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const referralData = await fetchAllReferrals();
      setReferrals(referralData);
    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  const handleActioned = () => {
    loadReferrals();
  };

  return (
    <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8 space-y-8">
      <ReferralTable
        title={
          <div className="flex items-center">
            <Gift className="inline-block mr-3 h-6 w-6 align-middle" />
            Referral Management
          </div>
        }
        referrals={referrals}
        isLoading={loading}
        onActioned={handleActioned}
      />
    </div>
  );
}
