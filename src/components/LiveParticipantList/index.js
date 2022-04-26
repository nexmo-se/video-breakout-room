import { Drawer, List, Popconfirm } from 'antd';
import People from '@material-ui/icons/Work';
import Avatar from 'react-avatar';
import Button from 'components/Button';
import useMessage from 'hooks/message';
import RoomAPI from 'api/room';
import useRoom from 'hooks/room';

export default function LiveParticipantList({onClose, visible}) {
    const mMessage = useMessage();
    const mRoom = useRoom();

    async function handleChangeParticipantRole(name) {
        await RoomAPI.updateParticipant(mRoom.mainRoom.id, {type: "update-participant", participant: name});
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
            return (
            <>
            {item.role !== "moderator" ?
            <List.Item>
                <List.Item.Meta
                avatar={<Avatar src={`https://ui-avatars.com/api/?name=${item.name}`} round={true} size={44} style={{ marginRight: 16 }}/>}
                title={item.isCohost? "co-host" : item.role}
                description={item.name}
                />
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