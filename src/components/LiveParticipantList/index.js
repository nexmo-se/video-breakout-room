import { Drawer, List, Popconfirm } from 'antd';
import People from '@material-ui/icons/Work';
import Avatar from 'react-avatar';
import Button from 'components/Button';
import useMessage from 'hooks/message';
import MessageAPI from 'api/message';
import useRoom from 'hooks/room';

export default function LiveParticipantList({onClose, visible}) {
    const mMessage = useMessage();
    const mRoom = useRoom();

    async function handleChangeParticipantRole(name) {
        const newCoHostList = [...mMessage.cohosts];
        if (newCoHostList.includes(name)) {
            newCoHostList.splice(newCoHostList.indexOf(name), 1);
        }
        else {
            newCoHostList.push(name);
        }
        await MessageAPI.broadcastMsg(mRoom.currentRoom.id, 'co-host', newCoHostList);
        MessageAPI.broadcastMsg(mRoom.currentRoom.id, 'breakout-room', {"message": "roomUpdate", "breakoutRooms": mMessage.breakoutRooms});        

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
            const isCohost = mMessage.cohosts.includes(item.name);
            return (
            <>
            {item.role !== "moderator" ?
            <List.Item>
                <List.Item.Meta
                avatar={<Avatar src={`https://ui-avatars.com/api/?name=${item.name}`} round={true} size={44} style={{ marginRight: 16 }}/>}
                title={isCohost? "co-host" : item.role}
                description={item.name}
                />
                <Popconfirm
                    title={isCohost ? 
                        `Remove "${item.name}" co-host permission ?` : 
                        `Do you want to make "${item.name}" as co-host?`
                    }
                    onConfirm={() => handleChangeParticipantRole(item.name)}
                    onCancel={()=>{}}
                    okText="Yes"
                    cancelText="No"
                    value={item.name}
                >
                    <Button value={item.name} hierarchy="link" text={<People style={{fill: 'black', width: "24px", height:"24px"}}/>}></Button>
                </Popconfirm>
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