// Public API for the "profile" feature.
export { ProfilePage } from "./components/ProfilePage";
// Shared with people/personnel's EditPersonnelModal — see updateUserProfile's
// own comment for why it isn't "self-only" despite living in this feature.
export { getMyProfile, updateUserProfile, type CoreMe, type UpdateProfileInput } from "./services/profile-api";
