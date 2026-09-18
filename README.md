# Recreation App

A recreational game web application.

## Patch Notes

### v0.01
* Initial project setup.
* Added basic UI components and game structure (Header, Survival OX Quiz).
* Security patch: Configured `.gitignore` to prevent environment variables and API keys from being committed.
* Prepared repository for GitHub integration and initial deployment build.

### v1.2.0
* Added participant score syncing and host mini-board integration for real-time tracking.
* Restrict access directly to Landing; require host-generated room codes.
* Improved UI on Participant Mobile View.
* Added QR code capability to Host Dashboard.

### v1.3.0
* **Host Control & Sync:** Enforced team settings. When Host changes between Team and Solo mode, all active participants are forced back to the lobby form to re-enter.
* **Game Bugs Fixed:** Fixed infinite loops in Bomb Pass (clear passedBomb status) and Nunchi Game (added Safe/Passed state to prevent duplicate hits).
* **Lobby Enhancements:** Significantly enlarged QR code in Lobby and added an active, real-time connected users list to the Host Dashboard.

### v1.3.1
* **Sync Stability:** Refactored `GameContext.jsx` to use functional state updates (`updateRoomState`), resolving a closure stale-state bug where participant screens would hang indefinitely on 'Waiting...' despite the host starting games like Bomb Pass or Nunchi.
* **Host UI Improvement:** Added the active participant list directly to the room setup lobby, allowing the host to monitor incoming connections before finalizing the room.
