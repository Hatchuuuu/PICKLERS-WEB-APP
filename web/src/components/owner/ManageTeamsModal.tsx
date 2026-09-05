"use client";

import { useState, useMemo, useEffect } from 'react';
import { useTournamentStore } from '@/store/useTournamentStore';
import { X, Search, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SearchProfile {
    id: string;
    name?: string;
    email?: string;
    dpr?: string | number;
}

export function ManageTeamsModal({ isOpen, onClose, tournamentId }: { isOpen: boolean, onClose: () => void, tournamentId: string }) {
  const allTeams = useTournamentStore(state => state.teams);
  const updateTeam = useTournamentStore(state => state.updateTeam);
  
  const teams = useMemo(() => allTeams.filter(t => t.tournament_id === tournamentId), [allTeams, tournamentId]);
  
  const [searchQuery, setSearchQuery] = useState<{ [teamId: string]: string }>({});
  const [searchResults, setSearchResults] = useState<{ [teamId: string]: SearchProfile[] }>({});

  useEffect(() => {
      Object.keys(searchQuery).forEach(async (teamId) => {
          const query = searchQuery[teamId];
          if (query && query.length > 1) {
              try {
                  // In a real implementation this would query a profiles or users table
                  // For now, we simulate finding players or returning empty
                  const { data, error } = await supabase
                      .from('auth.users') // Or 'profiles' if it exists
                      .select('*')
                      .limit(5);
                  
                  if (!error && data) {
                      setSearchResults(prev => ({ ...prev, [teamId]: data }));
                  } else {
                      setSearchResults(prev => ({ ...prev, [teamId]: [] }));
                  }
              } catch (e) {
                  setSearchResults(prev => ({ ...prev, [teamId]: [] }));
              }
          } else {
              setSearchResults(prev => ({ ...prev, [teamId]: [] }));
          }
      });
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleAssign = (teamId: string, profile: SearchProfile) => {
      updateTeam(teamId, profile.name || profile.email || 'Unknown Player', profile.id);
      setSearchQuery(prev => ({ ...prev, [teamId]: '' }));
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 backdrop-blur-[2px] dark:bg-black/50 p-4" onClick={onClose}>
      <div className="bg-surface-overlay dark:bg-[#13223F] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-border dark:border-white/12 w-full max-w-2xl overflow-hidden flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-interactive/30">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Manage Players & Teams</h2>
            <button onClick={onClose} aria-label="Close modal" className="p-2 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 border border-border transition-colors text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <p className="text-sm text-muted-foreground mb-4">
                Assign players to the bracket slots by searching for their profile.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
                {teams.map(team => {
                    const isAssigned = !!team.player_id;
                    const query = searchQuery[team.id] || '';
                    const results = searchResults[team.id] || [];

                    return (
                        <div key={team.id} className="p-4 rounded-xl border border-border bg-surface-interactive/40 shadow-sm flex flex-col gap-3 relative">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{team.name}</span>
                                {isAssigned && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <input
                                    type="text"
                                    placeholder={isAssigned ? "Reassign player..." : "Search players..."}
                                    className="w-full bg-surface-interactive border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus:ring-emerald-500/50"
                                    value={query}
                                    onChange={e => setSearchQuery(prev => ({ ...prev, [team.id]: e.target.value }))}
                                />
                            </div>

                            {query.length > 1 && results.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-overlay border border-border rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto">
                                    {results.map((p: SearchProfile) => (
                                        <button 
                                            key={p.id}
                                            onClick={() => handleAssign(team.id, p)}
                                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-interactive transition-colors flex justify-between items-center border-b border-border last:border-0 cursor-pointer text-foreground"
                                        >
                                            <span className="font-semibold">{p.name || p.email}</span>
                                            <span className="text-xs bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">DPR {p.dpr || 'N/A'}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {query.length > 1 && results.length === 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-overlay border border-border rounded-xl shadow-2xl z-20 p-4 text-sm text-center text-muted-foreground">
                                    No players found.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="px-6 py-4 bg-surface-overlay border-t border-border flex justify-end">
            <button 
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
}
