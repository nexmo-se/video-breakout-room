import { Drawer, List, Popconfirm, Row, Col, Tooltip } from 'antd';
import { 
    AdminPanelSettings as IconBadge,
    Settings as IconSettings, 
    Mic as IconMicOn, 
    MicOff as IconMicOff, 
    Link as IconLinkOn, 
    LinkOff as IconLinkOff, 
    PermCameraMic as IconCameraMicOn,
    Block as IconCameraMicOff 
} from '@mui/icons-material';
import Avatar from 'react-avatar';
import useMessage from 'hooks/message';
import RoomAPI from 'api/room';
import useRoom from 'hooks/room';
import useSession from 'hooks/session';

const iconStyle = {fill: 'black', width: "24px", height:"24px"}
const iconStyleHost = {fill: 'green', width: "36px", height:"36px"}
const iconStyleOn = {fill: 'green', width: "24px", height:"24px"}
const iconStyleOff = {fill: 'black', width: "24px", height:"24px"}

export default function LiveParticipantList({onClose, visible}) {
    const mMessage = useMessage();
    const mRoom = useRoom();
    const mSession = useSession();

    async function handleChangeParticipantRole(name) {
        await RoomAPI.updateParticipant(mRoom.mainRoom.id, {type: "update-participant", participant: name});
    }

    async function handleForceMuteStream (stream) {
      return await mSession.session.forceMuteStream(stream)
      .then(function() {
        console.log("successfully forceMuteStream.");
      }).catch(function(error) {
        console.log("Error: ", error);
      });
    }

    async function handleForceUnpublish (stream) {
      return await new Promise((resolve, reject) => {
        mSession.session.forceUnpublish(stream, function (error) {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            console.log("successfully forceUnpublish.");
            resolve();
          }
        });
      })
    }

    async function handleForceDisconnect (connection) {
      return await new Promise((resolve, reject) => {
        mSession.session.forceDisconnect(connection, function (error) {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            console.log("successfully forceDisconnect.");
            resolve();
          }
        });
      })
    }

    return (
    <Drawer
        title="Manage Participants"
        placement="left"
        closable={false}
        onClose={onClose}
        visible={visible}
        key="left"
      >
        { mMessage.participants.length !== 0 ?
        <List
            itemLayout="horizontal"
            dataSource={mMessage.participants}
            size="large"
            renderItem={item => {
              const _stream = mSession.streams.length && mSession.streams.find(_e => _e.name === item.name);
              const _connection = mSession.connections.length && mSession.connections.find(_e => {
                let data = JSON.parse(_e.data);
                return (data.name === item.name)
              });
              // three buttons
              const btnList = [{
                enabled: _stream && _stream.hasAudio,
                title: ["Mute Audio", "Muted"],
                onClick: (e) => { e.preventDefault(); handleForceMuteStream(_stream) },
                icon: [
                  <IconMicOn className={'btn-svg'} style={iconStyleOn} />,
                  <IconMicOff className={'btn-svg'} style={iconStyleOff} />
                ]
              },
              {
                enabled: _stream && (_stream.hasAudio || _stream.hasVideo),
                title: ["Mute Audio & Video", "Blocked"],
                onClick: (e) => { e.preventDefault(); handleForceUnpublish(_stream) },
                icon: [
                  <IconCameraMicOn className={'btn-svg'} style={iconStyleOn} />,
                  <IconCameraMicOff className={'btn-svg'} style={iconStyleOff} />
                ]
              },
              {
                enabled: _connection && _connection.id,
                title: ["Disconnect", "Disconnected"],
                onClick: (e) => { 
                    e.preventDefault(); 
                    handleForceDisconnect(_connection).then(res => {
                      let participants = mMessage.participants.filter(p =>  p.name !== item.name)
                      mMessage.setParticipants(participants)
                    }).catch()},
                icon: [
                  <IconLinkOn className={'btn-svg'} style={iconStyleOn} />,
                  <IconLinkOff className={'btn-svg'} style={iconStyleOff} />
                ]
              }]
            return (
            <>
            {item.role !== "moderator" ?
            <List.Item>
                <Row justify="center" align="top">
                <Col span={22}>
                <List.Item.Meta
                  avatar={<Avatar src={`https://ui-avatars.com/api/?name=${item.name}`} 
                  round={true} size={44} style={{ marginRight: 16 }}/>}
                  title={item.name}
                  description={item.isCohost? 'Co-Host' : item.role}
                />
                </Col>
                <Col span={2}>
                <Popconfirm
                    title={item.isCohost ? 
                        `Remove "${item.name}" co-host permission ?` : 
                        `Do you want to make "${item.name}" as co-host?`
                    }
                    onConfirm={() => handleChangeParticipantRole(item.name)}
                    onCancel={()=>{}}
                    okText="Yes"
                    cancelText="No"
                    value={item.name}
                >
                <Tooltip placement="bottom"
                    title={item.isCohost? "Remove co-host permission":"Set as Co-Host"}
                >
                  <button
                    value={item.name} 
                    className={'Vlt-btn Vlt-btn--app Vlt-btn--link'}
                  >{ item.isCohost?
                      <IconBadge className={'btn-svg-mute'} style={iconStyleHost} />
                      :
                      <IconSettings className={'btn-svg'} style={iconStyle} />
                  }</button>
                </Tooltip>

                </Popconfirm>
                </Col>
                <Col span={24}>
                {btnList.map((btn, key)=> {
                  return (
                    <Tooltip
                      key={`btn-tooltip-${key}`}
                      title={btn.enabled ? btn.title[0] : btn.title[1]} 
                      placement="bottom" >
                    <button 
                        onClick={e => btn.onClick(e)}
                        disabled={!btn.enabled}
                        className={'Vlt-btn Vlt-btn--app Vlt-btn--link'}
                    > {btn.enabled? btn.icon[0]:btn.icon[1]}
                    </button>
                    </Tooltip>
                  )
                })}
                </Col>
                </Row>
            </List.Item> : null
            }
            </>
            )}}
        />
        : null
        }
     </Drawer>
    )
}
