// Dynamische Expo-Config: erweitert app.json und steuert die Web-baseUrl
// per Umgebungsvariable, damit derselbe Code auf verschiedenen Hosts läuft:
//   - Vercel / eigene Domain (Root):        EXPO_BASE_URL nicht gesetzt → ''
//   - GitHub Pages (Unterpfad /CarMatch/):  EXPO_BASE_URL=/CarMatch
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL ?? '',
  },
})
