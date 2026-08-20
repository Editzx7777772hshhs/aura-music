import React, { useEffect } from "react";

import Sidebar from "./components/Sidebar";
import NowPlayingBar from "./components/NowPlayingBar";
import HomeGrid from "./components/HomeGrid";
import Hader from "./components/Hader";
import Album from "./components/Album";
import Search from "./components/Search";
import Artist from "./components/Artist";
import Register from "./Register";
import Liked from "./components/Liked";
import AddToPlaylistModel from "./components/AddToPlaylistModel";
import CreateAlbumPopup from "./components/CreateAlbumPopup";
import SongPopupOptions from "./components/SongPopupOptions";
import Playlist from "./components/Playlist";
import { Switch, Route } from "react-router-dom";
import Cookies from "universal-cookie";
import getUserInfo from "./handlers/getUserInfo";
import { useStateValue } from "./StateProvider";
import { ToastContainer } from "react-toastify";

function App() {
  const cookies = new Cookies();
  const [{ isLogin }, dispatch] = useStateValue();

  const setUserInfo = async () => {
    try {
      const token = cookies.get("loginToken");
      if (token) {
        const data = await getUserInfo(token);
        dispatch({
          type: "SET_USER",
          item: data,
        });
        dispatch({
          type: "LOGIN_STATUS",
          item: true,
        });
      }
    } catch (error) {
      console.error("User info fetch failed:", error);
    }
  };

  useEffect(() => {
    if (cookies.get("loginToken")) {
      setUserInfo();
    }
  }, [isLogin]);

  return (
    <div className="app">
      <ToastContainer position="bottom-center" autoClose={3000} />

      <Switch>
        <Route exact path="/register" component={Register} />
        
        <Route>
          {/* Global UI Layout */}
          <Hader />
          <Sidebar />
          <NowPlayingBar />
          <CreateAlbumPopup />
          <SongPopupOptions />
          <AddToPlaylistModel />

          {/* Main Pages Content */}
          <div id="main-content">
            <Switch>
              <Route exact path="/" component={HomeGrid} />
              <Route exact path="/album/:id" component={Album} />
              <Route exact path="/search" component={Search} />
              <Route exact path="/search/:query" component={Search} />
              <Route exact path="/artist/:id" component={Artist} />
              <Route exact path="/liked" component={Liked} />
              <Route exact path="/playlist/:id" component={Playlist} />
            </Switch>
          </div>
        </Route>
      </Switch>
    </div>
  );
}

export default App;
