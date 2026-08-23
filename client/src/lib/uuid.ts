// UUID management - generates and stores a persistent UUID in localStorage
const UUID_KEY = "uno_player_uuid";

export function getPlayerUuid(): string {
  let uuid = localStorage.getItem(UUID_KEY);
  if (!uuid) {
    // Generate a v4 UUID without external dependency
    uuid = crypto.randomUUID();
    localStorage.setItem(UUID_KEY, uuid);
  }
  return uuid;
}

export function clearPlayerUuid(): void {
  localStorage.removeItem(UUID_KEY);
}
