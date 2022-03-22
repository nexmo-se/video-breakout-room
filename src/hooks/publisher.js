// @flow
import { useState, useEffect } from "react";
import LayoutManager from "utils/layout-manager";
import useSession from "hooks/session";
import OT from "@opentok/client";


function usePublisher(containerId, autoLayout=true, displayName=true){
  const [ publisher, setPublisher ] = useState();
  const [ stream, setStream ] = useState();
  const [ layoutManager, setLayoutManager ] = useState(new LayoutManager(containerId));
  const [ onAccessDenied, setOnAccessDenied ] = useState();
  const [ nameDisplayMode, setNameDisplayMode ] = useState(displayName);
  const mSession = useSession();

  useEffect(() => {
    console.log("container id", containerId)
  }, [containerId]);

  function handleDestroyed(){
    setPublisher(undefined);
  }

  function handleStreamCreated({ stream }){
    setStream(stream);
  }

  function handleStreamDestroyed(e){
    e.preventDefault();
    setStream(null);
  }

  function handleAccessDenied(){
    alert("Please enable camera and microphone access to conitnue. Refresh the page when you are done.");
    if(onAccessDenied) onAccessDenied();
  }

  async function unpublish(){
    if(publisher) mSession.session.unpublish(publisher);
    else throw new Error("Cannot unpublish. No publisher found");
    layoutManager.layout();
  }

  async function publish(
    user, 
    extraData,
    onAccessDenied
  ){
    setOnAccessDenied(onAccessDenied);
    try{
      if(!mSession.session) throw new Error("You are not connected to session");
      const options = { 
        insertMode: "append",
        name: user.name,
        style: { 
          buttonDisplayMode: "off",
          nameDisplayMode: displayName? "on": "off"
        }
      };
      const finalOptions = Object.assign({}, options, extraData);
      if (!publisher) {

        const initPublisher = OT.initPublisher(containerId, finalOptions);
        console.log("publisher2", initPublisher);

        mSession.session.publish(initPublisher);
        setPublisher(initPublisher);
      }
      else {
        console.log("publisher1", publisher);
        mSession.session.publish(publisher);
      }
    }catch(err){
      console.log(err.stack);
    }
  }

  useEffect(() => {
    if (publisher) {
      publisher.on("destroyed", handleDestroyed);
      publisher.on("streamCreated", handleStreamCreated);
      publisher.on("streamDestroyed", handleStreamDestroyed);
      publisher.on("accessDenied", handleAccessDenied)
    }
  }, [publisher])

  useEffect(() => {
    try{
      if(autoLayout && stream && publisher) {
        const { videoType } = stream;
        const element = document.getElementById(publisher.id);
        console.log("element", element);
        if(element && videoType === "screen") element.classList.add("OT_big");
      }
      layoutManager.layout();
    }catch(err){
      console.log(err.stack);
    }
  }, [ publisher, stream ])

  return { 
    unpublish, 
    publish, 
    publisher, 
    stream,
    layoutManager
  }
}
export default usePublisher;