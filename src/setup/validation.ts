import { isPlayerCount, MAX_PLAYER_NAME_LENGTH } from './config'

export interface SetupValidationInput {
  playerCount: number
  playerNames: readonly string[]
  playerColors: readonly string[]
  availableColorIds: readonly string[]
}

export interface SetupValidationResult {
  isValid: boolean
  playerCountError: string | null
  playerNameErrors: (string | null)[]
  playerColorErrors: (string | null)[]
  errors: string[]
}

export function validateSetup({
  playerCount,
  playerNames,
  playerColors,
  availableColorIds,
}: SetupValidationInput): SetupValidationResult {
  const playerCountError = isPlayerCount(playerCount) ? null : 'Choose 2, 3, or 4 players.'
  const fieldsToValidate = isPlayerCount(playerCount)
    ? playerCount
    : Number.isInteger(playerCount) && playerCount > 0
      ? Math.min(playerCount, Math.max(playerNames.length, playerColors.length))
      : 0
  const usedNames = new Set<string>()
  const usedColors = new Set<string>()
  const playerNameErrors = Array.from({ length: fieldsToValidate }, (_, index) => {
    const name = playerNames[index]?.trim() ?? ''

    if (name.length === 0) {
      return 'Enter a name for this player.'
    }

    if (name.length > MAX_PLAYER_NAME_LENGTH) {
      return `Names must be ${MAX_PLAYER_NAME_LENGTH} characters or fewer.`
    }

    const normalizedName = name.toLowerCase()

    if (usedNames.has(normalizedName)) {
      return 'Player names must be unique.'
    }

    usedNames.add(normalizedName)
    return null
  })
  const playerColorErrors = Array.from({ length: fieldsToValidate }, (_, index) => {
    const color = playerColors[index]

    if (!color || !availableColorIds.includes(color)) {
      return 'Choose a valid token color.'
    }

    if (usedColors.has(color)) {
      return 'Choose a token color not used by another player.'
    }

    usedColors.add(color)
    return null
  })
  const errors = [playerCountError, ...playerNameErrors, ...playerColorErrors].filter(
    (error): error is string => error !== null,
  )

  return {
    isValid: errors.length === 0,
    playerCountError,
    playerNameErrors,
    playerColorErrors,
    errors,
  }
}
