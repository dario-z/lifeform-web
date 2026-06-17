import { useState } from 'react'
import { GeminiSetup } from './GeminiSetup'
import { LifeformHome } from './LifeformHome'
import { getStoredGeminiApiKey } from '../lib/gemini'
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
    <LifeformHome
      profile={profile}
      lifeform={lifeform}
      signingOut={signingOut}
      onSignOut={onSignOut}
    />
  )
}