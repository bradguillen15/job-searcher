# Requirements — settings-screen

## R1
WHEN the user navigates to `/settings`, the system SHALL render `SettingsScreen`
as the main content area inside the existing `AppShell` layout.

## R2
The system SHALL display a page heading **Settings** at the top of
`SettingsScreen`.

## R3
The system SHALL provide an AI backend selector with exactly two options:
`ollama` and `anthropic`.

## R4
WHEN `SettingsScreen` mounts, the system SHALL load the `ai.backend` value from
the active profile `settings` table and SHALL select the matching backend
option.

## R5
IF the `ai.backend` setting is missing or not one of the two allowed values
THEN the system SHALL default the selected backend to `ollama`.

## R6
WHILE the selected AI backend is `ollama`, the system SHALL display an Ollama
base URL text field and a model selector control.

## R7
WHILE the selected AI backend is `anthropic`, the system SHALL display an
Anthropic API key password field and SHALL NOT display the Ollama URL or model
controls.

## R8
WHEN `SettingsScreen` mounts, the system SHALL load `ollama.base_url` from the
active profile `settings` table.

## R9
IF the `ollama.base_url` setting is missing THEN the system SHALL default the
Ollama base URL field to `http://localhost:11434`.

## R10
WHEN `SettingsScreen` mounts, the system SHALL load `ollama.model` from the
active profile `settings` table.

## R11
IF the `ollama.model` setting is missing THEN the system SHALL default the
model selector to `llama3.2`.

## R12
WHEN the Ollama backend section is visible, the system SHALL invoke
`window.api.invoke('ollama:list', { baseUrl })` using the current Ollama base
URL field value to populate the model selector options.

## R13
IF `ollama:list` resolves with `{ error: string }` THEN the system SHALL
display the error inline in the Ollama section and SHALL keep the saved model
value selectable even when it is absent from the fetched list.

## R14
WHEN the user activates **Save AI settings**, the system SHALL persist
`ai.backend`, `ollama.base_url`, and `ollama.model` to the active profile
`settings` table using upsert semantics.

## R15
WHEN the user activates **Save AI settings** with an empty trimmed Ollama base
URL THEN the system SHALL block the save and SHALL display a validation error.

## R16
WHEN the user activates **Save AI settings** with an Ollama base URL that does
not start with `http://` or `https://` THEN the system SHALL block the save
and SHALL display a validation error.

## R17
WHEN the user activates **Save API key** with a non-empty trimmed Anthropic API
key, the system SHALL invoke `window.api.invoke('settings:saveAnthropicKey',
{ apiKey })`.

## R18
WHEN `settings:saveAnthropicKey` succeeds, the system SHALL clear the API key
input, SHALL show a success indicator, and SHALL display the field placeholder
as configured without echoing the key value.

## R19
IF `settings:saveAnthropicKey` resolves with `{ error: string }` THEN the
system SHALL display that error inline in the Anthropic section.

## R20
WHEN the main process handles `settings:saveAnthropicKey`, the system SHALL
write or update `ANTHROPIC_API_KEY` in `{userData}/.env` and SHALL set
`process.env.ANTHROPIC_API_KEY` to the saved value.

## R21
WHEN the main process starts, the system SHALL load environment variables from
`{userData}/.env` in addition to any project-root `.env` already loaded by
`dotenv`.

## R22
WHEN `SettingsScreen` mounts, the system SHALL invoke
`window.api.invoke('settings:anthropicKeyStatus')` and SHALL show **Configured**
when the key is present in the environment and **Not configured** otherwise.

## R23
The system SHALL NOT return the Anthropic API key value to the renderer through
any IPC channel.

## R24
The system SHALL provide a theme control on `SettingsScreen` that toggles
between `dark` and `light` using the existing `useTheme` hook.

## R25
WHEN the user toggles theme on `SettingsScreen`, the system SHALL apply the
theme to the `<html>` element and SHALL persist the preference in
`localStorage` under the key `theme`, matching sidebar behavior.

## R26
The system SHALL provide a default date range selector with exactly five
options: `24h`, `7d`, `30d`, `60d`, and `90d`.

## R27
WHEN `SettingsScreen` mounts, the system SHALL load `scout.default_date_range`
from the active profile `settings` table.

## R28
IF `scout.default_date_range` is missing or invalid THEN the system SHALL
default the selector to `30d`.

## R29
WHEN the user changes the default date range selection, the system SHALL
persist `scout.default_date_range` to the active profile `settings` table
immediately.

## R30
WHEN `SettingsScreen` mounts, the system SHALL invoke
`window.api.invoke('profiles:activeDbPath')` and SHALL display the returned
absolute database file path in a read-only field using the mono font
convention.

## R31
The system SHALL provide an **Open in Finder** button adjacent to the database
path field.

## R32
WHEN the user activates **Open in Finder**, the system SHALL invoke
`window.api.invoke('fs:openPath', dbPath)` with the displayed database path.

## R33
IF `fs:openPath` resolves with `{ error: string }` THEN the system SHALL
display that error adjacent to the database path controls.

## R34
WHEN the main process handles `ollama:list` with payload `{ baseUrl: string }`,
the system SHALL request `GET {baseUrl}/api/tags` and SHALL return
`{ models: string[] }` containing each model `name` from the Ollama response.

## R35
IF the Ollama tags request fails or returns a non-success HTTP status THEN
`ollama:list` SHALL resolve with `{ error: string }` and SHALL NOT throw.

## R36
WHEN the main process handles `profiles:activeDbPath`, the system SHALL return
the absolute filesystem path to the active profile's `jobscout.db` file.
