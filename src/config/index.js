export default {
    moderatorPin: process.env.REACT_APP_MODERATOR_PIN ?? "5523",
    participantPin: process.env.REACT_APP_PARTICIPANT_PIN ?? "1123",
    keepAllConnection: process.env.REACT_APP_KEEP_ALL_CONNECTIONS && process.env.REACT_APP_KEEP_ALL_CONNECTIONS.toLowerCase() === 'yes' ? true : false  // Set value to "true" if you want to stay connection to main session from a breakout room session.
  }