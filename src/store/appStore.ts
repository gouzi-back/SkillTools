import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Skill, SkillLibrary, UserPreferences } from '../types';

/**
 * Main application store state definition
 */
interface AppState {
    // Skills data
    skills: Skill[];
    isLoading: boolean;
    error: string | null;

    // User preferences
    preferences: UserPreferences;

    // UI state
    selectedSkillId: string | null;
    searchQuery: string;
    filterFormat: string | null;
    filterTags: string[];
    currentView: 'dashboard' | 'editor' | 'settings' | 'welcome';

    // Actions - Skills
    setSkills: (skills: Skill[]) => void;
    addSkill: (skill: Skill) => void;
    updateSkill: (id: string, updates: Partial<Skill>) => void;
    removeSkill: (id: string) => void;

    // Actions - Preferences
    setPreferences: (prefs: Partial<UserPreferences>) => void;
    addLibrary: (library: SkillLibrary) => void;
    removeLibrary: (id: string) => void;
    completeOnboarding: () => void;

    // Actions - UI
    setSelectedSkill: (id: string | null) => void;
    setSearchQuery: (query: string) => void;
    setFilterFormat: (format: string | null) => void;
    setFilterTags: (tags: string[]) => void;
    setCurrentView: (view: AppState['currentView']) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

const defaultPreferences: UserPreferences = {
    libraries: [],
    theme: 'system',
    hasCompletedOnboarding: false,
};

/**
 * Robust Zustand store with persistence
 */
export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Default Initial State
            skills: [],
            isLoading: false,
            error: null,
            preferences: defaultPreferences,
            selectedSkillId: null,
            searchQuery: '',
            filterFormat: null,
            filterTags: [],
            currentView: 'welcome',

            // Skills Actions
            setSkills: (skills) => set({ skills: Array.isArray(skills) ? skills : [] }),
            addSkill: (skill) => set((state) => {
                if (!skill || !skill.id) return state;
                const currentSkills = Array.isArray(state.skills) ? state.skills : [];
                if (currentSkills.some(s => s.id === skill.id)) return state;
                return { skills: [...currentSkills, skill] };
            }),
            updateSkill: (id, updates) => set((state) => ({
                skills: (state.skills || []).map(s => s.id === id ? { ...s, ...updates } : s)
            })),
            removeSkill: (id) => set((state) => ({
                skills: (state.skills || []).filter(s => s.id !== id)
            })),

            // Preferences Actions
            setPreferences: (prefs) => set((state) => ({
                preferences: { ...state.preferences, ...prefs }
            })),
            addLibrary: (library) => set((state) => ({
                preferences: {
                    ...state.preferences,
                    libraries: [...(state.preferences?.libraries || []), library]
                }
            })),
            removeLibrary: (id) => set((state) => ({
                preferences: {
                    ...state.preferences,
                    libraries: (state.preferences?.libraries || []).filter(l => l.id !== id)
                }
            })),
            completeOnboarding: () => set((state) => ({
                preferences: { ...(state.preferences || defaultPreferences), hasCompletedOnboarding: true },
                currentView: 'dashboard'
            })),

            // UI Actions
            setSelectedSkill: (id) => set({ selectedSkillId: id }),
            setSearchQuery: (query) => set({ searchQuery: typeof query === 'string' ? query : '' }),
            setFilterFormat: (format) => set({ filterFormat: format }),
            setFilterTags: (tags) => set({ filterTags: Array.isArray(tags) ? tags : [] }),
            setCurrentView: (view) => set({ currentView: view }),
            setLoading: (loading) => set({ isLoading: !!loading }),
            setError: (error) => set({ error: error || null }),
        }),
        {
            name: 'skill_tools_v1', // Changed name to bust any corrupted storage
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                preferences: state.preferences,
                currentView: state.currentView,
            }),
        }
    )
);

/**
 * Filtered Skills Selector
 */
export const useFilteredSkills = () => {
    const skills = useAppStore(s => s.skills) || [];
    const query = (useAppStore(s => s.searchQuery) || '').toLowerCase().trim();
    const formatFilter = useAppStore(s => s.filterFormat);
    const tagFilter = useAppStore(s => s.filterTags) || [];

    let filtered = Array.isArray(skills) ? skills : [];

    if (query) {
        filtered = filtered.filter(s =>
            (s.title || '').toLowerCase().includes(query) ||
            (s.description || '').toLowerCase().includes(query)
        );
    }

    if (formatFilter) {
        filtered = filtered.filter(s => s.format === formatFilter);
    }

    if (tagFilter.length > 0) {
        filtered = filtered.filter(s => tagFilter.some(t => (s.tags || []).includes(t)));
    }

    return filtered;
};
