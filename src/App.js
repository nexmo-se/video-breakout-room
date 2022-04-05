import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import IndexPage from "pages/IndexPage"
import ModeratorPage from "pages/ModeratorPage"
import ParticipantPage from "pages/ParticipantPage"
import ThankYouPage from "pages/ThankYouPage"
import SessionProvider from "contexts/session";
import MessageProvider from "contexts/message";
import RoomProvider from "contexts/room";


function App() {
  return (
    <Router>
        <SessionProvider>
        <MessageProvider>
        <RoomProvider>
        <Routes>
          <Route path="/" element={<IndexPage/>}></Route>
          <Route exact path="/moderator" element={<ModeratorPage/>}></Route>
          <Route exact path="/participant" element={<ParticipantPage/>}></Route>
          <Route exact path="/thank-you" element={<ThankYouPage/>}></Route>
        </Routes>
        </RoomProvider>
        </MessageProvider>
        </SessionProvider>
    </Router>
  );
}

export default App;
