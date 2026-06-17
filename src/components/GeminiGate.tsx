import { useState } from 'react'
import { GeminiSetup } from './GeminiSetup'
import { LifeformChat } from './LifeformChat'
import {
  clearGeminiApiKey,
  getStoredGeminiApiKey,
} from '../lib/gemini'
import type {
  Lifeform,
  Profile,
} from '../types/lifeform'

type GeminiGateProps = {
  profile: Profile
  lifeform: Lifeform
  signingOut: boolean
  onSignOut: () => Promise<void>
}

export function GeminiGate({
  profile,
  lifeform,
  signingOut,
  onSignOut,
}: GeminiGateProps) {
  const [apiKey, setApiKey] = useState<string>(
    () => getStoredGeminiApiKey(),
  )

  const handleDisconnectGemini = () => {
    clearGeminiApiKey()
    setApiKey('')
  }

  if (!apiKey) {
    return (
      <GeminiSetup
        lifeformName={lifeform.name}
        onConnected={setApiKey}
        onSignOut={onSignOut}
      />
    )
  }

  return (
    <LifeformChat
      profile={profile}
      lifeform={lifeform}
      apiKey={apiKey}
      signingOut={signingOut}
      onSignOut={onSignOut}
      onDisconnectGemini={handleDisconnectGemini}
    />
  )
}