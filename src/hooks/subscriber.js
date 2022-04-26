// @flow
import { useState, useEffect } from "react";
import LayoutManager from "utils/layout-manager";
import useSession from "hooks/session";

function useSubscriber({ moderator, screen, camera, custom }){
  const [ subscribed, setSubscribed ] = useState([]);
  const [ subscribers, setSubscribers ] = useState([]);

  const [ cameraLayout, setCameraLayout ] = useState(new LayoutManager(camera));
  const [ screenLayout, setScreenLayout ] = useState(new LayoutManager(screen));
  const mSession = useSession();

  useEffect(() => {
    const { changedStream } = mSession;
    if(changedStream){
      const targetSubscriber = subscribers.find((subscriber) => subscriber.stream.id === changedStream.stream.id)
      
      if (targetSubscriber && (changedStream.changedProperty === "hasAudio")) {
        targetSubscriber.subscribeToAudio(changedStream.newValue);
      }
      if (targetSubscriber && (changedStream.changedProperty === "hasVideo")) {
        targetSubscriber.subscribeToVideo(changedStream.newValue)
      }
    }
  }, [ mSession.changedStream ])

  function getContainerId(user, videoType){
    if(user.role === "moderator" && videoType === "camera") return moderator;
    else if(videoType === "camera") return camera;
    else if(videoType === "screen") return screen;
    else return custom;
  }

  function unsubscribe() {
    subscribers.forEach((subscriber) => {
      mSession.session.unsubscribe(subscriber);
    })
      setSubscribers([]);
  }

  async function subscribe(streams){
    setSubscribed(streams);

    const streamIDs = streams.map((stream) => stream.id);
    const subscribedIDs = subscribed.map((stream) => stream.id);

    const newStreams = streams.filter((stream) => !subscribedIDs.includes(stream.id))
    const removedStreams = subscribed.filter((stream) => !streamIDs.includes(stream.id));

    removedStreams.forEach((stream) => {
      setSubscribers((prevSubscribers) => {
        return prevSubscribers.filter((subscriber) => {
          return !!subscriber.stream
        })
      })
    })

    await Promise.all(newStreams.map(async (stream) => {
      const { connection, videoType } = stream;
      const data = JSON.parse(connection.data);
      const containerId = getContainerId(data, videoType);
      const extraData = (data.role === "moderator")? { width: "100%", height: "100%" }: {}
      const finalOptions = Object.assign({}, extraData, { insertMode: "append", style: { 
        buttonDisplayMode: "on",
        nameDisplayMode: "on"
      }});
      const subscriber = await new Promise((resolve, reject) => {
        const subscriber = mSession.session.subscribe(stream, containerId, finalOptions, (err) => {
          if(!err) resolve(subscriber);
        })
      });
      setSubscribers((prevSubscribers) => [ ...prevSubscribers, subscriber ]);
    }));
  };

  useEffect(() => {
    try{
      subscribers.forEach((subscriber) => {
        const { videoType } = subscriber.stream;
        const element = document.getElementById(subscriber.id);
        if(videoType === "screen" && element) element.classList.add("OT_big");
      })

      if (document.getElementById(camera)) cameraLayout.layout();
      if (document.getElementById(screen)) screenLayout.layout();
    }catch(err){
      console.log(err.stack);
    }
  }, [ subscribers, cameraLayout, screenLayout ]);

  return { subscribe, unsubscribe, subscribers }
}
export default useSubscriber;