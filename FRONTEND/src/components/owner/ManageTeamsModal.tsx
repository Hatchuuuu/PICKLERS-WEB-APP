"use client";

import { useState, useMemo } from 'react';
import { useTournamentStore } from '@/store/useTournamentStore';
import { X, Search, CheckCircle2 } from 'lucide-react';

const MOCK_PROFILES = [
    { id: 'u1', name: 'John Doe', dpr: '4.5' },
    { id: 'u2', name: 'Jane Smith', dpr: '4.2' },
    { id: 'u3', name: 'Mike Johnson', dpr: '3.8' },
    { id: 'u4', name: 'Emily Davis', dpr: '5.0' },
    { id: 'u5', name: 'Chris Wilson', dpr: '4.0' },
    { id: 'u6', name: 'Sarah Brown', dpr: '3.5' },
    { id: 'u7', name: 'David Lee', dpr: '4.8' },
    { id: 'u8', name: 'Anna Kim', dpr: '4.1' },
];

export function ManageTeamsModal({ isOpen, onClose, tournamentId }: { isOpen: boolean, onClose: () => void, tournamentId: string }) {
  const allTeams = useTournamentStore(state => state.teams);
  const updateTeam = useTournamentStore(state => state.updateTeam);
  
  const teams = useMemo(() => allTeams.filter(t => t.tournament_id === tournamentId), [allTeams, tournamentId]);
  
  const [searchQuery, setSearchQuery] = useState<{ [teamId: string]: string }>({});

  if (!isOpen) return null;

  const handleAssign = (teamId: string, profile: any) => {
      updateTeam(teamId, profile.name, profile.id);
      setSearchQuery(prev => ({ ...prev, [teamId]: '' }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-xl shadow-2xl border border-border w-full max-w-2xl overflow-hidden flex flex-col h-[80vh]">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
            <h2 className="text-xl font-bold tracking-tight">Manage Players & Teams</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <p className="text-sm text-muted-foreground mb-4">
                Assign players to the bracket slots by searching for their profile.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
                {teams.map(team => {
                    // @ts-ignore
                    const isAssigned = !!team.player_id;
                    const query = searchQuery[team.id] || '';
                    const searchResults = query.length > 1 
                        ? MOCK_PROFILES.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
                        : [];

                    return (
                        <div key={team.id} className="p-4 rounded-lg border border-border bg-card shadow-sm flex flex-col gap-3 relative">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{team.name}</span>
                                {isAssigned && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <input
                                    type="text"
                                    placeholder={isAssigned ? "Reassign player..." : "Search players..."}
                                    className="w-full bg-muted border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus:ring-primary/50"
                                    value={query}
                                    onChange={e => setSearchQuery(prev => ({ ...prev, [team.id]: e.target.value }))}
                                />
                            </div>

                            {query.length > 1 && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                                    {searchResults.map(p => (
                                        <button 
                                            key={p.id}
                                            onClick={() => handleAssign(team.id, p)}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex justify-between items-center border-b border-border last:border-0"
                                        >
                                            <span className="font-semibold">{p.name}</span>
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">DPR {p.dpr}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {query.length > 1 && searchResults.length === 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-10 p-4 text-sm text-center text-muted-foreground">
                                    No players found.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end">
            <button 
                onClick={onClose}
                className="px-5 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-md shadow-md hover:opacity-90 transition-all"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
}
