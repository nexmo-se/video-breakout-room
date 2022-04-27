import { Drawer, List, Popconfirm, Row, Col, Tooltip } from 'antd';
import { 
    Work as IconWork, 
    MicOff as IconMicOff, 
    LinkOff as IconLinkOff, 
    VoiceOverOff as IconVoiceOverOff 
} from '@mui/icons-material';
import Avatar from 'react-avatar';
import Button from 'components/Button';
import useMessage from 'hooks/message';
import RoomAPI from 'api/room';
import useRoom from 'hooks/room';
import useSession from 'hooks/session';

const iconStyle = {fill: 'black', width: "24px", height:"24px"}

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
        {
          console.log(mSession.streams)
          //console.log(mMessage.participants)
        }
        { mMessage.participants.length !== 0 ?
        <List
            itemLayout="horizontal"
            dataSource={mMessage.participants}
            size="large"
            renderItem={item => {
            const isCohost = mMessage.cohosts? mMessage.cohosts.includes(item.name):false;
            const _stream = mSession.streams.length && mSession.streams.find(_e => _e.name === item.name);
            // three buttons
            const btnList = [{
              enabled: _stream && _stream.hasAudio,
              title: ["Mute Audio", "Muted Audio"],
              onClick: (e) => { e.preventDefault(); handleForceMuteStream(_stream) },
              icon: <IconMicOff className={'btn-svg'} style={iconStyle} />
            },
            {
              enabled: _stream && (_stream.hasAudio || _stream.hasVideo),
              title: ["Mute Audio & Video", "Muted Audio & Video"],
              onClick: (e) => { e.preventDefault(); handleForceUnpublish(_stream) },
              icon: <IconVoiceOverOff className={'btn-svg'} style={iconStyle} />
            },
            {
              enabled: _stream && _stream.connection,
              title: ["Disconnect", "Disconnected"],
              onClick: (e) => { 
                  e.preventDefault(); 
                  handleForceDisconnect(_stream.connection).then(res => {
                    let participants = mMessage.participants.filter(p =>  p.name !== item.name)
                    mMessage.setParticipants(participants)
                  }).catch()},
              icon: <IconLinkOff className={'btn-svg'} style={iconStyle} />
            }]
            return (
            <>
            {item.role !== "moderator" ?
            <List.Item>
                <Row gutter={16}>
                <Col className="gutter-row" span={24}>
                <List.Item.Meta
                  avatar={<Avatar src={`https://ui-avatars.com/api/?name=${item.name}`} round={true} size={44} style={{ marginRight: 16 }}/>}
                  title={isCohost? "co-host" : item.role}
                  description={item.name}
                />
                </Col>
                <Col className="gutter-row" span={24}>
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
                <Tooltip title="Set as co-host" placement="bottom">
                    <button 
                        value={item.name} 
                        className={'Vlt-btn Vlt-btn--app Vlt-btn--link'}
                    ><IconWork className={'btn-svg'} style={iconStyle} />
                    </button>
                </Tooltip>
                </Popconfirm>

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
                    > {btn.icon}
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
