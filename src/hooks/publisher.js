// @flow
import { useState, useEffect } from "react";
import LayoutManager from "utils/layout-manager";
import useSession from "hooks/session";
import OT from "@opentok/client";


function usePublisher(containerId, autoLayout=true, displayName=true){
  const [ publisher, setPublisher ] = useState();

  const [ stream, setStream ] = useState();
  const [ forceUnpublished, setForceUnpublished ] = useState(false);
  const [ layoutManager, setLayoutManager ] = useState(new LayoutManager(containerId));
  const mSession = useSession();

  function handleDestroyed(){
    setPublisher(null);
  }

  function handleStreamCreated(e){
    setStream(e.stream);
  }

  function handleStreamDestroyed(e){
    if (e.stream.name !== "sharescreen") e.preventDefault();
    if (e.reason === 'forceUnpublished') {
      console.log('You are forceUnpublished');
      setForceUnpublished(true)
    }
  }

  function handleAccessDenied(){
    if (publisher) {
      publisher.off("destroyed", handleDestroyed);
      publisher.off("streamCreated", handleStreamCreated);
      publisher.off("streamDestroyed", handleStreamDestroyed);
      publisher.off("accessDenied", handleAccessDenied)
      publisher.destroy();
      setPublisher(null);
    }
  }

  async function unpublish(){
    if(publisher) mSession.session.unpublish(publisher);
    layoutManager.layout();
  }

  async function publish(
    user, 
    extraData,
  ){
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

        mSession.session.publish(initPublisher);
        setPublisher(initPublisher);
      }
      else {
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
        if(element && videoType === "screen") element.classList.add("OT_big");
      }
      if (document.getElementById(containerId)) layoutManager.layout();
    }catch(err){
      console.log(err.stack);
    }
  }, [ publisher, stream, layoutManager, autoLayout, containerId ])

  return { 
    unpublish, 
    publish, 
    publisher, 
    stream,
    forceUnpublished,
    layoutManager
  }
}
export default usePublisher;