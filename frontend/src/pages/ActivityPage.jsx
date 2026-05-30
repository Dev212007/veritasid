import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import { Activity, Shield, Award, Lock, LogIn, RefreshCcw } from "lucide-react";

const ACTION_ICONS = {
  LOGIN: LogIn,
  DID_CREATED: Shield,
  CREDENTIAL_ISSUED: Award,
  CREDENTIAL_RECEIVED: Award,
  CREDENTIAL_VERIFIED: Shield,
  CREDENTIAL_REVOKED: RefreshCcw,
  PERMISSION_GRANTED: Lock,
  PERMISSION_REVOKED: Lock,
  PROFILE_UPDATED: Activity,
};

const ACTION_COLORS = {
  LOGIN: "text-blue-400",
  DID_CREATED: "text-cyber-400",
  CREDENTIAL_ISSUED: "text-green-400",
  CREDENTIAL_RECEIVED: "text-purple-400",
  CREDENTIAL_VERIFIED: "text-cyan-400",
  CREDENTIAL_REVOKED: "text-red-400",
  PERMISSION_GRANTED: "text-yellow-400",
  PERMISSION_REVOKED: "text-orange-400",
  PROFILE_UPDATED: "text-gray-400",
};

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/activity/my")
      .then((res) => setActivities(res.data.activities || []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-void-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <h1 className="font-display font-bold text-3xl gradient-text mb-8">Activity Log</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="glass rounded-xl p-4 border border-cyber-400/10 animate-pulse h-16" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="glass rounded-xl p-12 border border-cyber-400/10 text-center">
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-mono text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act, i) => {
              const Icon = ACTION_ICONS[act.action] || Activity;
              const color = ACTION_COLORS[act.action] || "text-gray-400";
              return (
                <div key={i} className="glass rounded-xl p-4 border border-cyber-400/10 flex items-start gap-4">
                  <div className={`mt-0.5 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`font-mono text-sm font-semibold ${color}`}>
                        {act.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs font-mono text-gray-500 flex-shrink-0">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {act.txHash && (
                      <div className="font-mono text-xs text-gray-500 mt-1 truncate">
                        TX: {act.txHash}
                      </div>
                    )}
                    {act.details && Object.keys(act.details).length > 0 && (
                      <div className="font-mono text-xs text-gray-600 mt-1">
                        {JSON.stringify(act.details).slice(0, 80)}
                        {JSON.stringify(act.details).length > 80 ? "..." : ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
