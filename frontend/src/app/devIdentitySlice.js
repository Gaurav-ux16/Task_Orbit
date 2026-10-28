import { createSlice } from '@reduxjs/toolkit';

// DEV IDENTITY — NOT production auth
// In production, this would be replaced by verified Supabase Auth data.
const DEV_PROFILES = [
  { id: 'client-001',   display_name: 'Alice Chen',    role: 'client' },
  { id: 'manager-001',  display_name: 'Bob Martinez',  role: 'project_manager' },
  { id: 'assignee-001', display_name: 'Carol Singh',   role: 'assignee' },
  { id: 'assignee-002', display_name: 'Dave Kim',      role: 'assignee' },
  { id: 'reviewer-001', display_name: 'Eve Johnson',   role: 'reviewer' },
];

const savedId = localStorage.getItem('devUserId') || 'manager-001';
const initialProfile = DEV_PROFILES.find((p) => p.id === savedId) || DEV_PROFILES[1];

const devIdentitySlice = createSlice({
  name: 'devIdentity',
  initialState: {
    currentUser: initialProfile,
    profiles: DEV_PROFILES,
  },
  reducers: {
    switchUser(state, action) {
      const profile = state.profiles.find((p) => p.id === action.payload);
      if (profile) {
        state.currentUser = profile;
        localStorage.setItem('devUserId', profile.id);
      }
    },
  },
});

export const { switchUser } = devIdentitySlice.actions;
export default devIdentitySlice.reducer;

export const selectCurrentUser = (state) => state.devIdentity.currentUser;
export const selectAllProfiles = (state) => state.devIdentity.profiles;
