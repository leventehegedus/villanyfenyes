/** Player page link; players have no site id, so team id + name identify them. */
export const playerPath = (teamId: string, name: string, keep: string) =>
  `/j/${encodeURIComponent(teamId)}/${encodeURIComponent(name)}${keep}`
