import { v4 as uuidv4 } from 'uuid'

const JITSI_BASE_URL = 'https://meet.jit.si'

export function generateJitsiMeetingLink(): string {
  const roomName = `room-${uuidv4()}`
  return `${JITSI_BASE_URL}/${roomName}#config.prejoinPageEnabled=false&config.lobbyEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`
}
